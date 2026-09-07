/**
 * Run lifecycle: create, commit a round, branch by rewinding, and switch sides.
 *
 * This layer is still pure. Identifiers and timestamps are supplied by the
 * caller so that replaying an exported run produces an identical result.
 */
import {
  OTHER_ROLE,
  type ActionId,
  type EnvironmentId,
  type GameRun,
  type GameState,
  type PreparedRound,
  type Role,
  type RoundRecord,
  type RunMode,
  type ScriptEntry,
} from "@/domain/schema";
import {
  EngineError,
  actionVerdict,
  createInitialState,
  evaluateActions,
  prepareRound,
  resolveRound,
  snapshotHash,
} from "@/domain/engine";
import { chooseOpponentAction } from "@/domain/opponent";
import { getEnvironment, getScenario } from "@/content/scenarios";

export interface CreateRunOptions {
  id: string;
  createdAt: string;
  role: Role;
  environmentId: EnvironmentId;
  scenarioId: string;
  label?: string;
  mode?: RunMode;
  parentId?: string | null;
  opponentScript?: ScriptEntry[] | null;
  fixedOpponent?: boolean;
}

function initialStateFor(scenarioId: string, environmentId: EnvironmentId): GameState {
  const scenario = getScenario(scenarioId);
  return createInitialState(scenario, getEnvironment(scenario, environmentId));
}

function prepare(state: GameState, environmentId: EnvironmentId): PreparedRound {
  const scenario = getScenario(state.scenarioId);
  return prepareRound(state, getEnvironment(scenario, environmentId));
}

export function createRun(options: CreateRunOptions): GameRun {
  const scenario = getScenario(options.scenarioId);
  const state = initialStateFor(options.scenarioId, options.environmentId);
  return {
    id: options.id,
    parentId: options.parentId ?? null,
    mode: options.mode ?? "standard",
    label: options.label ?? "New run",
    createdAt: options.createdAt,
    role: options.role,
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    engineVersion: state.engineVersion,
    environmentId: options.environmentId,
    rounds: [],
    pending: prepare(state, options.environmentId),
    state,
    opponentScript: options.opponentScript ?? null,
    fixedOpponent: options.fixedOpponent ?? false,
  };
}

/* ------------------------------------------------------------------ */
/* Opponent selection                                                  */
/* ------------------------------------------------------------------ */

export interface OpponentChoice {
  actionId: ActionId;
  /** Set when a scripted move was illegal and had to fall back to hold. */
  substitution: string | null;
  explanation: string;
}

/**
 * In a switch-sides run the opponent replays the recorded action script.
 * An illegal scripted move becomes "hold" with a stated reason; it is never
 * silently upgraded to a different, stronger move.
 */
export function decideOpponent(
  run: GameRun,
  preparedState: GameState,
): OpponentChoice {
  const opponentRole = OTHER_ROLE[run.role];

  if (run.fixedOpponent && run.opponentScript) {
    const entry = run.opponentScript.find(
      (e) => e.quarter === preparedState.quarter,
    );
    if (!entry) {
      return {
        actionId: "hold",
        substitution: `The recorded strategy has no move for Q${preparedState.quarter}, so the script holds.`,
        explanation:
          "Fixed-opponent comparison: the opponent replays the strategy you recorded rather than recomputing a policy.",
      };
    }
    const verdict = actionVerdict(preparedState, opponentRole, entry.actionId);
    if (!verdict.legal) {
      return {
        actionId: "hold",
        substitution: `Recorded move "${entry.actionId}" is illegal here: ${verdict.reason} Substituted with hold rather than a different move.`,
        explanation:
          "Fixed-opponent comparison: the opponent replays the strategy you recorded rather than recomputing a policy.",
      };
    }
    return {
      actionId: entry.actionId,
      substitution: null,
      explanation:
        "Fixed-opponent comparison: the opponent replays the strategy you recorded rather than recomputing a policy.",
    };
  }

  const decision = chooseOpponentAction(preparedState, opponentRole);
  return {
    actionId: decision.actionId,
    substitution: null,
    explanation: decision.explanation,
  };
}

/* ------------------------------------------------------------------ */
/* Committing a round                                                  */
/* ------------------------------------------------------------------ */

function describeVisibleInformation(
  run: GameRun,
  preparedState: GameState,
  prepared: PreparedRound,
): string[] {
  const visible = [
    `Q${preparedState.quarter} opening position for both companies, after any project activations.`,
    "Full parameter set and formulas (methodology page).",
    "The opponent's committed move is hidden until you lock yours.",
    "The environment event schedule is hidden until an event fires or research reveals it.",
  ];
  for (const event of prepared.events) {
    if (event.kind === "environment-event") {
      visible.push(`Public event revealed this quarter: ${event.headline}.`);
    }
    if (event.kind === "project-activated") {
      visible.push(`Activated: ${event.headline}.`);
    }
  }
  for (const note of preparedState.researchNotes[run.role]) {
    visible.push(
      `Research bought in Q${note.purchasedInQuarter} about Q${note.aboutQuarter}: ${note.headline}.`,
    );
  }
  return visible;
}

export function commitRound(
  run: GameRun,
  playerActionId: ActionId,
  rationale: string,
): GameRun {
  if (!run.pending) {
    throw new EngineError("There is no prepared round to commit.");
  }
  const prepared = run.pending;
  const preparedState = prepared.state;

  const verdict = actionVerdict(preparedState, run.role, playerActionId);
  if (!verdict.legal) {
    throw new EngineError(
      `That commitment is not available: ${verdict.reason ?? "unknown reason"}`,
    );
  }

  const opponent = decideOpponent(run, preparedState);
  const { nextState, events } = resolveRound(
    preparedState,
    { role: run.role, actionId: playerActionId, rationale },
    { role: OTHER_ROLE[run.role], actionId: opponent.actionId },
  );

  const record: RoundRecord = {
    quarter: preparedState.quarter,
    snapshotHash: snapshotHash(preparedState),
    playerRole: run.role,
    playerAction: playerActionId,
    opponentAction: opponent.actionId,
    // Stored as plain data. Nothing reads it back into the engine.
    rationale,
    informationVisible: describeVisibleInformation(run, preparedState, prepared),
    alternatives: evaluateActions(preparedState, run.role),
    prepareEvents: prepared.events,
    events,
    opponentExplanation: opponent.explanation,
    substitution: opponent.substitution,
    preparedState,
    resultState: nextState,
  };

  return {
    ...run,
    rounds: [...run.rounds, record],
    state: nextState,
    pending: nextState.finished ? null : prepare(nextState, run.environmentId),
  };
}

/* ------------------------------------------------------------------ */
/* Branching                                                           */
/* ------------------------------------------------------------------ */

/**
 * Rewind to the pre-decision snapshot of `quarter` and return a NEW run.
 * The original run object is never modified: earlier decisions and the external
 * event sequence are preserved, and the opponent policy is recomputed from the
 * branched state unless this is a fixed-opponent comparison.
 */
export function rewindTo(
  run: GameRun,
  quarter: number,
  id: string,
  createdAt: string,
): GameRun {
  const index = run.rounds.findIndex((r) => r.quarter === quarter);
  if (index === -1) {
    throw new EngineError(
      `Q${quarter} has not been played in this run, so there is nothing to rewind to.`,
    );
  }
  const round = run.rounds[index];
  const previousState =
    index === 0
      ? initialStateFor(run.scenarioId, run.environmentId)
      : run.rounds[index - 1].resultState;

  return {
    ...run,
    id,
    parentId: run.id,
    mode: "branch",
    label: `Branch from Q${quarter}`,
    createdAt,
    rounds: run.rounds.slice(0, index),
    state: previousState,
    pending: { state: round.preparedState, events: round.prepareEvents },
  };
}

/**
 * Start a fresh run on the other side of the same scenario and environment,
 * with the completed run's player actions as a fixed opponent script.
 */
export function switchSides(
  run: GameRun,
  id: string,
  createdAt: string,
): GameRun {
  if (run.rounds.length === 0) {
    throw new EngineError(
      "Play at least one quarter before switching sides; there is no recorded strategy yet.",
    );
  }
  return createRun({
    id,
    createdAt,
    role: OTHER_ROLE[run.role],
    environmentId: run.environmentId,
    scenarioId: run.scenarioId,
    mode: "switch-sides",
    parentId: run.id,
    label: "Against your recorded strategy",
    opponentScript: run.rounds.map((r) => ({
      quarter: r.quarter,
      actionId: r.playerAction,
    })),
    fixedOpponent: true,
  });
}

/* ------------------------------------------------------------------ */
/* Deterministic rebuild from a recorded action script                 */
/* ------------------------------------------------------------------ */

export interface ScriptedRound {
  quarter: number;
  playerAction: ActionId;
  opponentAction: ActionId;
  rationale: string;
  substitution: string | null;
}

/**
 * Rebuild a complete run from nothing but its metadata and recorded actions.
 * Import uses this to prove that an exported ledger reproduces exactly.
 */
export function rebuildRun(
  meta: CreateRunOptions,
  scripted: ScriptedRound[],
): GameRun {
  let run = createRun(meta);
  for (const step of scripted) {
    if (!run.pending) {
      throw new EngineError(
        `The recorded run has a move for Q${step.quarter} but the game had already finished.`,
      );
    }
    if (run.pending.state.quarter !== step.quarter) {
      throw new EngineError(
        `Recorded round order is wrong: expected Q${run.pending.state.quarter}, found Q${step.quarter}.`,
      );
    }
    const preparedState = run.pending.state;
    const verdict = actionVerdict(preparedState, run.role, step.playerAction);
    if (!verdict.legal) {
      throw new EngineError(
        `Recorded Q${step.quarter} move "${step.playerAction}" is not legal in the rebuilt state: ${verdict.reason}`,
      );
    }
    const { nextState, events } = resolveRound(
      preparedState,
      { role: run.role, actionId: step.playerAction, rationale: step.rationale },
      { role: OTHER_ROLE[run.role], actionId: step.opponentAction },
    );
    const record: RoundRecord = {
      quarter: step.quarter,
      snapshotHash: snapshotHash(preparedState),
      playerRole: run.role,
      playerAction: step.playerAction,
      opponentAction: step.opponentAction,
      rationale: step.rationale,
      informationVisible: describeVisibleInformation(run, preparedState, run.pending),
      alternatives: evaluateActions(preparedState, run.role),
      prepareEvents: run.pending.events,
      events,
      opponentExplanation: "Rebuilt from the recorded action script.",
      substitution: step.substitution,
      preparedState,
      resultState: nextState,
    };
    run = {
      ...run,
      rounds: [...run.rounds, record],
      state: nextState,
      pending: nextState.finished ? null : prepare(nextState, run.environmentId),
    };
  }
  return run;
}

/** The action script a completed run would hand to a switch-sides session. */
export function playerScript(run: GameRun): ScriptEntry[] {
  return run.rounds.map((r) => ({ quarter: r.quarter, actionId: r.playerAction }));
}
