"use client";

import { useMemo, useState } from "react";
import { useAnalysis } from "@/components/analysis-provider";
import { AssumptionsRail } from "@/components/assumptions-rail";
import { ExpectationsMap } from "@/components/expectations-map";
import { gridCacheKey, useExpectationsGrid } from "@/components/use-expectations-grid";
import { CashFlowTable, EquityBridgePanel, UnsupportedNotice, ValuationFigures } from "@/components/valuation-panels";
import { solveForGrowth, type SolveGrowthResult } from "@/domain/finance/reverse";
import type { GridRequest } from "@/domain/finance/grid";
import { formatPercent, formatUsd } from "@/domain/format";

const STEPS = 41;

export default function ExpectationsPage() {
  const { document: analysis, computation, updateAssumptions } = useAnalysis();
  const a = computation.assumptions;
  const scale = a.displayScale;
  const [selected, setSelected] = useState<{ growthIndex: number; marginIndex: number } | null>(null);
  const [undoPair, setUndoPair] = useState<{ growth: number; targetMargin: number } | null>(null);
  const [solveResult, setSolveResult] = useState<SolveGrowthResult | null>(null);

  const targetEvUsd = computation.target.ok ? computation.target.value : 0;

  const request = useMemo<GridRequest>(
    () => ({
      baseline: a.baseline,
      forecast: a.forecast,
      terminal: a.terminal,
      targetEvUsd,
      growthMin: a.mapBounds.growthMin,
      growthMax: a.mapBounds.growthMax,
      marginMin: a.mapBounds.marginMin,
      marginMax: a.mapBounds.marginMax,
      steps: STEPS,
    }),
    [a, targetEvUsd],
  );

  const cacheKey = useMemo(() => gridCacheKey(request), [request]);
  const grid = useExpectationsGrid(request, cacheKey);

  function applyCell(growthIndex: number, marginIndex: number) {
    setSelected({ growthIndex, marginIndex });
    const cell = grid.result?.cells[marginIndex * STEPS + growthIndex];
    if (!cell) return;
    setUndoPair({ growth: a.forecast.growthRates[0], targetMargin: a.forecast.targetMargin });
    updateAssumptions((current) => ({
      ...current,
      forecast: {
        ...current.forecast,
        growthRates: new Array<number>(current.forecast.years).fill(cell.growth),
        targetMargin: cell.margin,
      },
    }));
  }

  return (
    <div className="workspace-body">
      <div className="stack">
        <section className="card">
          <p className="eyebrow">Step three</p>
          <h1>What would have to be true?</h1>
          <p className="lede">
            The model below is one route to the target. The map shows the others. Many different combinations of growth
            and margin can support the same value, which is the point.
          </p>
          <ValuationFigures computation={computation} />
        </section>

        {!computation.target.ok ? (
          <UnsupportedNotice title="No valuation target yet." issues={computation.target.issues} />
        ) : null}

        {grid.error ? (
          <div className="callout callout-alert">The grid could not be evaluated: {grid.error}</div>
        ) : null}

        {grid.result ? (
          <ExpectationsMap
            grid={grid.result}
            scale={scale}
            stale={grid.stale}
            selected={selected}
            onSelect={applyCell}
          />
        ) : (
          <div className="card">
            <p className="note" aria-live="polite">
              Evaluating {STEPS} by {STEPS} combinations…
            </p>
          </div>
        )}

        {undoPair ? (
          <div className="callout callout-accent">
            <p style={{ marginBottom: "0.4rem" }}>
              The selected combination is now the active scenario: growth {formatPercent(a.forecast.growthRates[0])},
              year-five margin {formatPercent(a.forecast.targetMargin)}.
            </p>
            <button
              type="button"
              onClick={() => {
                updateAssumptions((current) => ({
                  ...current,
                  forecast: {
                    ...current.forecast,
                    growthRates: new Array<number>(current.forecast.years).fill(undoPair.growth),
                    targetMargin: undoPair.targetMargin,
                  },
                }));
                setUndoPair(null);
              }}
            >
              Undo, back to {formatPercent(undoPair.growth)} growth and {formatPercent(undoPair.targetMargin)} margin
            </button>
          </div>
        ) : null}

        {grid.ranOnMainThread ? (
          <p className="footnote">
            This browser could not start a Web Worker, so the grid was evaluated on the main thread. The numbers are
            identical; the page may simply feel less responsive while it runs.
          </p>
        ) : (
          <p className="footnote">
            Grid evaluated in a Web Worker
            {grid.result ? ` in ${grid.result.computedMs} ms on this machine` : ""}. That figure is what was measured
            here and now, not a guaranteed target.
          </p>
        )}

        <section className="card">
          <div className="card-title">
            <div>
              <p className="eyebrow">Solve</p>
              <h2 style={{ marginBottom: 0 }}>Growth required to reach the target</h2>
            </div>
            <button
              type="button"
              disabled={!computation.target.ok}
              onClick={() =>
                setSolveResult(
                  solveForGrowth({
                    baseline: a.baseline,
                    forecast: a.forecast,
                    terminal: a.terminal,
                    targetEvUsd,
                    bounds: { min: a.mapBounds.growthMin, max: a.mapBounds.growthMax },
                  }),
                )
              }
            >
              Solve for growth
            </button>
          </div>
          <p className="note">
            Holds the year-five margin at {formatPercent(a.forecast.targetMargin)} and every other input fixed, brackets
            a sign change inside the map bounds and bisects. The bounds are never widened silently.
          </p>
          {solveResult ? (
            <div
              className={`callout ${
                solveResult.status === "solved" ? "callout-accent" : solveResult.status === "invalid" ? "callout-alert" : "callout-warn"
              }`}
            >
              {solveResult.status === "solved" ? (
                <p style={{ marginBottom: 0 }}>
                  A constant annual growth rate of <strong>{formatPercent(solveResult.growth, 2)}</strong> reaches the
                  target, giving {formatUsd(solveResult.enterpriseValueUsd, scale)} against a target of{" "}
                  {formatUsd(targetEvUsd, scale)}. Stopping tolerance {formatUsd(solveResult.toleranceUsd, "units", 0)}.
                </p>
              ) : solveResult.status === "multiple_crossings" ? (
                <p style={{ marginBottom: 0 }}>
                  {solveResult.message} First crossing {formatPercent(solveResult.firstRoot, 2)}; all crossings:{" "}
                  {solveResult.roots.map((root) => formatPercent(root, 2)).join(", ")}.
                </p>
              ) : (
                <p style={{ marginBottom: 0 }}>{solveResult.message}</p>
              )}
            </div>
          ) : null}
        </section>

        <CashFlowTable computation={computation} />
        <EquityBridgePanel computation={computation} />

        <section className="card">
          <h2>How to read this</h2>
          <ul className="tight">
            <li>
              Value gap = modeled enterprise value − target enterprise value. Percent gap divides that by the target,
              which must be positive.
            </li>
            <li>
              Cells within one percent of the target form the near-target band, outlined on the map. That band is a set
              of possibilities, not a forecast, and no single cell is the market&rsquo;s view.
            </li>
            <li>
              Growth is not free here: it pulls capital expenditure and working capital along with it through the ratios
              in the rail.
            </li>
            <li>
              Combinations the model cannot value — a non-positive terminal profit, or a WACC at or below terminal
              growth — are hatched and labelled rather than coloured as though they were valid.
            </li>
          </ul>
        </section>

        <section className="card">
          <p className="eyebrow">Scenario</p>
          <h2>{analysis.scenarios.find((scenario) => scenario.id === analysis.activeScenarioId)?.name}</h2>
          <p className="note">
            Switch scenarios in the header, or compare them side by side on the brief. Editing the rail changes only the
            scenario currently selected.
          </p>
        </section>
      </div>

      <AssumptionsRail />
    </div>
  );
}
