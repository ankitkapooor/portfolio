"use client";

import { useId, useState } from "react";
import { useAnalysis } from "@/components/analysis-provider";
import { AssumptionsRail } from "@/components/assumptions-rail";
import { MoneyField, TextField } from "@/components/fields";
import { UnsupportedNotice } from "@/components/valuation-panels";
import {
  solveRequiredLaborBenefit,
  type InitiativePolicy,
  type InitiativeYearInputs,
  type RequiredBenefitResult,
} from "@/domain/finance/initiative";
import { formatPercent, formatUsd } from "@/domain/format";
import { SCALE_MULTIPLIERS, type Scale } from "@/domain/intake/metrics";

type FieldKind = "usd" | "fraction";

const FIELDS: Array<{ key: keyof InitiativeYearInputs; label: string; kind: FieldKind; hint?: string }> = [
  { key: "eligibleLaborCostUsd", label: "Eligible labour cost base", kind: "usd", hint: "Caps how much labour saving is even possible." },
  { key: "adoption", label: "Adoption", kind: "fraction" },
  { key: "grossEffortReduction", label: "Gross effort reduction", kind: "fraction" },
  { key: "reviewReworkCostUsd", label: "Review and rework cost", kind: "usd" },
  { key: "realizationFraction", label: "Realizable fraction of net capacity", kind: "fraction" },
  { key: "incrementalRevenueUsd", label: "Incremental revenue", kind: "usd" },
  { key: "contributionMargin", label: "Contribution margin on that revenue", kind: "fraction" },
  { key: "cannibalizedRevenueUsd", label: "Cannibalized revenue", kind: "usd" },
  { key: "cannibalizedContributionMargin", label: "Cannibalized contribution margin", kind: "fraction" },
  { key: "aiOperatingExpenseUsd", label: "AI operating expense", kind: "usd" },
  { key: "implementationOperatingExpenseUsd", label: "Implementation operating expense", kind: "usd" },
  { key: "aiCapexUsd", label: "AI capex", kind: "usd" },
  { key: "aiDaUsd", label: "Related D&A", kind: "usd" },
  { key: "incrementalOperatingNwcUsd", label: "Incremental operating NWC (level)", kind: "usd", hint: "End-of-year level. The model uses the year-on-year change." },
];

function MatrixInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}) {
  const id = useId();
  const [text, setText] = useState(() => String(value));
  const [focused, setFocused] = useState(false);
  const [lastExternal, setLastExternal] = useState(value);
  if (!focused && value !== lastExternal) {
    setLastExternal(value);
    setText(String(value));
  }
  return (
    <input
      id={id}
      type="number"
      className="num"
      aria-label={label}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setText(String(value));
      }}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = Number(event.target.value);
        if (event.target.value.trim() !== "" && Number.isFinite(parsed)) onCommit(parsed);
      }}
    />
  );
}

function displayValue(kind: FieldKind, raw: number, scale: Scale): number {
  return kind === "fraction" ? Number((raw * 100).toFixed(4)) : Number((raw / SCALE_MULTIPLIERS[scale]).toFixed(6));
}

function storedValue(kind: FieldKind, shown: number, scale: Scale): number {
  return kind === "fraction" ? shown / 100 : shown * SCALE_MULTIPLIERS[scale];
}

export default function AiPage() {
  const { document: analysis, computation, update } = useAnalysis();
  const a = computation.assumptions;
  const scale = a.displayScale;
  const initiative = analysis.initiative;
  const [required, setRequired] = useState<RequiredBenefitResult | null>(null);

  const patch = (change: Partial<typeof initiative>) =>
    update((current) => ({ ...current, initiative: { ...current.initiative, ...change } }));

  const patchYear = (index: number, change: Partial<InitiativeYearInputs>) =>
    update((current) => ({
      ...current,
      initiative: {
        ...current.initiative,
        years: current.initiative.years.map((year, position) => (position === index ? { ...year, ...change } : year)),
      },
    }));

  const overlay = computation.initiative;
  const policy: InitiativePolicy = {
    taxRate: a.forecast.taxRate,
    wacc: a.terminal.wacc,
    terminalGrowth: a.terminal.terminalGrowth,
    terminalRoic: a.terminal.terminalRoic,
  };

  return (
    <div className="workspace-body">
      <div className="stack">
        <section className="card">
          <p className="eyebrow">Step five</p>
          <h1>What would the AI initiative have to deliver?</h1>
          <p className="lede">
            One initiative, so nothing gets counted twice. Capacity created, savings actually realized, the cost of
            getting there and the timing of each are kept apart, because collapsing them is how AI business cases go
            wrong.
          </p>
          <label className="checkbox">
            <input type="checkbox" checked={initiative.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />
            <span>Include this initiative in the analysis</span>
          </label>
          <TextField label="Initiative name" value={initiative.name} onCommit={(value) => patch({ name: value })} />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={initiative.baselineOverlapResolved}
              onChange={(event) => patch({ baselineOverlapResolved: event.target.checked })}
            />
            <span>
              I have checked that the baseline forecast does not already assume these AI savings. Overlap has been
              removed.
            </span>
          </label>
        </section>

        <section className="card">
          <h2>Spend before year one</h2>
          <p className="note">
            Subtracted once, undiscounted, at time zero. It is not repeated in year one; year-one costs go in the table
            below.
          </p>
          <div className="grid-2">
            <MoneyField
              label="Implementation cash at time zero"
              usd={initiative.timeZeroImplementationCashUsd}
              scale={scale}
              onCommit={(value) => patch({ timeZeroImplementationCashUsd: value })}
            />
            <MoneyField
              label="Capex at time zero"
              usd={initiative.timeZeroCapexUsd}
              scale={scale}
              onCommit={(value) => patch({ timeZeroCapexUsd: value })}
            />
          </div>
        </section>

        <section className="card">
          <h2>Yearly inputs</h2>
          <p className="footnote">
            Currency in USD {scale}; fractions in percent, constrained to 0–100.
          </p>
          <div className="table-scroll" role="region" aria-label="Initiative yearly inputs" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Input</th>
                  {initiative.years.map((_, index) => (
                    <th key={index} scope="col" className="num">
                      Year {index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((field) => (
                  <tr key={field.key}>
                    <th scope="row">
                      {field.label}
                      {field.hint ? <div className="footnote">{field.hint}</div> : null}
                    </th>
                    {initiative.years.map((year, index) => (
                      <td key={index} className="num">
                        <MatrixInput
                          label={`${field.label}, year ${index + 1}`}
                          value={displayValue(field.kind, year[field.key], scale)}
                          onCommit={(value) => patchYear(index, { [field.key]: storedValue(field.kind, value, scale) })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2>Benefit after year five</h2>
          <div className="field">
            <span className="field-label">Persistence policy</span>
            <select
              value={initiative.persistence}
              onChange={(event) => patch({ persistence: event.target.value as "none" | "perpetuity" })}
            >
              <option value="none">No benefit after year five (default)</option>
              <option value="perpetuity">Persistent benefit, grown and reinvested at the model terminal rates</option>
            </select>
          </div>
          {initiative.persistence === "perpetuity" ? (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={initiative.ongoingCostsConfirmed}
                onChange={(event) => patch({ ongoingCostsConfirmed: event.target.checked })}
              />
              <span>
                Year-five figures already include the ongoing AI operating cost and the reinvestment needed to sustain
                this benefit.
              </span>
            </label>
          ) : null}
          <p className="footnote">
            The persistent policy grows year-five incremental NOPAT at {formatPercent(a.terminal.terminalGrowth)} and
            reinvests at a {formatPercent(a.terminal.terminalRoic)} terminal ROIC. It is a disclosed policy choice, not a
            company disclosure.
          </p>
        </section>

        {!initiative.enabled ? (
          <div className="callout">The initiative is switched off, so it contributes nothing to the analysis.</div>
        ) : overlay === null ? (
          <div className="callout callout-alert">
            The baseline model is unsupported, so no incremental economics can be computed against it.
          </div>
        ) : !overlay.ok ? (
          <UnsupportedNotice title="This initiative cannot be valued yet." issues={overlay.issues} />
        ) : (
          <>
            <section className="card">
              <h2>Incremental economics</h2>
              <div className="table-scroll" role="region" aria-label="Initiative results" tabIndex={0}>
                <table>
                  <caption>
                    Realized benefit = (eligible labour × adoption × effort reduction − review and rework) × realizable
                    fraction. Nothing is clamped at zero.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Year</th>
                      <th scope="col" className="num">Gross capacity</th>
                      <th scope="col" className="num">Net capacity</th>
                      <th scope="col" className="num">Realized benefit</th>
                      <th scope="col" className="num">Incremental EBIT</th>
                      <th scope="col" className="num">Baseline cash tax</th>
                      <th scope="col" className="num">Scenario cash tax</th>
                      <th scope="col" className="num">Incremental tax</th>
                      <th scope="col" className="num">Incremental FCFF</th>
                      <th scope="col" className="num">Discounted</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Time zero</th>
                      <td className="num">—</td>
                      <td className="num">—</td>
                      <td className="num">—</td>
                      <td className="num">—</td>
                      <td className="num">—</td>
                      <td className="num">—</td>
                      <td className="num">—</td>
                      <td className="num">{formatUsd(-overlay.value.timeZeroOutflowUsd.toNumber(), scale)}</td>
                      <td className="num">{formatUsd(-overlay.value.timeZeroOutflowUsd.toNumber(), scale)}</td>
                    </tr>
                    {overlay.value.years.map((row) => (
                      <tr key={row.year}>
                        <th scope="row">{row.year}</th>
                        <td className="num">{formatUsd(row.grossCapacityUsd.toNumber(), scale)}</td>
                        <td className="num">{formatUsd(row.netCapacityUsd.toNumber(), scale)}</td>
                        <td className="num">{formatUsd(row.realizedLaborBenefitUsd.toNumber(), scale)}</td>
                        <td className="num">{formatUsd(row.incrementalEbitUsd.toNumber(), scale)}</td>
                        <td className="num">{formatUsd(row.baselineCashTaxUsd.toNumber(), scale)}</td>
                        <td className="num">{formatUsd(row.scenarioCashTaxUsd.toNumber(), scale)}</td>
                        <td className="num">{formatUsd(row.incrementalTaxUsd.toNumber(), scale)}</td>
                        <td className="num">{formatUsd(row.incrementalFcffUsd.toNumber(), scale)}</td>
                        <td className="num">{formatUsd(row.discountedIncrementalFcffUsd.toNumber(), scale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="figures" style={{ marginTop: "1rem" }}>
                <div className="figure figure-accent">
                  <p className="figure-label">Finite-horizon incremental NPV</p>
                  <p className="figure-value">{formatUsd(overlay.value.finiteHorizonNpvUsd.toNumber(), scale)}</p>
                  <p className="figure-sub">Five years, discounted at {formatPercent(policy.wacc)}</p>
                </div>
                <div className="figure">
                  <p className="figure-label">Incremental enterprise value</p>
                  <p className="figure-value">{formatUsd(overlay.value.incrementalEnterpriseValueUsd.toNumber(), scale)}</p>
                  <p className="figure-sub">Under the {overlay.value.persistence} persistence policy</p>
                </div>
                <div className="figure">
                  <p className="figure-label">Share of the value gap it closes</p>
                  <p className="figure-value">
                    {computation.gapUsd === null || computation.gapUsd >= 0
                      ? "—"
                      : formatPercent(overlay.value.incrementalEnterpriseValueUsd.toNumber() / -computation.gapUsd)}
                  </p>
                  <p className="figure-sub">
                    {computation.gapUsd === null
                      ? "No target set"
                      : computation.gapUsd >= 0
                        ? "The base model already clears the target"
                        : `Gap to close ${formatUsd(-computation.gapUsd, scale)}`}
                  </p>
                </div>
              </div>

              <ul className="tight" style={{ marginTop: "0.75rem" }}>
                {overlay.value.notes.map((note) => (
                  <li key={note} className="footnote">
                    {note}
                  </li>
                ))}
                <li className="footnote">
                  Incremental tax is scenario cash tax minus baseline cash tax at the whole-company level, so a loss-making
                  year cannot manufacture a tax shield.
                </li>
                <li className="footnote">
                  These are your estimates. Nothing here implies the company has disclosed or endorsed them.
                </li>
              </ul>
            </section>

            <section className="card">
              <div className="card-title">
                <div>
                  <p className="eyebrow">Solve</p>
                  <h2 style={{ marginBottom: 0 }}>What must AI deliver?</h2>
                </div>
                <button
                  type="button"
                  disabled={computation.gapUsd === null || !computation.valuation.ok}
                  onClick={() => {
                    if (!computation.valuation.ok || computation.gapUsd === null) return;
                    setRequired(
                      solveRequiredLaborBenefit({
                        inputs: initiative,
                        baseline: computation.valuation.value,
                        policy,
                        gapToCloseUsd: -computation.gapUsd,
                      }),
                    );
                  }}
                >
                  Solve for annual realized labour benefit
                </button>
              </div>
              <p className="note">
                Holds every other input fixed and solves for one declared unknown: the same realized labour benefit in
                each forecast year. The answer is bounded by the eligible labour cost base.
              </p>
              {required ? (
                <div
                  className={`callout ${
                    required.status === "solved"
                      ? "callout-accent"
                      : required.status === "exceeds_eligible_base"
                        ? "callout-alert"
                        : "callout-warn"
                  }`}
                >
                  {required.status === "solved" ? (
                    <p style={{ marginBottom: 0 }}>
                      About {formatUsd(required.annualRealizedBenefitUsd, scale)} of realized labour benefit every year
                      would close the gap. {required.message}
                    </p>
                  ) : required.status === "exceeds_eligible_base" ? (
                    <p style={{ marginBottom: 0 }}>
                      {required.message} The largest eligible base in any year is{" "}
                      {formatUsd(required.largestEligibleBaseUsd, scale)}.
                    </p>
                  ) : required.status === "not_required" ? (
                    <p style={{ marginBottom: 0 }}>{required.message}</p>
                  ) : (
                    <ul className="tight" style={{ marginBottom: 0 }}>
                      {required.issues.map((issue) => (
                        <li key={issue.code}>{issue.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </section>
          </>
        )}

        <section className="card">
          <h2>Narrative evidence</h2>
          <p className="badge badge-alert">P1, not built</p>
          <p className="note">
            Structured extraction of AI claims from reports and earnings-call transcripts is a later release. It is not
            implemented here, and no claim objects are generated. Statements can be consistent with a claim without
            showing that AI caused the change, so claims, observed results and modelled effects would stay in separate
            columns when that arrives.
          </p>
        </section>
      </div>

      <AssumptionsRail />
    </div>
  );
}
