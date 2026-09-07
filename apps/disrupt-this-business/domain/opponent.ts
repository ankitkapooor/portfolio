/**
 * The P0 opponent.
 *
 * Deliberately simple and fully disclosed on the methodology page:
 *   1. enumerate legal actions in catalog order,
 *   2. forecast up to two quarters assuming the other side holds and no further
 *      public events occur,
 *   3. maximise forecast ending cash,
 *   4. tie-break on higher ending customer count, then catalog order.
 *
 * Information isolation is structural, not a convention: this module only ever
 * reads `publicSnapshot(preparedState)`, and it never receives the player's
 * unlocked action or the environment schedule. It cannot see either.
 */
import {
  OTHER_ROLE,
  type ActionId,
  type Environment,
  type GameState,
  type Role,
} from "@/domain/schema";
import {
  evaluateActions,
  money,
  prepareRound,
  publicSnapshot,
  resolveRound,
  totalCustomers,
} from "@/domain/engine";

/** Forecast horizon in quarters, clipped to the quarters that remain. */
export const OPPONENT_LOOKAHEAD = 2;

/** Two forecasts within this many dollars count as a tie. */
const CASH_TIE_EPSILON = 1e-6;

export interface OpponentCandidate {
  actionId: ActionId;
  legal: boolean;
  reason: string | null;
  forecastCash: number | null;
  forecastCustomers: number | null;
}

export interface OpponentDecision {
  actionId: ActionId;
  quartersForecast: number;
  candidates: OpponentCandidate[];
  explanation: string;
}

/**
 * The environment the opponent forecasts under: the current preset with no
 * known future events. The real schedule is never passed to this module.
 */
function blindEnvironment(state: GameState): Environment {
  return {
    id: state.environmentId,
    label: "Public information only",
    description: "Forecast environment containing no future events.",
    disclosedEvents: [],
    schedule: [],
  };
}

function forecast(
  snapshot: GameState,
  role: Role,
  actionId: ActionId,
  quarters: number,
): { cash: number; customers: number } {
  const other = OTHER_ROLE[role];
  const environment = blindEnvironment(snapshot);

  let state = resolveRound(
    snapshot,
    { role, actionId },
    { role: other, actionId: "hold" },
  ).nextState;

  for (let ahead = 1; ahead < quarters; ahead += 1) {
    if (state.finished) break;
    const prepared = prepareRound(state, environment).state;
    state = resolveRound(
      prepared,
      { role, actionId: "hold" },
      { role: other, actionId: "hold" },
    ).nextState;
  }

  return {
    cash: state.companies[role].cash,
    customers: totalCustomers(state, role),
  };
}

export function chooseOpponentAction(
  preparedState: GameState,
  role: Role,
): OpponentDecision {
  // Strip hidden information before any of it can influence the choice.
  const snapshot = publicSnapshot(preparedState);
  const remaining = snapshot.totalRounds - snapshot.quarter + 1;
  const quarters = Math.max(1, Math.min(OPPONENT_LOOKAHEAD, remaining));

  const candidates: OpponentCandidate[] = evaluateActions(snapshot, role).map(
    (verdict) => {
      if (!verdict.legal) {
        return {
          actionId: verdict.actionId,
          legal: false,
          reason: verdict.reason,
          forecastCash: null,
          forecastCustomers: null,
        };
      }
      const result = forecast(snapshot, role, verdict.actionId, quarters);
      return {
        actionId: verdict.actionId,
        legal: true,
        reason: null,
        forecastCash: result.cash,
        forecastCustomers: result.customers,
      };
    },
  );

  let best: OpponentCandidate | null = null;
  for (const candidate of candidates) {
    if (!candidate.legal || candidate.forecastCash === null) continue;
    if (best === null || best.forecastCash === null) {
      best = candidate;
      continue;
    }
    const cashGap = candidate.forecastCash - best.forecastCash;
    if (cashGap > CASH_TIE_EPSILON) {
      best = candidate;
    } else if (Math.abs(cashGap) <= CASH_TIE_EPSILON) {
      // Tie on cash: prefer more customers. Equal again keeps catalog order.
      if ((candidate.forecastCustomers ?? 0) > (best.forecastCustomers ?? 0)) {
        best = candidate;
      }
    }
  }

  if (!best) {
    // "Hold and preserve cash" is free and effortless, so this cannot happen
    // in the seed scenario. Fail loudly rather than inventing a move.
    throw new Error(
      `The opponent policy found no legal action for ${role} in Q${snapshot.quarter}.`,
    );
  }

  const name = snapshot.companies[role].name;
  const label =
    snapshot.actions.find((a) => a.id === best.actionId)?.label ?? best.actionId;
  const legalCount = candidates.filter((c) => c.legal).length;

  return {
    actionId: best.actionId,
    quartersForecast: quarters,
    candidates,
    explanation: `${name} compared ${legalCount} legal moves in catalog order, forecast ${quarters} quarter${
      quarters === 1 ? "" : "s"
    } assuming the other side holds and no further public events, and chose "${label}" for a forecast ending cash of ${money(
      best.forecastCash ?? 0,
    )}.`,
  };
}
