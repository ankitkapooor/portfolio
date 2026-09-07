"use client";

import type { AnalysisComputation } from "@/domain/analysis/compute";
import type { EngineIssue } from "@/domain/finance/errors";
import { formatPercent, formatPerShare, formatUsd, SCALE_LABEL } from "@/domain/format";

export function UnsupportedNotice({ title, issues }: { title: string; issues: EngineIssue[] }) {
  return (
    <div className="callout callout-alert">
      <p>
        <strong>{title}</strong>
      </p>
      <ul className="tight">
        {issues.map((issue) => (
          <li key={`${issue.code}-${issue.field ?? ""}`}>{issue.message}</li>
        ))}
      </ul>
      <p style={{ marginBottom: 0 }}>Your inputs are kept exactly as entered. Nothing has been substituted.</p>
    </div>
  );
}

export function ValuationFigures({ computation }: { computation: AnalysisComputation }) {
  const scale = computation.assumptions.displayScale;
  if (!computation.valuation.ok) {
    return <UnsupportedNotice title="This model is unsupported at the current assumptions." issues={computation.valuation.issues} />;
  }
  const run = computation.valuation.value;
  const bridge = computation.bridge;

  return (
    <div className="figures">
      <div className="figure figure-accent">
        <p className="figure-label">Modeled enterprise value</p>
        <p className="figure-value">{formatUsd(run.enterpriseValue.toNumber(), scale)}</p>
        <p className="figure-sub">{SCALE_LABEL[scale]}, unrounded internally</p>
      </div>
      <div className="figure">
        <p className="figure-label">Target enterprise value</p>
        <p className="figure-value">{computation.target.ok ? formatUsd(computation.target.value, scale) : "—"}</p>
        <p className="figure-sub">
          {computation.target.ok
            ? computation.assumptions.target.mode === "price"
              ? `From ${formatPerShare(computation.assumptions.target.marketPricePerShare)} per share on ${
                  computation.assumptions.target.priceAsOf ?? "an undated entry"
                }`
              : "Entered directly"
            : computation.target.issues[0]?.message}
        </p>
      </div>
      <div className="figure">
        <p className="figure-label">Value gap</p>
        <p className="figure-value">{formatUsd(computation.gapUsd, scale)}</p>
        <p className="figure-sub">
          {computation.percentGap === null
            ? "No target set"
            : `${formatPercent(computation.percentGap)} of the target${
                computation.gapUsd !== null && computation.gapUsd < 0 ? " — the model falls short" : " — the model clears it"
              }`}
        </p>
      </div>
      <div className="figure">
        <p className="figure-label">Value per share</p>
        <p className="figure-value">{bridge?.valuePerShare ? formatPerShare(bridge.valuePerShare.toNumber()) : "not shown"}</p>
        <p className="figure-sub">
          {bridge?.valuePerShare
            ? `Equity ${formatUsd(bridge.equityValue.toNumber(), scale)} over ${computation.assumptions.bridge.dilutedShares.toLocaleString("en-US")} shares`
            : (bridge?.notes[0] ?? "No bridge available")}
        </p>
      </div>
    </div>
  );
}

export function EquityBridgePanel({ computation }: { computation: AnalysisComputation }) {
  const scale = computation.assumptions.displayScale;
  const bridge = computation.bridge;
  if (!bridge) return null;

  const rows: Array<[string, number, string]> = [
    ["Enterprise value (operating)", bridge.enterpriseValue.toNumber(), "Discounted FCFF plus terminal value"],
    ["Plus excess cash", bridge.excessCash.toNumber(), "Excess only; required operating cash is excluded"],
    ["Plus non-operating assets", bridge.nonOperatingAssets.toNumber(), "Assets outside the operating model"],
    ["Less financial debt", -bridge.financialDebt.toNumber(), "Operating lease liabilities are not counted as debt"],
    ["Less preferred equity", -bridge.preferredEquity.toNumber(), ""],
    ["Less minority interest", -bridge.minorityInterest.toNumber(), ""],
  ];

  return (
    <div className="card">
      <div className="card-title">
        <div>
          <p className="eyebrow">Equity bridge</p>
          <h3 style={{ marginBottom: 0 }}>From enterprise value to equity value</h3>
        </div>
        <span className="badge">As of {computation.assumptions.bridgeAsOf}</span>
      </div>
      <div className="table-scroll" role="region" aria-label="Equity bridge" tabIndex={0}>
        <table>
          <tbody>
            {rows.map(([label, value, note]) => (
              <tr key={label}>
                <th scope="row">
                  {label}
                  {note ? <div className="footnote">{note}</div> : null}
                </th>
                <td className="num">{formatUsd(value, scale)}</td>
              </tr>
            ))}
            <tr className="total">
              <th scope="row">Equity value</th>
              <td className="num">{formatUsd(bridge.equityValue.toNumber(), scale)}</td>
            </tr>
            <tr className="total">
              <th scope="row">Value per share</th>
              <td className="num">{bridge.valuePerShare ? formatPerShare(bridge.valuePerShare.toNumber()) : "not shown"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {bridge.notes.length > 0 ? (
        <div className="callout callout-warn" style={{ marginTop: "0.75rem" }}>
          <ul className="tight" style={{ marginBottom: 0 }}>
            {bridge.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="footnote" style={{ marginTop: "0.6rem" }}>
        Changing debt or excess cash moves equity value and leaves operating enterprise value untouched. Borrowing to buy
        back shares is not value creation in this model.
      </p>
    </div>
  );
}

export function CashFlowTable({ computation }: { computation: AnalysisComputation }) {
  const scale = computation.assumptions.displayScale;
  if (!computation.valuation.ok) return null;
  const run = computation.valuation.value;

  return (
    <div className="card">
      <div className="card-title">
        <div>
          <p className="eyebrow">Free cash flow to the firm</p>
          <h3 style={{ marginBottom: 0 }}>Five-year forecast and terminal period</h3>
        </div>
        <span className="badge">{SCALE_LABEL[scale]}</span>
      </div>
      <div className="table-scroll" role="region" aria-label="Cash-flow forecast table" tabIndex={0}>
        <table>
          <caption>
            FCFF = NOPAT + D&amp;A − capex − change in operating working capital. Cash tax = max(EBIT, 0) × tax rate.
          </caption>
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col" className="num">Revenue</th>
              <th scope="col" className="num">Margin</th>
              <th scope="col" className="num">EBIT</th>
              <th scope="col" className="num">Cash tax</th>
              <th scope="col" className="num">NOPAT</th>
              <th scope="col" className="num">D&amp;A</th>
              <th scope="col" className="num">Capex</th>
              <th scope="col" className="num">Δ NWC</th>
              <th scope="col" className="num">FCFF</th>
              <th scope="col" className="num">Discounted</th>
            </tr>
          </thead>
          <tbody>
            {run.years.map((row, index) => (
              <tr key={row.year}>
                <th scope="row">
                  {row.year}
                  <div className="footnote">{computation.forecastYearEnds[index]}</div>
                </th>
                <td className="num">{formatUsd(row.revenue.toNumber(), scale)}</td>
                <td className="num">{formatPercent(row.margin.toNumber())}</td>
                <td className="num">{formatUsd(row.ebit.toNumber(), scale)}</td>
                <td className="num">{formatUsd(row.cashTax.toNumber(), scale)}</td>
                <td className="num">{formatUsd(row.nopat.toNumber(), scale)}</td>
                <td className="num">{formatUsd(row.da.toNumber(), scale)}</td>
                <td className="num">{formatUsd(row.capex.toNumber(), scale)}</td>
                <td className="num">{formatUsd(row.deltaNwc.toNumber(), scale)}</td>
                <td className="num">{formatUsd(row.fcff.toNumber(), scale)}</td>
                <td className="num">{formatUsd(run.discountedFcff[index].toNumber(), scale)}</td>
              </tr>
            ))}
            <tr className="total">
              <th scope="row">
                Terminal
                <div className="footnote">Period {run.years.length + 1} onward</div>
              </th>
              <td className="num">—</td>
              <td className="num">{formatPercent(computation.assumptions.forecast.targetMargin)}</td>
              <td className="num">—</td>
              <td className="num">—</td>
              <td className="num">{formatUsd(run.terminal.nopat.toNumber(), scale)}</td>
              <td className="num" colSpan={2}>
                reinvestment {formatUsd(run.terminal.reinvestment.toNumber(), scale)}
              </td>
              <td className="num">—</td>
              <td className="num">{formatUsd(run.terminal.fcff.toNumber(), scale)}</td>
              <td className="num">{formatUsd(run.pvTerminal.toNumber(), scale)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="figures" style={{ marginTop: "1rem" }}>
        <div className="figure">
          <p className="figure-label">Terminal share of enterprise value</p>
          <p className="figure-value">{formatPercent(run.terminalShare.toNumber())}</p>
          <p className="figure-sub">{formatUsd(run.pvTerminal.toNumber(), scale)} of {formatUsd(run.enterpriseValue.toNumber(), scale)}</p>
        </div>
        <div className="figure">
          <p className="figure-label">Year {run.years.length} to terminal FCFF jump</p>
          <p className="figure-value">{formatUsd(run.terminalJump.toNumber(), scale)}</p>
          <p className="figure-sub">
            {run.terminalJumpRatio ? `${formatPercent(run.terminalJumpRatio.toNumber())} of the year-${run.years.length} figure` : "Year-five FCFF is zero"}
          </p>
        </div>
      </div>

      {run.terminalJumpRatio && Math.abs(run.terminalJumpRatio.toNumber()) > 0.25 ? (
        <div className="callout callout-warn" style={{ marginTop: "0.75rem" }}>
          The terminal cash flow is more than 25% away from the final forecast year. That discontinuity is shown rather
          than smoothed away: check whether the capital intensity in the explicit years and the terminal reinvestment
          rate describe the same business.
        </div>
      ) : null}

      <p className="footnote" style={{ marginTop: "0.6rem" }}>
        Terminal reinvestment = terminal NOPAT × terminal growth ÷ terminal ROIC, and it replaces explicit capex, D&amp;A
        and working capital for the period after year {run.years.length}. It is not subtracted twice.
      </p>
    </div>
  );
}
