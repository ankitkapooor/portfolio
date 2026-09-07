"use client";

import { useMemo, useState } from "react";
import { useAnalysis } from "@/components/analysis-provider";
import { targetEnterpriseValueUsd } from "@/domain/analysis/document";
import { toCashFlowCsv, toMarkdown, toProvenanceCsv } from "@/domain/export/reports";
import { computeValuation, equityBridge } from "@/domain/finance/valuation";
import { formatPercent, formatPerShare, formatUsd } from "@/domain/format";
import { downloadText, slugify } from "@/lib/download";

export default function BriefPage() {
  const { document: analysis, computation, update, exportJson } = useAnalysis();
  const scale = computation.assumptions.displayScale;
  const [showMarkdown, setShowMarkdown] = useState(false);
  const slug = slugify(analysis.company.name);

  const comparison = useMemo(
    () =>
      analysis.scenarios.map((scenario) => {
        const valuation = computeValuation({
          baseline: scenario.assumptions.baseline,
          forecast: scenario.assumptions.forecast,
          terminal: scenario.assumptions.terminal,
        });
        const target = targetEnterpriseValueUsd(scenario.assumptions);
        const bridge = valuation.ok ? equityBridge(valuation.value.enterpriseValue, scenario.assumptions.bridge) : null;
        const evUsd = valuation.ok ? valuation.value.enterpriseValue.toNumber() : null;
        return {
          scenario,
          evUsd,
          equityUsd: bridge ? bridge.equityValue.toNumber() : null,
          perShare: bridge?.valuePerShare ? bridge.valuePerShare.toNumber() : null,
          targetUsd: target.ok ? target.value : null,
          gapUsd: evUsd !== null && target.ok ? evUsd - target.value : null,
          unsupported: valuation.ok ? null : valuation.issues[0]?.message,
        };
      }),
    [analysis.scenarios],
  );

  const markdown = useMemo(() => toMarkdown(analysis, computation), [analysis, computation]);

  return (
    <div className="workspace-body">
      <div className="stack">
        <section className="card">
          <p className="eyebrow">Step seven</p>
          <h1>Your position, and what it rests on</h1>
          <p className="lede">
            The model produces arithmetic. The conclusion has to be yours, and it has to name the assumptions it depends
            on.
          </p>
        </section>

        <section className="card">
          <h2>Write it down</h2>
          <div className="field">
            <label htmlFor="thesis">Thesis</label>
            <textarea
              id="thesis"
              value={analysis.brief.thesis}
              placeholder="What has to be true for this valuation to make sense, and do you believe it?"
              onChange={(event) =>
                update((current) => ({ ...current, brief: { ...current.brief, thesis: event.target.value } }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="position">Position and evidence</label>
            <textarea
              id="position"
              value={analysis.brief.position}
              placeholder="Which reported figures support this, which are assumptions, and what evidence would change your mind?"
              onChange={(event) =>
                update((current) => ({ ...current, brief: { ...current.brief, position: event.target.value } }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="notes">Working notes</label>
            <textarea
              id="notes"
              value={analysis.brief.notes}
              onChange={(event) =>
                update((current) => ({ ...current, brief: { ...current.brief, notes: event.target.value } }))
              }
            />
          </div>
        </section>

        <section className="card">
          <div className="card-title">
            <div>
              <p className="eyebrow">Comparison</p>
              <h2 style={{ marginBottom: 0 }}>Scenarios side by side</h2>
            </div>
            <button
              type="button"
              onClick={() =>
                update((current) => {
                  const active = current.scenarios.find((scenario) => scenario.id === current.activeScenarioId);
                  if (!active) return current;
                  const id = `scenario-${current.scenarios.length + 1}-${Date.now().toString(36)}`;
                  return {
                    ...current,
                    scenarios: [...current.scenarios, { id, name: `${active.name} copy`, assumptions: active.assumptions }],
                    activeScenarioId: id,
                  };
                })
              }
            >
              Duplicate the active scenario
            </button>
          </div>
          <div className="table-scroll" role="region" aria-label="Scenario comparison" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Scenario</th>
                  <th scope="col" className="num">Growth</th>
                  <th scope="col" className="num">Year-five margin</th>
                  <th scope="col" className="num">WACC</th>
                  <th scope="col" className="num">Enterprise value</th>
                  <th scope="col" className="num">Equity value</th>
                  <th scope="col" className="num">Per share</th>
                  <th scope="col" className="num">Gap to target</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((entry) => (
                  <tr key={entry.scenario.id}>
                    <th scope="row">
                      <input
                        type="text"
                        aria-label={`Name of scenario ${entry.scenario.name}`}
                        value={entry.scenario.name}
                        onChange={(event) =>
                          update((current) => ({
                            ...current,
                            scenarios: current.scenarios.map((scenario) =>
                              scenario.id === entry.scenario.id ? { ...scenario, name: event.target.value } : scenario,
                            ),
                          }))
                        }
                      />
                      {entry.scenario.id === analysis.activeScenarioId ? (
                        <div>
                          <span className="badge badge-reported">active</span>
                        </div>
                      ) : null}
                    </th>
                    <td className="num">{formatPercent(entry.scenario.assumptions.forecast.growthRates[0])}</td>
                    <td className="num">{formatPercent(entry.scenario.assumptions.forecast.targetMargin)}</td>
                    <td className="num">{formatPercent(entry.scenario.assumptions.terminal.wacc)}</td>
                    <td className="num">{entry.unsupported ? <span className="badge badge-alert">unsupported</span> : formatUsd(entry.evUsd, scale)}</td>
                    <td className="num">{formatUsd(entry.equityUsd, scale)}</td>
                    <td className="num">{entry.perShare === null ? "not shown" : formatPerShare(entry.perShare)}</td>
                    <td className="num">{formatUsd(entry.gapUsd, scale)}</td>
                    <td>
                      <div className="row" style={{ gap: "0.35rem" }}>
                        <button
                          type="button"
                          onClick={() => update((current) => ({ ...current, activeScenarioId: entry.scenario.id }))}
                          disabled={entry.scenario.id === analysis.activeScenarioId}
                        >
                          Make active
                        </button>
                        <button
                          type="button"
                          disabled={analysis.scenarios.length < 2}
                          onClick={() =>
                            update((current) => {
                              const remaining = current.scenarios.filter((scenario) => scenario.id !== entry.scenario.id);
                              if (remaining.length === 0) return current;
                              return {
                                ...current,
                                scenarios: remaining,
                                activeScenarioId: remaining.some((scenario) => scenario.id === current.activeScenarioId)
                                  ? current.activeScenarioId
                                  : remaining[0].id,
                              };
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {comparison.some((entry) => entry.unsupported) ? (
            <div className="callout callout-warn" style={{ marginTop: "0.75rem" }}>
              <ul className="tight" style={{ marginBottom: 0 }}>
                {comparison
                  .filter((entry) => entry.unsupported)
                  .map((entry) => (
                    <li key={entry.scenario.id}>
                      {entry.scenario.name}: {entry.unsupported}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>Export</h2>
          <p className="note">
            The JSON export carries every input, every source record and the engine version, and reimporting it
            reproduces the same outputs. The Markdown brief is the readable version; the CSVs are the numbers and the
            provenance.
          </p>
          <div className="row">
            <button type="button" className="button-primary" onClick={() => downloadText(`${slug}-analysis.json`, "application/json", exportJson())}>
              JSON (reimportable)
            </button>
            <button type="button" onClick={() => downloadText(`${slug}-brief.md`, "text/markdown", markdown)}>
              Markdown brief
            </button>
            <button type="button" onClick={() => downloadText(`${slug}-cash-flows.csv`, "text/csv", toCashFlowCsv(analysis, computation))}>
              Cash-flow CSV
            </button>
            <button type="button" onClick={() => downloadText(`${slug}-sources.csv`, "text/csv", toProvenanceCsv(analysis))}>
              Source provenance CSV
            </button>
            <button type="button" onClick={() => setShowMarkdown((current) => !current)} aria-expanded={showMarkdown}>
              {showMarkdown ? "Hide preview" : "Preview the brief"}
            </button>
          </div>
          {showMarkdown ? (
            <div className="table-scroll" role="region" aria-label="Markdown brief preview" tabIndex={0} style={{ maxHeight: "30rem", marginTop: "0.75rem" }}>
              <pre style={{ margin: 0, padding: "0.9rem", fontSize: "0.78rem", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)" }}>
                {markdown}
              </pre>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>Finance review checklist</h2>
          <p className="note">
            No professional finance review has taken place on this analysis. Before anyone relies on it, these are the
            scope assumptions a reviewer would have to accept or change:
          </p>
          <ul className="tight">
            <li>Five annual periods, end-of-year discounting, unlevered FCFF, USD only.</li>
            <li>A linear margin path from the starting margin to the year-five margin.</li>
            <li>Cash tax as max(EBIT, 0) times one forward rate, with no carryforwards.</li>
            <li>Stock-based compensation inside EBIT and not added back to cash flow.</li>
            <li>Operating leases as operating expense, and out of the debt figure.</li>
            <li>Excess cash, non-operating assets and the diluted share count are reviewed judgements, not extracted facts.</li>
            <li>Terminal reinvestment set by terminal growth over terminal ROIC, replacing explicit capital intensity after year five.</li>
            <li>
              {analysis.company.fictional
                ? "This company is fictional, so no real filing supports any figure here."
                : "Real-company figures were entered by hand from sources the person using this tool chose. They are unreviewed."}
            </li>
          </ul>
        </section>
      </div>

      <aside className="rail">
        <div className="rail-inner">
          <p className="eyebrow">Current result</p>
          <p className="note">
            {computation.valuation.ok
              ? `Enterprise value ${formatUsd(computation.valuation.value.enterpriseValue.toNumber(), scale)}, gap ${formatUsd(
                  computation.gapUsd,
                  scale,
                )}.`
              : "The active scenario is unsupported at its current assumptions."}
          </p>
          <p className="footnote">Last edited {analysis.updatedAt.slice(0, 19).replace("T", " ")} UTC.</p>
          <hr className="divider" />
          <p className="eyebrow">Reminder</p>
          <p className="footnote">
            This is an educational strategy-analysis tool. It is not investment advice, it does not execute trades, and
            it cannot tell you what the market expects.
          </p>
        </div>
      </aside>
    </div>
  );
}
