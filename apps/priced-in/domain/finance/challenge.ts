import { computeInitiative, type InitiativeInputs, type InitiativePolicy, type InitiativeYearInputs } from "./initiative";
import { withConstantCapexRatio, withConstantGrowth, withTargetMargin } from "./scenario";
import { computeValuation } from "./valuation";
import type { Baseline, ForecastAssumptions, TerminalAssumptions } from "./types";

export type StressVariable =
  | "growth"
  | "targetMargin"
  | "wacc"
  | "capexRatio"
  | "terminalGrowth"
  | "aiRampDelayYears";

export interface StressVariableMeta {
  label: string;
  unit: string;
  /** The direction that makes the thesis harder to defend. */
  adverse: "down" | "up";
  /** Whole-number variables are scanned step by step, not bisected. */
  discrete: boolean;
}

export const STRESS_VARIABLES: Record<StressVariable, StressVariableMeta> = {
  growth: { label: "Constant annual revenue growth", unit: "decimal rate", adverse: "down", discrete: false },
  targetMargin: { label: "Year-five operating margin", unit: "decimal rate", adverse: "down", discrete: false },
  wacc: { label: "WACC", unit: "decimal rate", adverse: "up", discrete: false },
  capexRatio: { label: "Capex as a share of revenue", unit: "decimal rate", adverse: "up", discrete: false },
  terminalGrowth: { label: "Terminal growth", unit: "decimal rate", adverse: "down", discrete: false },
  aiRampDelayYears: { label: "Delay to the AI benefit ramp", unit: "years", adverse: "up", discrete: true },
};

export interface ThesisContext {
  baseline: Baseline;
  forecast: ForecastAssumptions;
  terminal: TerminalAssumptions;
  targetEvUsd: number;
  initiative: InitiativeInputs | null;
  includeInitiative: boolean;
  initiativeDelayYears: number;
}

export interface ThesisEvaluation {
  enterpriseValueUsd: number | null;
  gapUsd: number | null;
  unsupportedReason: string | null;
}

function delayInitiative(inputs: InitiativeInputs, delayYears: number): InitiativeInputs {
  if (delayYears <= 0) return inputs;
  const blank: InitiativeYearInputs = {
    eligibleLaborCostUsd: 0,
    adoption: 0,
    grossEffortReduction: 0,
    reviewReworkCostUsd: 0,
    realizationFraction: 0,
    incrementalRevenueUsd: 0,
    contributionMargin: 0,
    cannibalizedRevenueUsd: 0,
    cannibalizedContributionMargin: 0,
    aiOperatingExpenseUsd: 0,
    implementationOperatingExpenseUsd: 0,
    aiCapexUsd: 0,
    aiDaUsd: 0,
    incrementalOperatingNwcUsd: 0,
  };
  const shifted = [
    ...new Array<InitiativeYearInputs>(Math.min(delayYears, inputs.years.length)).fill(blank),
    ...inputs.years,
  ].slice(0, inputs.years.length);
  return { ...inputs, years: shifted };
}

/** Modeled enterprise value, optionally including the initiative overlay. */
export function evaluateThesis(context: ThesisContext): ThesisEvaluation {
  const valuation = computeValuation({
    baseline: context.baseline,
    forecast: context.forecast,
    terminal: context.terminal,
  });
  if (!valuation.ok) {
    return {
      enterpriseValueUsd: null,
      gapUsd: null,
      unsupportedReason: valuation.issues[0]?.message ?? "Unsupported model.",
    };
  }

  let enterpriseValueUsd = valuation.value.enterpriseValue.toNumber();

  if (context.includeInitiative && context.initiative) {
    const policy: InitiativePolicy = {
      taxRate: context.forecast.taxRate,
      wacc: context.terminal.wacc,
      terminalGrowth: context.terminal.terminalGrowth,
      terminalRoic: context.terminal.terminalRoic,
    };
    const overlay = computeInitiative(
      delayInitiative(context.initiative, context.initiativeDelayYears),
      valuation.value,
      policy,
    );
    if (!overlay.ok) {
      return {
        enterpriseValueUsd: null,
        gapUsd: null,
        unsupportedReason: overlay.issues[0]?.message ?? "The initiative overlay could not be evaluated.",
      };
    }
    enterpriseValueUsd += overlay.value.incrementalEnterpriseValueUsd.toNumber();
  }

  return {
    enterpriseValueUsd,
    gapUsd: enterpriseValueUsd - context.targetEvUsd,
    unsupportedReason: null,
  };
}

export function applyStress(context: ThesisContext, variable: StressVariable, value: number): ThesisContext {
  switch (variable) {
    case "growth":
      return { ...context, forecast: withConstantGrowth(context.forecast, value) };
    case "targetMargin":
      return { ...context, forecast: withTargetMargin(context.forecast, value) };
    case "capexRatio":
      return { ...context, forecast: withConstantCapexRatio(context.forecast, value) };
    case "wacc":
      return { ...context, terminal: { ...context.terminal, wacc: value } };
    case "terminalGrowth":
      return { ...context, terminal: { ...context.terminal, terminalGrowth: value } };
    case "aiRampDelayYears":
      return { ...context, initiativeDelayYears: Math.max(0, Math.round(value)) };
  }
}

export function baselineValueOf(context: ThesisContext, variable: StressVariable): number {
  switch (variable) {
    case "growth":
      return context.forecast.growthRates[0];
    case "targetMargin":
      return context.forecast.targetMargin;
    case "capexRatio":
      return context.forecast.capexRatios[0];
    case "wacc":
      return context.terminal.wacc;
    case "terminalGrowth":
      return context.terminal.terminalGrowth;
    case "aiRampDelayYears":
      return context.initiativeDelayYears;
  }
}

export interface ThresholdRequest {
  variable: StressVariable;
  /** The user-visible end of the tested range in the adverse direction. */
  adverseBound: number;
  steps?: number;
}

export type ThresholdResult =
  | {
      status: "already_broken";
      shortfallUsd: number;
      modeledEvUsd: number;
      targetEvUsd: number;
      message: string;
    }
  | {
      status: "threshold_found";
      variable: StressVariable;
      unit: string;
      baselineValue: number;
      thresholdValue: number;
      changeFromBaseline: number;
      additionalCrossings: number[];
      heldFixed: Record<string, number>;
      message: string;
    }
  | {
      status: "no_break_in_range";
      variable: StressVariable;
      unit: string;
      baselineValue: number;
      testedTo: number;
      heldFixed: Record<string, number>;
      /** Exact wording required by the BRD. */
      message: "No break within tested range";
    }
  | { status: "unsupported"; message: string };

function heldFixedSnapshot(context: ThesisContext, exclude: StressVariable): Record<string, number> {
  const all: Record<StressVariable, number> = {
    growth: context.forecast.growthRates[0],
    targetMargin: context.forecast.targetMargin,
    capexRatio: context.forecast.capexRatios[0],
    wacc: context.terminal.wacc,
    terminalGrowth: context.terminal.terminalGrowth,
    aiRampDelayYears: context.initiativeDelayYears,
  };
  const out: Record<string, number> = {
    taxRate: context.forecast.taxRate,
    terminalRoic: context.terminal.terminalRoic,
    baselineRevenueUsd: context.baseline.revenueUsd,
    targetEvUsd: context.targetEvUsd,
  };
  for (const key of Object.keys(all) as StressVariable[]) {
    if (key !== exclude) out[key] = all[key];
  }
  return out;
}

/**
 * Walks one variable in the adverse direction and reports the nearest crossing
 * of modeled EV = target EV. No crossing is reported as "No break within tested
 * range", never as safe.
 */
export function findBreakThreshold(context: ThesisContext, request: ThresholdRequest): ThresholdResult {
  const meta = STRESS_VARIABLES[request.variable];
  const baselineValue = baselineValueOf(context, request.variable);
  const start = evaluateThesis(context);

  if (start.gapUsd === null) {
    return { status: "unsupported", message: start.unsupportedReason ?? "The baseline thesis could not be evaluated." };
  }
  if (start.gapUsd < 0) {
    return {
      status: "already_broken",
      shortfallUsd: -start.gapUsd,
      modeledEvUsd: start.enterpriseValueUsd ?? 0,
      targetEvUsd: context.targetEvUsd,
      message:
        "This thesis already fails at the stated assumptions. The existing shortfall is shown before any stress test is applied.",
    };
  }

  const heldFixed = heldFixedSnapshot(context, request.variable);
  const span = request.adverseBound - baselineValue;

  if (!meta.discrete && ((meta.adverse === "down" && span >= 0) || (meta.adverse === "up" && span <= 0))) {
    return {
      status: "unsupported",
      message: `The tested bound must sit ${meta.adverse === "down" ? "below" : "above"} the baseline value for this variable.`,
    };
  }

  if (start.gapUsd === 0) {
    return {
      status: "threshold_found",
      variable: request.variable,
      unit: meta.unit,
      baselineValue,
      thresholdValue: baselineValue,
      changeFromBaseline: 0,
      additionalCrossings: [],
      heldFixed,
      message: "Modeled value sits exactly on the target at the baseline, so any adverse move in this variable breaks the thesis.",
    };
  }

  if (meta.discrete) {
    const limit = Math.max(0, Math.round(request.adverseBound));
    for (let value = Math.round(baselineValue) + 1; value <= limit; value += 1) {
      const point = evaluateThesis(applyStress(context, request.variable, value));
      if (point.gapUsd !== null && point.gapUsd < 0) {
        return {
          status: "threshold_found",
          variable: request.variable,
          unit: meta.unit,
          baselineValue,
          thresholdValue: value,
          changeFromBaseline: value - baselineValue,
          additionalCrossings: [],
          heldFixed,
          message: `The thesis first fails at a delay of ${value} year(s).`,
        };
      }
    }
    return {
      status: "no_break_in_range",
      variable: request.variable,
      unit: meta.unit,
      baselineValue,
      testedTo: limit,
      heldFixed,
      message: "No break within tested range",
    };
  }

  const steps = request.steps ?? 120;
  const crossings: number[] = [];
  let previousValue = baselineValue;
  let previousGap = start.gapUsd;

  for (let i = 1; i <= steps; i += 1) {
    const value = baselineValue + (span * i) / steps;
    const point = evaluateThesis(applyStress(context, request.variable, value));
    if (point.gapUsd === null) break;
    if (point.gapUsd === 0) {
      crossings.push(value);
      previousValue = value;
      previousGap = 0;
      continue;
    }
    if (Math.sign(point.gapUsd) !== Math.sign(previousGap) && previousGap !== 0) {
      let lo = previousValue;
      let hi = value;
      let loGap = previousGap;
      for (let iteration = 0; iteration < 80 && Math.abs(hi - lo) > 1e-9; iteration += 1) {
        const mid = (lo + hi) / 2;
        const midPoint = evaluateThesis(applyStress(context, request.variable, mid));
        if (midPoint.gapUsd === null) break;
        if (Math.sign(midPoint.gapUsd) === Math.sign(loGap)) {
          lo = mid;
          loGap = midPoint.gapUsd;
        } else {
          hi = mid;
        }
      }
      crossings.push((lo + hi) / 2);
    }
    previousValue = value;
    previousGap = point.gapUsd;
  }

  if (crossings.length === 0) {
    return {
      status: "no_break_in_range",
      variable: request.variable,
      unit: meta.unit,
      baselineValue,
      testedTo: request.adverseBound,
      heldFixed,
      message: "No break within tested range",
    };
  }

  const threshold = crossings[0];
  return {
    status: "threshold_found",
    variable: request.variable,
    unit: meta.unit,
    baselineValue,
    thresholdValue: threshold,
    changeFromBaseline: threshold - baselineValue,
    additionalCrossings: crossings.slice(1),
    heldFixed,
    message:
      crossings.length > 1
        ? "The relationship is not monotonic over the tested range. The first crossing from the baseline is reported and the other crossings are listed."
        : "First crossing from the baseline in the adverse direction.",
  };
}

export interface StressGridCell {
  x: number;
  y: number;
  gapUsd: number | null;
  holds: boolean | null;
  unsupportedReason: string | null;
}

export interface StressGridResult {
  xVariable: StressVariable;
  yVariable: StressVariable;
  xValues: number[];
  yValues: number[];
  cells: StressGridCell[];
}

/** Two-variable stress over declared ranges. No probabilities, no sampling. */
export function computeStressGrid(
  context: ThesisContext,
  xVariable: StressVariable,
  xValues: number[],
  yVariable: StressVariable,
  yValues: number[],
): StressGridResult {
  const cells: StressGridCell[] = [];
  for (const y of yValues) {
    for (const x of xValues) {
      const stressed = applyStress(applyStress(context, yVariable, y), xVariable, x);
      const point = evaluateThesis(stressed);
      cells.push({
        x,
        y,
        gapUsd: point.gapUsd,
        holds: point.gapUsd === null ? null : point.gapUsd >= 0,
        unsupportedReason: point.unsupportedReason,
      });
    }
  }
  return { xVariable, yVariable, xValues, yValues, cells };
}

export interface SensitivityEntry {
  variable: StressVariable;
  label: string;
  lowValue: number;
  highValue: number;
  evAtLowUsd: number | null;
  evAtHighUsd: number | null;
  /** Absolute EV swing across the disclosed range. Not a causal importance measure. */
  swingUsd: number | null;
}

export function computeSensitivity(
  context: ThesisContext,
  ranges: Array<{ variable: StressVariable; low: number; high: number }>,
): SensitivityEntry[] {
  return ranges
    .map(({ variable, low, high }) => {
      const atLow = evaluateThesis(applyStress(context, variable, low)).enterpriseValueUsd;
      const atHigh = evaluateThesis(applyStress(context, variable, high)).enterpriseValueUsd;
      return {
        variable,
        label: STRESS_VARIABLES[variable].label,
        lowValue: low,
        highValue: high,
        evAtLowUsd: atLow,
        evAtHighUsd: atHigh,
        swingUsd: atLow === null || atHigh === null ? null : Math.abs(atHigh - atLow),
      };
    })
    .sort((a, b) => (b.swingUsd ?? -1) - (a.swingUsd ?? -1));
}
