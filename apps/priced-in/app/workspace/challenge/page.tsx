"use client";

import { useMemo, useState } from "react";
import { useAnalysis } from "@/components/analysis-provider";
import { AssumptionsRail } from "@/components/assumptions-rail";
import {
  computeSensitivity,
  computeStressGrid,
  evaluateThesis,
  findBreakThreshold,
  STRESS_VARIABLES,
  type StressVariable,
  type ThesisContext,
  type ThresholdResult,
} from "@/domain/finance/challenge";
import { formatPercent, formatUsd } from "@/domain/format";
import type { Scale } from "@/domain/intake/metrics";

function axisValues(centre: number, spread: number, steps: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < steps; i += 1) out.push(centre - spread + (2 * spread * i) / (steps - 1));
  return out;
}

function ThresholdCard({ result, scale }: { result: ThresholdResult; scale: Scale }) {
  if (result.status === "unsupported") {
    return <div className="callout callout-warn">{result.message}</div>;
  }
  if (result.status === "already_broken") {
    return (
      <div className="callout callout-alert">
        <p>
          <strong>This thesis already fails.</strong> {result.message}
        </p>
        <p style={{ marginBottom: 0 }}>
          Modeled {formatUsd(result.modeledEvUsd, scale)} against a target of {formatUsd(result.targetEvUsd, scale)}, a
          shortfall of {formatUsd(result.shortfallUsd, scale)}. Close that before stress testing anything.
        </p>
      </div>
    );
  }

  const meta = STRESS_VARIABLES[result.variable];
  const asText = (value: number) => (meta.unit === "decimal rate" ? formatPercent(value, 2) : `${value} years`);

  if (result.status === "no_break_in_range") {
    return (
      <div className="callout callout-warn">
        <p>
          <strong>{meta.label}: No break within tested range</strong>
        </p>
        <p style={{ marginBottom: 0 }}>
          Tested from {asText(result.baselineValue)} to {asText(result.testedTo)} and the thesis held throughout. That is
          not the same as safe: it only means no crossing exists inside the range that was tested.
        </p>
      </div>
    );
  }

  return (
    <div className="callout callout-accent">
      <p>
        <strong>{meta.label}</strong> breaks the thesis at {asText(result.thresholdValue)}, a change of{" "}
        {asText(result.changeFromBaseline)} from the baseline {asText(result.baselineValue)}.
      </p>
      <p className="footnote">Units: {meta.unit}. {result.message}</p>
      <details>
        <summary className="footnote" style={{ cursor: "pointer" }}>
          Inputs held fixed for this test
        </summary>
        <ul className="tight" style={{ marginTop: "0.4rem", marginBottom: 0 }}>
          {Object.entries(result.heldFixed).map(([key, value]) => (
            <li key={key} className="footnote">
              {key}: {Math.abs(value) < 10 ? value.toFixed(4) : value.toLocaleString("en-US")}
            </li>
          ))}
        </ul>
      </details>
      {result.additionalCrossings.length > 0 ? (
        <p className="footnote" style={{ marginBottom: 0 }}>
          Other crossings in the same range: {result.additionalCrossings.map((value) => asText(value)).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

export default function ChallengePage() {
  const { document: analysis, computation } = useAnalysis();
  const a = computation.assumptions;
  const scale = a.displayScale;
  const [waccHeadroom, setWaccHeadroom] = useState(0.1);
  const [capexHeadroom, setCapexHeadroom] = useState(0.15);
  const [includeInitiative, setIncludeInitiative] = useState(analysis.initiative.enabled);

  const context = useMemo<ThesisContext | null>(() => {
    if (!computation.target.ok) return null;
    return {
      baseline: a.baseline,
      forecast: a.forecast,
      terminal: a.terminal,
      targetEvUsd: computation.target.value,
      initiative: analysis.initiative.enabled ? analysis.initiative : null,
      includeInitiative: includeInitiative && analysis.initiative.enabled,
      initiativeDelayYears: 0,
    };
  }, [a, analysis.initiative, computation.target, includeInitiative]);

  const evaluation = useMemo(() => (context ? evaluateThesis(context) : null), [context]);

  const variables = useMemo<Array<{ variable: StressVariable; adverseBound: number }>>(() => {
    if (!context) return [];
    const list: Array<{ variable: StressVariable; adverseBound: number }> = [
      { variable: "growth", adverseBound: a.mapBounds.growthMin },
      { variable: "targetMargin", adverseBound: a.mapBounds.marginMin },
      { variable: "wacc", adverseBound: a.terminal.wacc + waccHeadroom },
      { variable: "capexRatio", adverseBound: a.forecast.capexRatios[0] + capexHeadroom },
    ];
    if (context.includeInitiative) list.push({ variable: "aiRampDelayYears", adverseBound: a.forecast.years });
    return list;
  }, [a, capexHeadroom, context, waccHeadroom]);

  const thresholds = useMemo(() => {
    if (!context) return [];
    return variables.map((entry) => ({
      variable: entry.variable,
      result: findBreakThreshold(context, { variable: entry.variable, adverseBound: entry.adverseBound }),
    }));
  }, [context, variables]);

  const growthMarginGrid = useMemo(
    () =>
      context
        ? computeStressGrid(
            context,
            "growth",
            axisValues(a.forecast.growthRates[0], 0.06, 9),
            "targetMargin",
            axisValues(a.forecast.targetMargin, 0.05, 9),
          )
        : null,
    [a.forecast.growthRates, a.forecast.targetMargin, context],
  );

  const waccTerminalGrid = useMemo(
    () =>
      context
        ? computeStressGrid(
            context,
            "wacc",
            axisValues(a.terminal.wacc, 0.03, 9),
            "terminalGrowth",
            axisValues(Math.max(a.terminal.terminalGrowth, 0.015), 0.015, 9),
          )
        : null,
    [a.terminal, context],
  );

  const sensitivity = useMemo(
    () =>
      context
        ? computeSensitivity(context, [
            { variable: "growth", low: a.forecast.growthRates[0] - 0.03, high: a.forecast.growthRates[0] + 0.03 },
            { variable: "targetMargin", low: a.forecast.targetMargin - 0.03, high: a.forecast.targetMargin + 0.03 },
            { variable: "wacc", low: a.terminal.wacc - 0.01, high: a.terminal.wacc + 0.01 },
            { variable: "terminalGrowth", low: Math.max(0, a.terminal.terminalGrowth - 0.01), high: a.terminal.terminalGrowth + 0.01 },
            { variable: "capexRatio", low: Math.max(0, a.forecast.capexRatios[0] - 0.02), high: a.forecast.capexRatios[0] + 0.02 },
          ])
        : [],
    [a, context],
  );

  return (
    <div className="workspace-body">
      <div className="stack">
        <section className="card">
          <p className="eyebrow">Step six</p>
          <h1>Break my thesis</h1>
          <p className="lede">
            The thesis under test is: modeled enterprise value is at least the target enterprise value, with every input
            and source version frozen as they are now. Each test below moves one thing in the direction that hurts and
            reports the nearest crossing.
          </p>
          {analysis.initiative.enabled ? (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={includeInitiative}
                onChange={(event) => setIncludeInitiative(event.target.checked)}
              />
              <span>Count the AI initiative&rsquo;s incremental enterprise value towards the thesis</span>
            </label>
          ) : null}
        </section>

        {!context || !evaluation ? (
          <div className="callout callout-alert">
            A positive target enterprise value is needed before a thesis can be defined or tested.
          </div>
        ) : (
          <>
            <section className="card">
              <div className="figures">
                <div className="figure figure-accent">
                  <p className="figure-label">Modeled enterprise value</p>
                  <p className="figure-value">{formatUsd(evaluation.enterpriseValueUsd, scale)}</p>
                  <p className="figure-sub">{context.includeInitiative ? "Base model plus initiative" : "Base model only"}</p>
                </div>
                <div className="figure">
                  <p className="figure-label">Target</p>
                  <p className="figure-value">{formatUsd(context.targetEvUsd, scale)}</p>
                </div>
                <div className="figure">
                  <p className="figure-label">Status</p>
                  <p className="figure-value">
                    {evaluation.gapUsd === null ? "unsupported" : evaluation.gapUsd >= 0 ? "holds" : "fails"}
                  </p>
                  <p className="figure-sub">{formatUsd(evaluation.gapUsd, scale)} against target</p>
                </div>
              </div>
            </section>

            <section className="card">
              <h2>Single-variable thresholds</h2>
              <div className="row">
                <label className="field" style={{ marginBottom: 0 }}>
                  <span className="field-label">Test WACC up to +</span>
                  <select value={waccHeadroom} onChange={(event) => setWaccHeadroom(Number(event.target.value))}>
                    <option value={0.03}>3 points</option>
                    <option value={0.05}>5 points</option>
                    <option value={0.1}>10 points</option>
                    <option value={0.2}>20 points</option>
                  </select>
                </label>
                <label className="field" style={{ marginBottom: 0 }}>
                  <span className="field-label">Test capex ratio up to +</span>
                  <select value={capexHeadroom} onChange={(event) => setCapexHeadroom(Number(event.target.value))}>
                    <option value={0.05}>5 points</option>
                    <option value={0.15}>15 points</option>
                    <option value={0.3}>30 points</option>
                  </select>
                </label>
              </div>
              <div className="stack" style={{ gap: "0.75rem", marginTop: "0.75rem" }}>
                {thresholds.map((entry) => (
                  <ThresholdCard key={entry.variable} result={entry.result} scale={scale} />
                ))}
              </div>
            </section>

            <section className="card">
              <h2>Two-variable stress</h2>
              <p className="note">
                Every cell is an explicit combination inside the declared range. There is no probability, no confidence
                interval and no simulation here, because none has been specified.
              </p>

              {[
                { title: "Growth against year-five margin", grid: growthMarginGrid, xLabel: "growth", yLabel: "margin" },
                { title: "WACC against terminal growth", grid: waccTerminalGrid, xLabel: "WACC", yLabel: "terminal growth" },
              ].map(({ title, grid, xLabel, yLabel }) =>
                grid ? (
                  <div key={title} style={{ marginTop: "1rem" }}>
                    <h3>{title}</h3>
                    <div className="table-scroll" role="region" aria-label={title} tabIndex={0}>
                      <table>
                        <caption>
                          Each cell shows the value gap in {scale}. &ldquo;fails&rdquo; means the modeled value falls
                          below the target; &ldquo;unsupported&rdquo; means the model rejects that combination.
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">
                              {yLabel} \ {xLabel}
                            </th>
                            {grid.xValues.map((value, index) => (
                              <th key={index} scope="col" className="num">
                                {formatPercent(value, 1)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {grid.yValues.map((yValue, yIndex) => (
                            <tr key={yIndex}>
                              <th scope="row" className="num">
                                {formatPercent(yValue, 1)}
                              </th>
                              {grid.xValues.map((_, xIndex) => {
                                const cell = grid.cells[yIndex * grid.xValues.length + xIndex];
                                return (
                                  <td
                                    key={xIndex}
                                    className="num"
                                    style={{
                                      background:
                                        cell.holds === null
                                          ? "var(--surface-sunken)"
                                          : cell.holds
                                            ? "var(--accent-soft)"
                                            : "var(--warn-soft)",
                                    }}
                                  >
                                    {cell.holds === null ? (
                                      <span title={cell.unsupportedReason ?? ""}>unsupported</span>
                                    ) : (
                                      <>
                                        {formatUsd(cell.gapUsd, scale, 0)}
                                        <div className="footnote">{cell.holds ? "holds" : "fails"}</div>
                                      </>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null,
              )}
            </section>

            <section className="card">
              <h2>Terminal-value sensitivity</h2>
              {computation.valuation.ok ? (
                <div className="figures">
                  <div className="figure">
                    <p className="figure-label">Terminal share of value</p>
                    <p className="figure-value">{formatPercent(computation.valuation.value.terminalShare.toNumber())}</p>
                    <p className="figure-sub">
                      {formatUsd(computation.valuation.value.pvTerminal.toNumber(), scale)} of{" "}
                      {formatUsd(computation.valuation.value.enterpriseValue.toNumber(), scale)}
                    </p>
                  </div>
                  <div className="figure">
                    <p className="figure-label">Terminal reinvestment</p>
                    <p className="figure-value">{formatUsd(computation.valuation.value.terminal.reinvestment.toNumber(), scale)}</p>
                    <p className="figure-sub">
                      Terminal NOPAT × {formatPercent(a.terminal.terminalGrowth)} ÷ {formatPercent(a.terminal.terminalRoic)}
                    </p>
                  </div>
                  <div className="figure">
                    <p className="figure-label">Jump from year five</p>
                    <p className="figure-value">{formatUsd(computation.valuation.value.terminalJump.toNumber(), scale)}</p>
                    <p className="figure-sub">Shown, not smoothed</p>
                  </div>
                </div>
              ) : (
                <p className="note">The base model is unsupported, so there is no terminal value to inspect.</p>
              )}
              <p className="footnote" style={{ marginTop: "0.6rem" }}>
                The WACC against terminal growth table above is the terminal-value stress test. Combinations where WACC
                is at or below terminal growth are reported as unsupported rather than shown as a very large number.
              </p>
            </section>

            <section className="card">
              <h2>Which assumptions move the answer most</h2>
              <p className="note">
                Measured as the enterprise-value swing across the disclosed perturbation range below. This is a
                sensitivity ranking over ranges chosen here; it is not a causal importance measure.
              </p>
              <div className="table-scroll" role="region" aria-label="Sensitivity ranking" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Assumption</th>
                      <th scope="col" className="num">Range tested</th>
                      <th scope="col" className="num">Enterprise value swing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivity.map((entry) => (
                      <tr key={entry.variable}>
                        <th scope="row">{entry.label}</th>
                        <td className="num">
                          {formatPercent(entry.lowValue, 1)} to {formatPercent(entry.highValue, 1)}
                        </td>
                        <td className="num">{entry.swingUsd === null ? "unsupported in range" : formatUsd(entry.swingUsd, scale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sensitivity[0] && sensitivity[0].swingUsd !== null ? (
                <p className="note" style={{ marginTop: "0.75rem" }}>
                  The most consequential uncertain assumption here is <strong>{sensitivity[0].label.toLowerCase()}</strong>.
                  The evidence that would most improve this analysis is whatever pins that down: a disclosed operating
                  metric, a segment breakdown, or a stated capital plan. Nothing in this app can supply it for you.
                </p>
              ) : null}
            </section>
          </>
        )}
      </div>

      <AssumptionsRail />
    </div>
  );
}
