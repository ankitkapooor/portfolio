import { withConstantGrowth, withTargetMargin } from "./scenario";
import { computeValuation } from "./valuation";
import type { Baseline, ForecastAssumptions, TerminalAssumptions } from "./types";

export interface GridRequest {
  baseline: Baseline;
  forecast: ForecastAssumptions;
  terminal: TerminalAssumptions;
  targetEvUsd: number;
  growthMin: number;
  growthMax: number;
  marginMin: number;
  marginMax: number;
  /** 41 in P0. */
  steps: number;
}

export interface GridCell {
  growth: number;
  margin: number;
  /** null when the combination is unsupported by the model guards. */
  enterpriseValueUsd: number | null;
  gapUsd: number | null;
  percentGap: number | null;
  unsupportedReason: string | null;
}

export interface GridResult {
  steps: number;
  growthAxis: number[];
  marginAxis: number[];
  /** Row-major: index = marginIndex * steps + growthIndex. */
  cells: GridCell[];
  targetEvUsd: number;
  nearTargetCount: number;
  unsupportedCount: number;
  computedMs: number;
}

function axis(min: number, max: number, steps: number): number[] {
  if (steps < 2) return [min];
  const out: number[] = [];
  for (let i = 0; i < steps; i += 1) out.push(min + ((max - min) * i) / (steps - 1));
  return out;
}

/**
 * Constant annual growth on one axis, year-N target margin on the other.
 * Everything else is held at the assumptions shown in the rail.
 */
export function computeGrid(request: GridRequest): GridResult {
  const started = Date.now();
  const growthAxis = axis(request.growthMin, request.growthMax, request.steps);
  const marginAxis = axis(request.marginMin, request.marginMax, request.steps);
  const targetIsUsable = Number.isFinite(request.targetEvUsd) && request.targetEvUsd > 0;

  const cells: GridCell[] = [];
  let nearTargetCount = 0;
  let unsupportedCount = 0;

  for (const margin of marginAxis) {
    const marginForecast = withTargetMargin(request.forecast, margin);
    for (const growth of growthAxis) {
      const outcome = computeValuation({
        baseline: request.baseline,
        forecast: withConstantGrowth(marginForecast, growth),
        terminal: request.terminal,
      });

      if (!outcome.ok) {
        unsupportedCount += 1;
        cells.push({
          growth,
          margin,
          enterpriseValueUsd: null,
          gapUsd: null,
          percentGap: null,
          unsupportedReason: outcome.issues[0]?.message ?? "Unsupported combination.",
        });
        continue;
      }

      const enterpriseValueUsd = outcome.value.enterpriseValue.toNumber();
      const gapUsd = targetIsUsable ? enterpriseValueUsd - request.targetEvUsd : null;
      const percentGap = gapUsd === null ? null : gapUsd / request.targetEvUsd;
      if (percentGap !== null && Math.abs(percentGap) <= 0.01) nearTargetCount += 1;

      cells.push({ growth, margin, enterpriseValueUsd, gapUsd, percentGap, unsupportedReason: null });
    }
  }

  return {
    steps: request.steps,
    growthAxis,
    marginAxis,
    cells,
    targetEvUsd: request.targetEvUsd,
    nearTargetCount,
    unsupportedCount,
    computedMs: Date.now() - started,
  };
}
