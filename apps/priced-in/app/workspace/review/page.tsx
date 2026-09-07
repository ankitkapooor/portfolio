"use client";

import { useState } from "react";
import { useAnalysis } from "@/components/analysis-provider";
import { formatPercent, formatUsd } from "@/domain/format";
import { BASELINE_REQUIRED_METRICS } from "@/domain/intake/reconcile";
import { METRIC_DEFINITIONS, type CanonicalMetric } from "@/domain/intake/metrics";
import type { ReviewStatus } from "@/domain/intake/facts";

export default function ReviewPage() {
  const { document: analysis, computation, update } = useAnalysis();
  const scale = computation.assumptions.displayScale;
  const report = computation.reconciliation;
  const [overrideReason, setOverrideReason] = useState("");

  const blocking = report.issues.filter((issue) => issue.severity === "blocking");
  const warnings = report.issues.filter((issue) => issue.severity === "warning");
  const missingMetrics = new Set(
    report.issues.filter((issue) => issue.code === "missing_required_metric").map((issue) => issue.metric),
  );

  const setReviewStatus = (id: string, reviewStatus: ReviewStatus) =>
    update((current) => ({
      ...current,
      facts: current.facts.map((fact) => (fact.id === id ? { ...fact, reviewStatus } : fact)),
    }));

  const toggleConfirmedZero = (metric: CanonicalMetric) =>
    update((current) => ({
      ...current,
      confirmedZeros: current.confirmedZeros.includes(metric)
        ? current.confirmedZeros.filter((entry) => entry !== metric)
        : [...current.confirmedZeros, metric],
    }));

  return (
    <div className="workspace-body">
      <div className="stack">
        <section className="card">
          <div className="card-title">
            <div>
              <p className="eyebrow">Step two</p>
              <h1 style={{ marginBottom: 0 }}>Review every number against its source</h1>
            </div>
            {report.cleanData ? (
              <span className="badge badge-reported">Clean data checks pass</span>
            ) : (
              <span className="badge badge-alert">Clean-data badge withheld</span>
            )}
          </div>
          <p className="lede">
            Nothing below has been rounded, netted or inferred. Each normalized value sits beside the amount that was
            actually supplied, its unit, scale, period and source locator.
          </p>
        </section>

        {blocking.length > 0 ? (
          <section className="callout callout-alert">
            <p>
              <strong>{blocking.length} item{blocking.length === 1 ? "" : "s"} to resolve before this analysis can be
              called clean.</strong>
            </p>
            <ul className="tight" style={{ marginBottom: 0 }}>
              {blocking.map((issue, index) => (
                <li key={index}>{issue.message}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {missingMetrics.size > 0 ? (
          <section className="card">
            <h2>Missing baseline figures</h2>
            <p className="note">
              A blank is not a zero. If one of these lines genuinely is zero for this business, say so explicitly and it
              will be treated as a confirmed zero with that record kept in the export.
            </p>
            {BASELINE_REQUIRED_METRICS.filter((metric) => missingMetrics.has(metric)).map((metric) => (
              <label className="checkbox" key={metric}>
                <input
                  type="checkbox"
                  checked={analysis.confirmedZeros.includes(metric)}
                  onChange={() => toggleConfirmedZero(metric)}
                />
                <span>
                  I confirm {METRIC_DEFINITIONS[metric].label.toLowerCase()} is genuinely zero for FY
                  {analysis.baselineFiscalYear}.
                </span>
              </label>
            ))}
            {analysis.confirmedZeros.length > 0 ? (
              <p className="footnote">
                Confirmed zeros: {analysis.confirmedZeros.map((metric) => METRIC_DEFINITIONS[metric].label).join(", ")}.
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="card">
          <div className="card-title">
            <div>
              <p className="eyebrow">Reconciliation</p>
              <h2 style={{ marginBottom: 0 }}>Mandatory checks</h2>
            </div>
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">Materiality</span>
              <select
                value={analysis.materialityPercent}
                onChange={(event) => update((current) => ({ ...current, materialityPercent: Number(event.target.value) }))}
              >
                <option value={0.0001}>0.01% of the larger amount</option>
                <option value={0.001}>0.1% of the larger amount (default)</option>
                <option value={0.005}>0.5% of the larger amount</option>
                <option value={0.01}>1% of the larger amount</option>
              </select>
            </label>
          </div>
          <p className="footnote">
            Tolerance is the greater of $1 and {formatPercent(report.materialityPercent, 2)} of the larger absolute
            amount in each comparison.
          </p>
          <div className="table-scroll" role="region" aria-label="Reconciliation checks" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Check</th>
                  <th scope="col">Year</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">Left</th>
                  <th scope="col" className="num">Right</th>
                  <th scope="col" className="num">Difference</th>
                  <th scope="col" className="num">Tolerance</th>
                </tr>
              </thead>
              <tbody>
                {report.checks.map((check) => (
                  <tr key={check.id}>
                    <th scope="row">
                      {check.label}
                      <div className="footnote">{check.detail}</div>
                    </th>
                    <td>{check.fiscalYear ?? "—"}</td>
                    <td>
                      <span
                        className={`badge ${
                          check.status === "pass" ? "badge-reported" : check.status === "fail" ? "badge-alert" : ""
                        }`}
                      >
                        {check.status}
                      </span>
                    </td>
                    <td className="num">{check.leftValue === null ? "—" : formatUsd(check.leftValue, scale)}</td>
                    <td className="num">{check.rightValue === null ? "—" : formatUsd(check.rightValue, scale)}</td>
                    <td className="num">{check.differenceUsd === null ? "—" : formatUsd(check.differenceUsd, "units", 0)}</td>
                    <td className="num">{check.toleranceUsd === null ? "—" : formatUsd(check.toleranceUsd, "units", 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {warnings.length > 0 ? (
            <div className="callout callout-warn" style={{ marginTop: "0.75rem" }}>
              <ul className="tight" style={{ marginBottom: 0 }}>
                {warnings.map((issue, index) => (
                  <li key={index}>{issue.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <hr className="divider" />
          <h3>Documented override</h3>
          <p className="footnote">
            If you accept a difference beyond tolerance, record why. The override travels with the export; it does not
            make the check pass.
          </p>
          <div className="row" style={{ alignItems: "flex-end" }}>
            <div className="field" style={{ flex: "1 1 20rem", marginBottom: 0 }}>
              <label htmlFor="override-reason">Reason</label>
              <input
                id="override-reason"
                type="text"
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                placeholder="e.g. rounding in the published statement, checked against page 62"
              />
            </div>
            <button
              type="button"
              disabled={overrideReason.trim() === ""}
              onClick={() => {
                update((current) => ({
                  ...current,
                  overrides: [
                    ...current.overrides,
                    { code: "manual_override", reason: overrideReason.trim(), at: new Date().toISOString() },
                  ],
                }));
                setOverrideReason("");
              }}
            >
              Record override
            </button>
          </div>
          {analysis.overrides.length > 0 ? (
            <ul className="tight" style={{ marginTop: "0.6rem" }}>
              {analysis.overrides.map((override, index) => (
                <li key={index} className="footnote">
                  {override.at.slice(0, 10)}: {override.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="card">
          <div className="card-title">
            <div>
              <p className="eyebrow">Source-mapped inputs</p>
              <h2 style={{ marginBottom: 0 }}>{analysis.facts.length} reported facts</h2>
            </div>
            <span className="badge">Baseline FY{analysis.baselineFiscalYear ?? "—"}</span>
          </div>
          {analysis.facts.length === 0 ? (
            <p className="note">No facts are attached. Import a CSV or load the sample company.</p>
          ) : (
            <div className="table-scroll" role="region" aria-label="Reported facts" tabIndex={0} style={{ maxHeight: "40rem" }}>
              <table>
                <caption>
                  Original amounts are exactly as supplied. Normalized amounts are base USD (or a share count) after the
                  scale multiplier and any recorded sign conversion.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">FY</th>
                    <th scope="col">Metric</th>
                    <th scope="col" className="num">Original</th>
                    <th scope="col">Unit</th>
                    <th scope="col">Scale</th>
                    <th scope="col" className="num">Normalized</th>
                    <th scope="col">Period</th>
                    <th scope="col">Source locator</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.facts.map((fact) => (
                    <tr key={fact.id}>
                      <td className="num">{fact.fiscalYear}</td>
                      <td>
                        {METRIC_DEFINITIONS[fact.metric].label}
                        {fact.conversionNotes.length > 0 ? (
                          <div className="footnote">{fact.conversionNotes.join(" ")}</div>
                        ) : null}
                      </td>
                      <td className="num">{fact.rawValue.toLocaleString("en-US")}</td>
                      <td>{fact.unit}</td>
                      <td>{fact.scale}</td>
                      <td className="num">
                        {fact.unit === "shares"
                          ? fact.normalizedValue.toLocaleString("en-US", { maximumFractionDigits: 0 })
                          : formatUsd(fact.normalizedValue, scale)}
                      </td>
                      <td>
                        {fact.periodStart ? `${fact.periodStart} to ` : "at "}
                        {fact.periodEnd}
                        <div className="footnote">filed {fact.filedAt || "—"}</div>
                      </td>
                      <td>
                        {fact.sourceLocator || "—"}
                        <div className="footnote">{fact.sourceUrl || "no URL"} · hash {fact.sourceHash}</div>
                      </td>
                      <td>
                        <select
                          aria-label={`Review status for ${METRIC_DEFINITIONS[fact.metric].label} FY${fact.fiscalYear}`}
                          value={fact.reviewStatus}
                          onChange={(event) => setReviewStatus(fact.id, event.target.value as ReviewStatus)}
                        >
                          <option value="unreviewed">unreviewed</option>
                          <option value="accepted">accepted</option>
                          <option value="flagged">flagged</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {analysis.supersededFacts.length > 0 ? (
          <section className="card">
            <h2>Superseded figures</h2>
            <p className="note">
              A later filing supplied a different number for these. The later version is in use; the earlier one is kept
              so the provenance change is visible.
            </p>
            <div className="table-scroll" role="region" aria-label="Superseded facts" tabIndex={0}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">FY</th>
                    <th scope="col">Metric</th>
                    <th scope="col" className="num">Original</th>
                    <th scope="col">Filed</th>
                    <th scope="col">Source locator</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.supersededFacts.map((fact) => (
                    <tr key={fact.id}>
                      <td className="num">{fact.fiscalYear}</td>
                      <td>{METRIC_DEFINITIONS[fact.metric].label}</td>
                      <td className="num">{fact.rawValue.toLocaleString("en-US")}</td>
                      <td>{fact.filedAt || "—"}</td>
                      <td>{fact.sourceLocator || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="card">
          <h2>Accounting policy applied to these figures</h2>
          <ul className="tight">
            <li>Stock-based compensation stays inside normalized EBIT as an operating expense and is not added back to FCFF.</li>
            <li>Operating leases stay in operating expense; operating lease liabilities are not subtracted as debt in the bridge.</li>
            <li>Restructuring costs are not automatically excluded as one-off items.</li>
            <li>Operating working capital excludes cash and debt.</li>
            <li>Cash tax is max(EBIT, 0) times the forward rate you enter. Historical tax ratios are reference only.</li>
            <li>Capital expenditure is positive in model notation; a negative reported figure is converted and the conversion is recorded on the row.</li>
          </ul>
        </section>
      </div>

      <aside className="rail">
        <div className="rail-inner">
          <p className="eyebrow">Historical context</p>
          <p className="note">
            {new Set(analysis.facts.map((fact) => fact.fiscalYear)).size} fiscal year
            {new Set(analysis.facts.map((fact) => fact.fiscalYear)).size === 1 ? "" : "s"} supplied.
          </p>
          {new Set(analysis.facts.map((fact) => fact.fiscalYear)).size < 3 ? (
            <div className="callout callout-warn">
              One complete year is technically enough to run the model, but three to five years give far better context
              for the ratios. This analysis has limited historical context.
            </div>
          ) : null}
          <hr className="divider" />
          <p className="eyebrow">Review progress</p>
          <p className="note">
            {analysis.facts.filter((fact) => fact.reviewStatus === "accepted").length} accepted,{" "}
            {analysis.facts.filter((fact) => fact.reviewStatus === "flagged").length} flagged,{" "}
            {analysis.facts.filter((fact) => fact.reviewStatus === "unreviewed").length} unreviewed.
          </p>
          <p className="footnote">
            A review status is a record of your judgement. It is not evidence that the underlying figure is correct.
          </p>
        </div>
      </aside>
    </div>
  );
}
