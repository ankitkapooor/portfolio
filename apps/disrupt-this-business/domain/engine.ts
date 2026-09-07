/**
 * The economic engine.
 *
 * Pure functions only: no UI, no storage, no clock, no randomness, no network.
 * Given the same inputs these functions always produce the same outputs, which
 * is what makes an exported run reproducible.
 *
 * Everything the engine needs lives inside `GameState`, so the two entry points
 * keep the signatures the specification fixes:
 *   prepareRound(previousState, environment)
 *   resolveRound(preparedState, playerAction, opponentAction)
 *
 * The resolution order in `resolveRound` is fixed by the specification and the
 * step comments below follow it literally.
 */
import {
  ENGINE_VERSION,
  OTHER_ROLE,
  SEGMENT_IDS,
  SUPPLIER_IDS,
  TRAIT_IDS,
  type ActionDefinition,
  type ActionId,
  type ActionLegality,
  type CommittedAction,
  type CompanyDefinition,
  type CompanyState,
  type CustomerTable,
  type EngineEvent,
  type Environment,
  type EnvironmentEvent,
  type GameState,
  type PreparedRound,
  type QuarterFinancials,
  type Role,
  type Scenario,
  type Segment,
  type SegmentId,
  type Supplier,
} from "@/domain/schema";

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineError";
  }
}

const ROLES: readonly Role[] = ["incumbent", "challenger"];

/** Quarterly revenue recognition divides the annual contract price by four. */
const QUARTERS_PER_YEAR = 4;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function clone<T>(value: T): T {
  return structuredClone(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function money(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString("en-US")}`;
}

/** Stable stringify so a snapshot hash does not depend on key insertion order. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`);
  return `{${entries.join(",")}}`;
}

/** FNV-1a. Not cryptographic; it only needs to detect that two states differ. */
export function snapshotHash(state: GameState): string {
  const text = canonical(state);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function findAction(state: GameState, actionId: ActionId): ActionDefinition {
  const found = state.actions.find((a) => a.id === actionId);
  if (!found) throw new EngineError(`Unknown action "${actionId}".`);
  return found;
}

function getSegment(state: GameState, id: SegmentId): Segment {
  const found = state.segments.find((s) => s.id === id);
  if (!found) throw new EngineError(`Unknown segment "${id}".`);
  return found;
}

/**
 * Quarters in which a commitment holds delivery effort.
 * A 2-quarter project started in Q1 holds effort in Q1 and Q2 and activates in Q3.
 */
export function occupiedQuarters(
  quarter: number,
  action: ActionDefinition,
): number[] {
  if (action.effort === 0) return [];
  const span = Math.max(action.delay, 1);
  return Array.from({ length: span }, (_, i) => quarter + i);
}

function reservedIn(company: CompanyState, quarter: number): number {
  return company.effortReserved[String(quarter)] ?? 0;
}

/* ------------------------------------------------------------------ */
/* Initial state                                                       */
/* ------------------------------------------------------------------ */

function companyFromDefinition(def: CompanyDefinition): CompanyState {
  return {
    role: def.role,
    name: def.name,
    cash: def.cash,
    prices: { ...def.prices },
    originalPrices: { ...def.prices },
    variableCost: { ...def.variableCost },
    fixedCost: def.fixedCost,
    traits: { ...def.traits },
    capacityPerQuarter: def.capacityPerQuarter,
    effortReserved: {},
    pendingProjects: [],
    outcomeBundlesApplied: def.outcomeBundlesApplied,
    fundingRequired: false,
    ledger: [],
  };
}

export function createInitialState(
  scenario: Scenario,
  environment: Environment,
): GameState {
  const customers = {} as CustomerTable;
  for (const segmentId of SEGMENT_IDS) {
    const segment = scenario.segments.find((s) => s.id === segmentId);
    if (!segment) throw new EngineError(`Scenario is missing segment "${segmentId}".`);
    const incumbent = scenario.companies.incumbent.initialCustomers[segmentId];
    const challenger = scenario.companies.challenger.initialCustomers[segmentId];
    const outside = segment.size - incumbent - challenger;
    if (outside < 0) {
      throw new EngineError(
        `Segment "${segmentId}" starts with more customers than its size.`,
      );
    }
    customers[segmentId] = { incumbent, challenger, outside };
  }

  return {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    engineVersion: ENGINE_VERSION,
    environmentId: environment.id,
    totalRounds: scenario.totalRounds,
    quarter: 0,
    phase: "initial",
    finished: false,
    segments: clone(scenario.segments),
    outsideUtility: scenario.outsideUtility,
    choiceTemperature: scenario.choiceTemperature,
    priceFloorShare: scenario.priceFloorShare,
    actions: clone(scenario.actions),
    customers,
    companies: {
      incumbent: companyFromDefinition(scenario.companies.incumbent),
      challenger: companyFromDefinition(scenario.companies.challenger),
    },
    appliedEventIds: [],
    nextQuarterPreview: {
      quarter: 1,
      headline: "Not yet prepared",
      detail: "The first quarter has not been prepared.",
    },
    researchNotes: { incumbent: [], challenger: [] },
  };
}

/**
 * The view of the world an opponent policy is allowed to read.
 * Hidden fields are removed here rather than trusted to caller discipline.
 */
export function publicSnapshot(state: GameState): GameState {
  const copy = clone(state);
  copy.nextQuarterPreview = {
    quarter: state.quarter + 1,
    headline: "Not visible",
    detail: "Future environment changes are not part of the public snapshot.",
  };
  copy.researchNotes = { incumbent: [], challenger: [] };
  return copy;
}

/* ------------------------------------------------------------------ */
/* Trait and price maintenance                                         */
/* ------------------------------------------------------------------ */

function recalculateTraitsAndPrices(state: GameState): string[] {
  const notes: string[] = [];
  for (const role of ROLES) {
    const company = state.companies[role];
    for (const trait of TRAIT_IDS) {
      const before = company.traits[trait];
      const after = clamp(before, 0, 1);
      if (after !== before) {
        company.traits[trait] = after;
        notes.push(`${company.name} ${trait} clamped to ${after.toFixed(2)}.`);
      }
    }
    for (const segmentId of SEGMENT_IDS) {
      const floor = company.originalPrices[segmentId] * state.priceFloorShare;
      if (company.prices[segmentId] < floor) {
        company.prices[segmentId] = floor;
        notes.push(
          `${company.name} ${segmentId} price held at the ${Math.round(
            state.priceFloorShare * 100,
          )}% floor of ${money(floor)}.`,
        );
      }
    }
  }
  return notes;
}

/* ------------------------------------------------------------------ */
/* Project activation                                                  */
/* ------------------------------------------------------------------ */

function applyActivationEffect(
  state: GameState,
  company: CompanyState,
  actionId: ActionId,
): string {
  const t = company.traits;
  switch (actionId) {
    case "improve-reliability":
      t.reliability = Math.min(1, t.reliability + 0.08);
      return `Reliability now ${t.reliability.toFixed(2)}.`;
    case "enterprise-integrations":
      t.integration = Math.min(1, t.integration + 0.15);
      return `Integration now ${t.integration.toFixed(2)}.`;
    case "autonomous-delivery": {
      t.automation = Math.min(1, t.automation + 0.25);
      t.reliability = Math.max(0, t.reliability - 0.05);
      for (const segmentId of SEGMENT_IDS) {
        company.variableCost[segmentId] *= 1.15;
      }
      return `Automation now ${t.automation.toFixed(2)}, reliability ${t.reliability.toFixed(
        2,
      )}, variable cost up 15%.`;
    }
    case "expand-distribution":
      t.reach = Math.min(1, t.reach + 0.15);
      return `Reach now ${t.reach.toFixed(2)}.`;
    case "outcome-bundles": {
      for (const segmentId of SEGMENT_IDS) {
        const target = company.originalPrices[segmentId] * 0.8;
        const floor = company.originalPrices[segmentId] * state.priceFloorShare;
        company.prices[segmentId] = Math.max(target, floor);
      }
      t.automation = Math.min(1, t.automation + 0.1);
      t.integration = Math.max(0, t.integration - 0.05);
      return `Prices reset to 80% of list, automation now ${t.automation.toFixed(
        2,
      )}, integration ${t.integration.toFixed(2)}.`;
    }
    default:
      throw new EngineError(`Action "${actionId}" has no activation effect.`);
  }
}

/* ------------------------------------------------------------------ */
/* Environment events                                                  */
/* ------------------------------------------------------------------ */

function applyEnvironmentEvent(state: GameState, event: EnvironmentEvent): void {
  if (state.appliedEventIds.includes(event.id)) {
    throw new EngineError(
      `Environment event "${event.id}" was already applied. Effects persist and must never re-apply.`,
    );
  }
  const effect = event.effect;
  if (effect.kind === "segment-weight-transfer") {
    for (const segment of state.segments) {
      const moved = Math.min(effect.amount, segment.weights[effect.from]);
      segment.weights[effect.from] -= moved;
      segment.weights[effect.to] += moved;
    }
  } else {
    for (const role of ROLES) {
      const company = state.companies[role];
      for (const segmentId of SEGMENT_IDS) {
        company.variableCost[segmentId] *= effect.variableCostMultiplier;
      }
    }
    state.outsideUtility = effect.outsideUtility;
  }
  state.appliedEventIds.push(event.id);
}

function describePreview(
  environment: Environment,
  quarter: number,
  totalRounds: number,
): GameState["nextQuarterPreview"] {
  if (quarter > totalRounds) {
    return {
      quarter,
      headline: "No further quarters",
      detail:
        "The game ends after the current quarter, so there is nothing ahead to research.",
    };
  }
  const event = environment.schedule.find((e) => e.quarter === quarter);
  if (!event) {
    return {
      quarter,
      headline: `No environment change scheduled for Q${quarter}`,
      detail:
        "Segment weights, costs and the outside option are unchanged next quarter under this preset.",
    };
  }
  return { quarter, headline: event.headline, detail: event.detail };
}

/* ------------------------------------------------------------------ */
/* prepareRound                                                        */
/* ------------------------------------------------------------------ */

/**
 * Advance to the next quarter, activate any projects that finished, and reveal
 * the scheduled public event exactly once. Both sides then choose from this
 * frozen state.
 */
export function prepareRound(
  previousState: GameState,
  environment: Environment,
): PreparedRound {
  if (previousState.finished) {
    throw new EngineError(
      "The game is already finished; there is no round to prepare.",
    );
  }
  if (previousState.phase === "prepared") {
    throw new EngineError(
      "This round is already prepared; resolve it before preparing another.",
    );
  }
  if (previousState.environmentId !== environment.id) {
    throw new EngineError(
      `State was created under environment "${previousState.environmentId}" but "${environment.id}" was supplied.`,
    );
  }

  const state = clone(previousState);
  state.quarter += 1;
  state.phase = "prepared";
  const events: EngineEvent[] = [];
  let step = 0;

  // Step 1 - activate previously completed projects.
  for (const role of ROLES) {
    const company = state.companies[role];
    for (const project of company.pendingProjects) {
      if (project.activated || project.activationQuarter !== state.quarter) continue;
      const detail = applyActivationEffect(state, company, project.actionId);
      project.activated = true;
      step += 1;
      events.push({
        id: `${state.quarter}-activate-${project.id}`,
        quarter: state.quarter,
        step,
        kind: "project-activated",
        role,
        headline: `${company.name}: ${findAction(state, project.actionId).label} is now active`,
        detail,
        formulaIds: ["P-TIMING", "P-TRAITS"],
      });
    }
  }

  // Step 2 - reveal the scheduled public environment event, exactly once.
  const scheduled = environment.schedule.find((e) => e.quarter === state.quarter);
  if (scheduled && !state.appliedEventIds.includes(scheduled.id)) {
    applyEnvironmentEvent(state, scheduled);
    step += 1;
    events.push({
      id: `${state.quarter}-event-${scheduled.id}`,
      quarter: state.quarter,
      step,
      kind: "environment-event",
      role: null,
      headline: scheduled.headline,
      detail: scheduled.detail,
      formulaIds: ["P-EVENTS"],
    });
  }

  state.nextQuarterPreview = describePreview(
    environment,
    state.quarter + 1,
    state.totalRounds,
  );

  return { state, events };
}

/* ------------------------------------------------------------------ */
/* Action legality                                                     */
/* ------------------------------------------------------------------ */

/**
 * Why every catalog action is or is not available to `role` right now.
 * The reasons are written for display on the disabled control (D-F03).
 */
export function evaluateActions(state: GameState, role: Role): ActionLegality[] {
  const company = state.companies[role];
  return state.actions.map((action) => {
    const base = {
      actionId: action.id,
      cash: action.cash,
      effort: action.effort,
      activationQuarter: state.quarter + action.delay,
    };

    if (action.cash > 0 && company.fundingRequired) {
      return {
        ...base,
        legal: false,
        reason: `Funding required: ending cash is ${money(
          company.cash,
        )}. Only the free choices remain.`,
      };
    }
    // Free choices stay available even when cash is negative.
    if (action.cash > 0 && action.cash > company.cash) {
      return {
        ...base,
        legal: false,
        reason: `Needs ${money(action.cash)} in cash; ${company.name} holds ${money(
          company.cash,
        )}.`,
      };
    }

    for (const quarter of occupiedQuarters(state.quarter, action)) {
      const free = company.capacityPerQuarter - reservedIn(company, quarter);
      if (action.effort > free) {
        return {
          ...base,
          legal: false,
          reason: `Reserves ${action.effort} effort in Q${quarter}, but only ${free} of ${company.capacityPerQuarter} units are free there. Capacity does not carry over.`,
        };
      }
    }

    if (action.id === "outcome-bundles" && company.outcomeBundlesApplied) {
      return {
        ...base,
        legal: false,
        reason: `${company.name} already sells outcome bundles. The conversion is allowed once per company.`,
      };
    }

    if (action.id === "reduce-price") {
      const atFloor = SEGMENT_IDS.every(
        (segmentId) =>
          company.prices[segmentId] <=
          company.originalPrices[segmentId] * state.priceFloorShare + 1e-9,
      );
      if (atFloor) {
        return {
          ...base,
          legal: false,
          reason: `Both prices already sit at the ${Math.round(
            state.priceFloorShare * 100,
          )}% floor of the original list price.`,
        };
      }
    }

    return { ...base, legal: true, reason: null };
  });
}

export function actionVerdict(
  state: GameState,
  role: Role,
  actionId: ActionId,
): ActionLegality {
  const found = evaluateActions(state, role).find((a) => a.actionId === actionId);
  if (!found) throw new EngineError(`Unknown action "${actionId}".`);
  return found;
}

/* ------------------------------------------------------------------ */
/* Customer allocation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Utility of `option` to a customer in `segment` whose current supplier is `cohort`.
 * The relationship bonus applies only when the option is that current supplier.
 */
export function optionUtility(
  state: GameState,
  segment: Segment,
  option: Supplier,
  cohort: Supplier,
): number {
  if (option === "outside") return state.outsideUtility;
  const company = state.companies[option];
  const w = segment.weights;
  const utility =
    w.reliability * company.traits.reliability +
    w.automation * company.traits.automation +
    w.integration * company.traits.integration +
    w.reach * company.traits.reach -
    w.price * (company.prices[segment.id] / segment.referencePrice);
  return option === cohort ? utility + segment.relationshipBonus : utility;
}

/** Softmax over the three options, with the maximum logit subtracted first. */
export function choiceShares(
  state: GameState,
  segment: Segment,
  cohort: Supplier,
): Record<Supplier, number> {
  const logits = SUPPLIER_IDS.map(
    (option) =>
      optionUtility(state, segment, option, cohort) / state.choiceTemperature,
  );
  const maxLogit = Math.max(...logits);
  const weights = logits.map((l) => Math.exp(l - maxLogit));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const shares = {} as Record<Supplier, number>;
  SUPPLIER_IDS.forEach((option, index) => {
    shares[option] = weights[index] / total;
  });
  return shares;
}

/**
 * Cohort-based reallocation. Each cohort keeps (1 - reconsiderationRate) of its
 * customers and spreads only the remainder across all three options. Segment
 * totals are conserved; no "new customer" bonus is added afterwards.
 */
export function allocateCustomers(state: GameState): CustomerTable {
  const next = {} as CustomerTable;
  for (const segmentId of SEGMENT_IDS) {
    next[segmentId] = { incumbent: 0, challenger: 0, outside: 0 };
    const segment = getSegment(state, segmentId);
    for (const cohort of SUPPLIER_IDS) {
      const count = state.customers[segmentId][cohort];
      const moving = count * segment.reconsiderationRate;
      const staying = count - moving;
      next[segmentId][cohort] += staying;
      if (moving === 0) continue;
      const shares = choiceShares(state, segment, cohort);
      for (const option of SUPPLIER_IDS) {
        next[segmentId][option] += moving * shares[option];
      }
    }
  }
  return next;
}

/* ------------------------------------------------------------------ */
/* resolveRound                                                        */
/* ------------------------------------------------------------------ */

export interface ResolveResult {
  nextState: GameState;
  events: EngineEvent[];
}

function actionsByRole(
  playerAction: CommittedAction,
  opponentAction: CommittedAction,
): Record<Role, CommittedAction> {
  if (playerAction.role === opponentAction.role) {
    throw new EngineError(
      `Both committed actions belong to "${playerAction.role}". Each round needs one action per role.`,
    );
  }
  return {
    [playerAction.role]: playerAction,
    [opponentAction.role]: opponentAction,
  } as Record<Role, CommittedAction>;
}

export function resolveRound(
  preparedState: GameState,
  playerAction: CommittedAction,
  opponentAction: CommittedAction,
): ResolveResult {
  if (preparedState.phase !== "prepared") {
    throw new EngineError(
      `resolveRound expects a prepared state; received phase "${preparedState.phase}".`,
    );
  }
  const committed = actionsByRole(playerAction, opponentAction);

  // Step 3 - accept simultaneous actions, judged against the frozen prepared
  // state. Neither side's commitment can change the other side's legal set.
  for (const role of ROLES) {
    const verdict = actionVerdict(preparedState, role, committed[role].actionId);
    if (!verdict.legal) {
      throw new EngineError(
        `Illegal commitment for ${role} (${committed[role].actionId}): ${verdict.reason}`,
      );
    }
  }

  const state = clone(preparedState);
  const events: EngineEvent[] = [];
  let step = 0;
  const push = (event: Omit<EngineEvent, "step" | "quarter">) => {
    step += 1;
    events.push({ ...event, step, quarter: state.quarter });
  };

  const openingCash: Record<Role, number> = {
    incumbent: state.companies.incumbent.cash,
    challenger: state.companies.challenger.cash,
  };
  const investment: Record<Role, number> = { incumbent: 0, challenger: 0 };

  for (const role of ROLES) {
    const action = findAction(state, committed[role].actionId);
    const company = state.companies[role];
    push({
      id: `${state.quarter}-accept-${role}`,
      kind: "action-accepted",
      role,
      headline: `${company.name} commits: ${action.label}`,
      detail: `${money(action.cash)} cash, ${action.effort} effort, ${
        action.delay === 0
          ? "effective this quarter"
          : `active in Q${state.quarter + action.delay}`
      }.`,
      formulaIds: action.formulaIds,
    });

    // Reserve effort in every occupied quarter and register the project.
    const quarters = occupiedQuarters(state.quarter, action);
    for (const quarter of quarters) {
      company.effortReserved[String(quarter)] =
        reservedIn(company, quarter) + action.effort;
    }
    if (action.id === "outcome-bundles") company.outcomeBundlesApplied = true;
    if (action.delay > 0) {
      company.pendingProjects.push({
        id: `${role}-${action.id}-q${state.quarter}`,
        actionId: action.id,
        committedQuarter: state.quarter,
        activationQuarter: state.quarter + action.delay,
        effort: action.effort,
        occupiedQuarters: quarters,
        activated: false,
      });
    }
  }

  // Step 4 - deduct investment cash.
  for (const role of ROLES) {
    const action = findAction(state, committed[role].actionId);
    if (action.cash === 0) continue;
    const company = state.companies[role];
    company.cash -= action.cash;
    investment[role] = action.cash;
    push({
      id: `${state.quarter}-outlay-${role}`,
      kind: "investment-outlay",
      role,
      headline: `${company.name} pays ${money(action.cash)}`,
      detail: `Investments are cash outlays, not recurring expenses. Cash is ${money(
        company.cash,
      )} before this quarter's operating flow.`,
      formulaIds: ["F-CASH"],
    });
  }

  // Step 5 - apply immediate actions.
  for (const role of ROLES) {
    const action = findAction(state, committed[role].actionId);
    if (action.delay !== 0) continue;
    const company = state.companies[role];
    if (action.id === "reduce-price") {
      for (const segmentId of SEGMENT_IDS) {
        company.prices[segmentId] *= 0.85;
      }
      push({
        id: `${state.quarter}-price-${role}`,
        kind: "immediate-effect",
        role,
        headline: `${company.name} cuts both prices 15%`,
        detail: `Small teams ${money(company.prices.small)}, enterprise ${money(
          company.prices.enterprise,
        )} per team per year, before the price floor is applied.`,
        formulaIds: ["P-PRICEFLOOR", "F-REV"],
      });
    } else if (action.id === "commission-research") {
      const preview = state.nextQuarterPreview;
      state.researchNotes[role] = [
        ...state.researchNotes[role],
        {
          purchasedInQuarter: state.quarter,
          aboutQuarter: preview.quarter,
          headline: preview.headline,
          detail: preview.detail,
        },
      ];
      push({
        id: `${state.quarter}-research-${role}`,
        kind: "research-revealed",
        role,
        headline: `${company.name} research: ${preview.headline}`,
        detail: preview.detail || "No further detail.",
        formulaIds: ["P-EVENTS"],
      });
    }
  }

  // Step 6 - recalculate traits and prices.
  const clampNotes = recalculateTraitsAndPrices(state);
  if (clampNotes.length > 0) {
    push({
      id: `${state.quarter}-bounds`,
      kind: "traits-recalculated",
      role: null,
      headline: "Bounds applied",
      detail: clampNotes.join(" "),
      formulaIds: ["P-TRAITS", "P-PRICEFLOOR"],
    });
  }

  // Step 7 - allocate customer transitions.
  const before = clone(state.customers);
  state.customers = allocateCustomers(state);
  for (const segmentId of SEGMENT_IDS) {
    const segment = getSegment(state, segmentId);
    const from = before[segmentId];
    const to = state.customers[segmentId];
    push({
      id: `${state.quarter}-allocate-${segmentId}`,
      kind: "customers-allocated",
      role: null,
      headline: `${segment.label}: ${to.incumbent.toFixed(
        1,
      )} ${state.companies.incumbent.name} / ${to.challenger.toFixed(1)} ${
        state.companies.challenger.name
      } / ${to.outside.toFixed(1)} outside`,
      detail: `${Math.round(
        segment.reconsiderationRate * 100,
      )}% of each cohort reconsidered. Change: ${state.companies.incumbent.name} ${(
        to.incumbent - from.incumbent
      ).toFixed(1)}, ${state.companies.challenger.name} ${(
        to.challenger - from.challenger
      ).toFixed(1)}, outside ${(to.outside - from.outside).toFixed(
        1,
      )}. Segment total held at ${segment.size}.`,
      formulaIds: ["F-UTIL", "F-SOFTMAX", "F-ALLOC"],
    });
  }

  // Steps 8 and 9 - recognise revenue and costs, then mark funding gaps.
  for (const role of ROLES) {
    const company = state.companies[role];
    let revenue = 0;
    let variableCost = 0;
    const customers = { small: 0, enterprise: 0 };
    for (const segmentId of SEGMENT_IDS) {
      const count = state.customers[segmentId][role];
      customers[segmentId] = count;
      revenue += (count * company.prices[segmentId]) / QUARTERS_PER_YEAR;
      variableCost += count * company.variableCost[segmentId];
    }
    const operatingCashFlow = revenue - variableCost - company.fixedCost;
    company.cash += operatingCashFlow;
    const financials: QuarterFinancials = {
      quarter: state.quarter,
      openingCash: openingCash[role],
      investment: investment[role],
      revenue,
      variableCost,
      fixedCost: company.fixedCost,
      operatingCashFlow,
      endingCash: company.cash,
      fundingRequired: company.cash < 0,
      customers,
    };
    company.ledger.push(financials);
    company.fundingRequired = financials.fundingRequired;

    // Step 10 - explanation records. Each line names the formula behind it.
    push({
      id: `${state.quarter}-financials-${role}`,
      kind: "financials",
      role,
      headline: `${company.name}: operating cash flow ${money(operatingCashFlow)}`,
      detail: `Revenue ${money(
        revenue,
      )} = ending customers x annual price / 4. Variable cost ${money(
        variableCost,
      )}. Fixed cost ${money(company.fixedCost)}. Ending cash ${money(
        financials.endingCash,
      )} = opening ${money(financials.openingCash)} - investment ${money(
        financials.investment,
      )} + operating cash flow ${money(operatingCashFlow)}.`,
      formulaIds: ["F-REV", "F-VC", "F-OCF", "F-CASH"],
    });

    if (financials.fundingRequired) {
      push({
        id: `${state.quarter}-funding-${role}`,
        kind: "funding-required",
        role,
        headline: `${company.name} needs funding`,
        detail:
          "Ending cash is negative. This model has no automatic financing. Paid commitments are blocked; price changes and hold remain available.",
        formulaIds: ["F-CASH"],
      });
    }
  }

  state.phase = "resolved";
  state.finished = state.quarter >= state.totalRounds;

  return { nextState: state, events };
}

/* ------------------------------------------------------------------ */
/* Derived read-only helpers used by the UI and the opponent           */
/* ------------------------------------------------------------------ */

export function totalCustomers(state: GameState, role: Role): number {
  return SEGMENT_IDS.reduce(
    (sum, segmentId) => sum + state.customers[segmentId][role],
    0,
  );
}

export function freeCapacity(
  state: GameState,
  role: Role,
  quarter: number,
): number {
  const company = state.companies[role];
  return company.capacityPerQuarter - reservedIn(company, quarter);
}

export { OTHER_ROLE, ENGINE_VERSION, ROLES };
