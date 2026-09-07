import { withConstantGrowth } from "./scenario";
import { computeValuation } from "./valuation";
import type { EngineIssue } from "./errors";
import type { Baseline, ForecastAssumptions, TerminalAssumptions } from "./types";

export interface SolveGrowthInput {
  baseline: Baseline;
  /** growthRates are replaced by the candidate constant growth rate. */
  forecast: ForecastAssumptions;
  terminal: TerminalAssumptions;
  targetEvUsd: number;
  bounds: { min: number; max: number };
  /** Points sampled across the bounds before bracketing. */
  scanSteps?: number;
  maxIterations?: number;
}

export interface ScanPoint {
  growth: number;
  gapUsd: number | null;
  unsupportedReason?: string;
}

export type SolveGrowthResult =
  | {
      status: "solved";
      growth: number;
      enterpriseValueUsd: number;
      iterations: number;
      toleranceUsd: number;
      scan: ScanPoint[];
    }
  | { status: "no_solution_in_bounds"; message: string; scan: ScanPoint[] }
  | {
      status: "multiple_crossings";
      message: string;
      roots: number[];
      firstRoot: number;
      scan: ScanPoint[];
    }
  | { status: "invalid"; message: string; issues: EngineIssue[] };

function evaluate(input: SolveGrowthInput, growth: number): ScanPoint {
  const outcome = computeValuation({
    baseline: input.baseline,
    forecast: withConstantGrowth(input.forecast, growth),
    terminal: input.terminal,
  });
  if (!outcome.ok) {
    return { growth, gapUsd: null, unsupportedReason: outcome.issues[0]?.message };
  }
  return { growth, gapUsd: outcome.value.enterpriseValue.toNumber() - input.targetEvUsd };
}

/**
 * Holds every other input fixed and looks for a constant growth rate that hits
 * the target enterprise value. Bisection runs only inside a bracketed sign
 * change; bounds are never silently widened.
 */
export function solveForGrowth(input: SolveGrowthInput): SolveGrowthResult {
  if (!Number.isFinite(input.targetEvUsd) || input.targetEvUsd <= 0) {
    return {
      status: "invalid",
      message: "A positive target enterprise value is required before solving for growth.",
      issues: [{ code: "target_ev_not_positive", field: "targetEv", message: "Target enterprise value must be positive." }],
    };
  }
  if (!(input.bounds.min < input.bounds.max)) {
    return {
      status: "invalid",
      message: "Search bounds are empty: the lower bound must be below the upper bound.",
      issues: [{ code: "empty_bounds", field: "bounds", message: "Lower growth bound must be below the upper bound." }],
    };
  }

  const steps = input.scanSteps ?? 71;
  const maxIterations = input.maxIterations ?? 200;
  const toleranceUsd = Math.max(1, input.targetEvUsd * 0.0001);
  const span = input.bounds.max - input.bounds.min;

  const scan: ScanPoint[] = [];
  for (let i = 0; i < steps; i += 1) {
    scan.push(evaluate(input, input.bounds.min + (span * i) / (steps - 1)));
  }

  const roots: number[] = [];
  let iterationsUsed = 0;
  let lastEv = 0;

  const recordRoot = (growth: number, enterpriseValueUsd: number): void => {
    if (roots.length > 0 && Math.abs(roots[roots.length - 1] - growth) < 1e-9) return;
    roots.push(growth);
    lastEv = enterpriseValueUsd;
  };

  for (let i = 0; i < scan.length - 1; i += 1) {
    const left = scan[i];
    const right = scan[i + 1];
    if (left.gapUsd === null) continue;
    // An exact hit at a scan point is the root itself, not a bracket.
    if (left.gapUsd === 0) {
      recordRoot(left.growth, input.targetEvUsd);
      continue;
    }
    if (right.gapUsd === null || right.gapUsd === 0) continue;
    if (Math.sign(left.gapUsd) === Math.sign(right.gapUsd)) continue;

    let lo = left.growth;
    let hi = right.growth;
    let loGap = left.gapUsd;
    let root = lo;
    let rootEv = input.targetEvUsd + loGap;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations += 1;
      const mid = (lo + hi) / 2;
      const point = evaluate(input, mid);
      if (point.gapUsd === null) break;
      root = mid;
      rootEv = input.targetEvUsd + point.gapUsd;
      if (Math.abs(point.gapUsd) <= toleranceUsd || hi - lo < 1e-12) break;
      if (Math.sign(point.gapUsd) === Math.sign(loGap)) {
        lo = mid;
        loGap = point.gapUsd;
      } else {
        hi = mid;
      }
    }

    recordRoot(root, rootEv);
    iterationsUsed += iterations;
  }

  const lastPoint = scan[scan.length - 1];
  if (lastPoint.gapUsd === 0) recordRoot(lastPoint.growth, input.targetEvUsd);

  if (roots.length === 0) {
    return {
      status: "no_solution_in_bounds",
      message: `No growth rate between ${(input.bounds.min * 100).toFixed(1)}% and ${(input.bounds.max * 100).toFixed(
        1,
      )}% reaches the target enterprise value under the other assumptions shown. Bounds were not extended.`,
      scan,
    };
  }

  if (roots.length > 1) {
    return {
      status: "multiple_crossings",
      message: `The scanned function crosses the target ${roots.length} times inside the tested bounds. The first crossing is reported; the others are listed.`,
      roots,
      firstRoot: roots[0],
      scan,
    };
  }

  return {
    status: "solved",
    growth: roots[0],
    enterpriseValueUsd: lastEv,
    iterations: iterationsUsed,
    toleranceUsd,
    scan,
  };
}
