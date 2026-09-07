import type { AnalysisComputation } from "../analysis/compute";
import type { AnalysisDocument } from "../analysis/schema";
import { formatCount, formatPercent, formatPerShare, formatUsd, SCALE_LABEL } from "../format";
import { toCsv } from "../intake/csv";
import { METRIC_DEFINITIONS } from "../intake/metrics";

const DISCLAIMER =
  "This is an educational strategy-analysis tool. It is not investment advice, it does not execute trades, and no professional finance review has taken place. Enterprise value, equity value and per-share figures are model outputs from the assumptions listed here.";

/** Markdown brief: assumptions, provenance, outputs and limitations in one file. */
export function toMarkdown(document: AnalysisDocument, computation: AnalysisComputation): string {
  const a = computation.assumptions;
  const scale = a.displayScale;
  const lines: string[] = [];

  lines.push(`# ${document.company.name}${document.company.ticker ? ` (${document.company.ticker})` : ""}`);
  lines.push("");
  if (document.company.fictional) {
    lines.push(`> **Fictional company.** ${document.company.note}`);
  } else {
    lines.push(`> ${document.company.note}`);
  }
  lines.push("");
  lines.push(`Engine ${document.engineVersion} - formulas ${document.formulaVersion} - as of ${a.asOfDate}`);
  lines.push("");
  lines.push(`Amounts are shown in ${SCALE_LABEL[scale]} unless stated otherwise.`);
  lines.push("");

  lines.push("## Position");
  lines.push("");
  lines.push(document.brief.thesis.trim() || "_No thesis written yet._");
  lines.push("");
  if (document.brief.position.trim()) {
    lines.push(document.brief.position.trim());
    lines.push("");
  }

  lines.push("## Valuation result");
  lines.push("");
  if (!computation.valuation.ok) {
    lines.push("The model is currently unsupported:");
    for (const issue of computation.valuation.issues) lines.push(`- ${issue.message}`);
    lines.push("");
  } else {
    const run = computation.valuation.value;
    lines.push("| Output | Value |");
    lines.push("| --- | --- |");
    lines.push(`| Enterprise value | ${formatUsd(run.enterpriseValue.toNumber(), scale)} |`);
    lines.push(`| Present value of years 1-${a.forecast.years} | ${formatUsd(run.pvExplicit.toNumber(), scale)} |`);
    lines.push(`| Present value of terminal value | ${formatUsd(run.pvTerminal.toNumber(), scale)} |`);
    lines.push(`| Terminal share of enterprise value | ${formatPercent(run.terminalShare.toNumber())} |`);
    lines.push(
      `| Year ${a.forecast.years} FCFF to terminal FCFF jump | ${formatUsd(run.terminalJump.toNumber(), scale)}${
        run.terminalJumpRatio ? ` (${formatPercent(run.terminalJumpRatio.toNumber())})` : ""
      } |`,
    );
    if (computation.bridge) {
      lines.push(`| Equity value | ${formatUsd(computation.bridge.equityValue.toNumber(), scale)} |`);
      lines.push(
        `| Value per share | ${
          computation.bridge.valuePerShare ? formatPerShare(computation.bridge.valuePerShare.toNumber()) : "not shown"
        } |`,
      );
    }
    if (computation.target.ok) {
      lines.push(`| Target enterprise value | ${formatUsd(computation.target.value, scale)} |`);
      lines.push(
        `| Value gap | ${formatUsd(computation.gapUsd, scale)} (${formatPercent(computation.percentGap)}) |`,
      );
    }
    lines.push("");
  }

  lines.push("## Cash-flow forecast");
  lines.push("");
  if (computation.valuation.ok) {
    const run = computation.valuation.value;
    lines.push("| Year | Revenue | Margin | EBIT | Cash tax | NOPAT | D&A | Capex | Change in NWC | FCFF |");
    lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const row of run.years) {
      lines.push(
        `| ${row.year} (${computation.forecastYearEnds[row.year - 1] ?? ""}) | ${formatUsd(row.revenue.toNumber(), scale)} | ${formatPercent(
          row.margin.toNumber(),
        )} | ${formatUsd(row.ebit.toNumber(), scale)} | ${formatUsd(row.cashTax.toNumber(), scale)} | ${formatUsd(
          row.nopat.toNumber(),
          scale,
        )} | ${formatUsd(row.da.toNumber(), scale)} | ${formatUsd(row.capex.toNumber(), scale)} | ${formatUsd(
          row.deltaNwc.toNumber(),
          scale,
        )} | ${formatUsd(row.fcff.toNumber(), scale)} |`,
      );
    }
    lines.push(
      `| Terminal | | | | | ${formatUsd(run.terminal.nopat.toNumber(), scale)} | | reinvestment ${formatUsd(
        run.terminal.reinvestment.toNumber(),
        scale,
      )} | | ${formatUsd(run.terminal.fcff.toNumber(), scale)} |`,
    );
    lines.push("");
  } else {
    lines.push("_No forecast: the model is unsupported at these assumptions._");
    lines.push("");
  }

  lines.push("## Assumptions");
  lines.push("");
  lines.push("| Assumption | Value | Basis |");
  lines.push("| --- | --- | --- |");
  const basisOf = (key: string): string => {
    const entry = document.provenance[key];
    if (!entry) return "assumed";
    return [entry.basis, entry.asOf ? `as of ${entry.asOf}` : null].filter(Boolean).join(", ");
  };
  lines.push(`| Baseline revenue | ${formatUsd(a.baseline.revenueUsd, scale)} | ${basisOf("baseline.revenueUsd")} |`);
  lines.push(
    `| Baseline operating NWC | ${formatUsd(a.baseline.operatingNwcUsd, scale)} | ${basisOf("baseline.operatingNwcUsd")} |`,
  );
  lines.push(`| Annual revenue growth | ${a.forecast.growthRates.map((g) => formatPercent(g)).join(", ")} | assumed |`);
  lines.push(`| Starting operating margin | ${formatPercent(a.forecast.startingMargin)} | ${basisOf("forecast.startingMargin")} |`);
  lines.push(`| Year ${a.forecast.years} operating margin | ${formatPercent(a.forecast.targetMargin)} | assumed |`);
  lines.push(`| Cash tax rate | ${formatPercent(a.forecast.taxRate)} | assumed |`);
  lines.push(`| D&A ratio | ${a.forecast.daRatios.map((r) => formatPercent(r)).join(", ")} | ${basisOf("forecast.daRatios")} |`);
  lines.push(`| Capex ratio | ${a.forecast.capexRatios.map((r) => formatPercent(r)).join(", ")} | ${basisOf("forecast.capexRatios")} |`);
  lines.push(`| Operating NWC ratio | ${a.forecast.nwcRatios.map((r) => formatPercent(r)).join(", ")} | ${basisOf("forecast.nwcRatios")} |`);
  lines.push(`| WACC | ${formatPercent(a.terminal.wacc)} | ${basisOf("terminal.wacc")} |`);
  lines.push(`| Terminal growth | ${formatPercent(a.terminal.terminalGrowth)} | assumed |`);
  lines.push(`| Terminal ROIC | ${formatPercent(a.terminal.terminalRoic)} | assumed |`);
  lines.push(`| Excess cash | ${formatUsd(a.bridge.excessCashUsd, scale)} | ${basisOf("bridge.excessCashUsd")} |`);
  lines.push(`| Financial debt | ${formatUsd(a.bridge.financialDebtUsd, scale)} | ${basisOf("bridge.financialDebtUsd")} |`);
  lines.push(`| Diluted shares | ${formatCount(a.bridge.dilutedShares)} | ${basisOf("bridge.dilutedShares")}. ${a.sharesBasis} |`);
  if (a.target.mode === "price") {
    lines.push(
      `| Market price per share | ${formatPerShare(a.target.marketPricePerShare)} | manually entered, as of ${a.target.priceAsOf ?? "no date"} |`,
    );
  } else {
    lines.push(`| Enterprise-value target | ${formatUsd(a.target.enterpriseValueUsd, scale)} | manually entered |`);
  }
  lines.push("");

  lines.push("## Source data");
  lines.push("");
  if (document.facts.length === 0) {
    lines.push("_No reported facts are attached to this analysis._");
  } else {
    lines.push("| Fiscal year | Metric | Reported | Unit | Scale | Normalized (USD) | Source locator | Status |");
    lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const fact of document.facts) {
      lines.push(
        `| ${fact.fiscalYear} | ${METRIC_DEFINITIONS[fact.metric].label} | ${fact.rawValue} | ${fact.unit} | ${fact.scale} | ${fact.normalizedValue} | ${fact.sourceLocator || "—"} | ${fact.reviewStatus} |`,
      );
    }
  }
  lines.push("");

  lines.push("## Reconciliation");
  lines.push("");
  lines.push(
    `Materiality tolerance: the greater of $1 and ${formatPercent(computation.reconciliation.materialityPercent, 2)} of the larger absolute comparison amount.`,
  );
  lines.push("");
  lines.push("| Check | Fiscal year | Status | Difference | Tolerance |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const check of computation.reconciliation.checks) {
    lines.push(
      `| ${check.label} | ${check.fiscalYear ?? "—"} | ${check.status} | ${
        check.differenceUsd === null ? "—" : formatUsd(check.differenceUsd, "units", 0)
      } | ${check.toleranceUsd === null ? "—" : formatUsd(check.toleranceUsd, "units", 0)} |`,
    );
  }
  lines.push("");

  if (computation.initiative) {
    lines.push("## AI initiative overlay");
    lines.push("");
    lines.push(`Initiative: ${document.initiative.name}`);
    lines.push("");
    if (!computation.initiative.ok) {
      for (const issue of computation.initiative.issues) lines.push(`- ${issue.message}`);
    } else {
      const overlay = computation.initiative.value;
      lines.push("| Year | Gross capacity | Net capacity | Realized benefit | Incremental EBIT | Incremental tax | Incremental FCFF |");
      lines.push("| --- | --- | --- | --- | --- | --- | --- |");
      for (const row of overlay.years) {
        lines.push(
          `| ${row.year} | ${formatUsd(row.grossCapacityUsd.toNumber(), scale)} | ${formatUsd(
            row.netCapacityUsd.toNumber(),
            scale,
          )} | ${formatUsd(row.realizedLaborBenefitUsd.toNumber(), scale)} | ${formatUsd(
            row.incrementalEbitUsd.toNumber(),
            scale,
          )} | ${formatUsd(row.incrementalTaxUsd.toNumber(), scale)} | ${formatUsd(row.incrementalFcffUsd.toNumber(), scale)} |`,
        );
      }
      lines.push("");
      lines.push(`Time-zero cash and capex: ${formatUsd(overlay.timeZeroOutflowUsd.toNumber(), scale)} (subtracted once, undiscounted).`);
      lines.push("");
      lines.push(`Finite-horizon incremental NPV: ${formatUsd(overlay.finiteHorizonNpvUsd.toNumber(), scale)}.`);
      lines.push("");
      lines.push(
        `Incremental enterprise value under the ${overlay.persistence} persistence policy: ${formatUsd(
          overlay.incrementalEnterpriseValueUsd.toNumber(),
          scale,
        )}.`,
      );
      lines.push("");
      for (const note of overlay.notes) lines.push(`- ${note}`);
    }
    lines.push("");
  }

  lines.push("## Scope and limitations");
  lines.push("");
  lines.push("- Stock-based compensation stays inside normalized EBIT and is not added back to FCFF.");
  lines.push("- Operating leases remain operating expenses; operating lease liabilities are not subtracted as debt.");
  lines.push("- Cash taxes are max(EBIT, 0) x tax rate. There is no loss carryforward and no tax benefit on losses.");
  lines.push("- The bridge adds excess cash only, not the full cash balance.");
  lines.push("- Terminal reinvestment replaces explicit capex, D&A and working capital for period N+1.");
  lines.push("- Five annual periods, end-of-year discounting, USD only.");
  lines.push("- No live market data, no SEC retrieval and no PDF extraction in this release.");
  lines.push("");
  lines.push(DISCLAIMER);
  lines.push("");

  return lines.join("\n");
}

/** Cash-flow table plus assumptions, as CSV. */
export function toCashFlowCsv(document: AnalysisDocument, computation: AnalysisComputation): string {
  const rows: Array<Array<string | number>> = [];
  rows.push(["Priced In cash-flow export"]);
  rows.push(["company", document.company.name]);
  rows.push(["fictional", document.company.fictional ? "yes" : "no"]);
  rows.push(["engineVersion", document.engineVersion]);
  rows.push(["formulaVersion", document.formulaVersion]);
  rows.push(["asOfDate", computation.assumptions.asOfDate]);
  rows.push(["currency", "USD (unrounded base units)"]);
  rows.push([]);

  if (!computation.valuation.ok) {
    rows.push(["status", "unsupported"]);
    for (const issue of computation.valuation.issues) rows.push(["issue", issue.message]);
    return toCsv(rows);
  }

  const run = computation.valuation.value;
  rows.push([
    "year",
    "periodEnd",
    "revenueUsd",
    "margin",
    "ebitUsd",
    "cashTaxUsd",
    "nopatUsd",
    "daUsd",
    "capexUsd",
    "operatingNwcUsd",
    "deltaNwcUsd",
    "fcffUsd",
    "discountedFcffUsd",
  ]);
  run.years.forEach((row, index) => {
    rows.push([
      row.year,
      computation.forecastYearEnds[index] ?? "",
      row.revenue.toString(),
      row.margin.toString(),
      row.ebit.toString(),
      row.cashTax.toString(),
      row.nopat.toString(),
      row.da.toString(),
      row.capex.toString(),
      row.operatingNwc.toString(),
      row.deltaNwc.toString(),
      row.fcff.toString(),
      run.discountedFcff[index].toString(),
    ]);
  });
  rows.push([]);
  rows.push(["terminalNopatUsd", run.terminal.nopat.toString()]);
  rows.push(["terminalReinvestmentUsd", run.terminal.reinvestment.toString()]);
  rows.push(["terminalFcffUsd", run.terminal.fcff.toString()]);
  rows.push(["terminalValueUsd", run.terminal.value.toString()]);
  rows.push(["pvExplicitUsd", run.pvExplicit.toString()]);
  rows.push(["pvTerminalUsd", run.pvTerminal.toString()]);
  rows.push(["enterpriseValueUsd", run.enterpriseValue.toString()]);
  if (computation.bridge) {
    rows.push(["excessCashUsd", computation.bridge.excessCash.toString()]);
    rows.push(["nonOperatingAssetsUsd", computation.bridge.nonOperatingAssets.toString()]);
    rows.push(["financialDebtUsd", computation.bridge.financialDebt.toString()]);
    rows.push(["preferredEquityUsd", computation.bridge.preferredEquity.toString()]);
    rows.push(["minorityInterestUsd", computation.bridge.minorityInterest.toString()]);
    rows.push(["equityValueUsd", computation.bridge.equityValue.toString()]);
    rows.push(["valuePerShareUsd", computation.bridge.valuePerShare?.toString() ?? "not shown"]);
  }
  if (computation.target.ok) {
    rows.push(["targetEnterpriseValueUsd", computation.target.value]);
    rows.push(["valueGapUsd", computation.gapUsd ?? ""]);
  }
  rows.push([]);
  rows.push(["note", DISCLAIMER]);
  return toCsv(rows);
}

/** Source-provenance export: every reported fact with its original values. */
export function toProvenanceCsv(document: AnalysisDocument): string {
  const rows: Array<Array<string | number>> = [
    [
      "company",
      "fiscalYear",
      "periodStart",
      "periodEnd",
      "statementType",
      "metric",
      "rawValue",
      "unit",
      "scale",
      "multiplier",
      "normalizedValue",
      "sourceUrl",
      "sourceLocator",
      "filedAt",
      "reviewStatus",
      "sourceHash",
      "conversionNotes",
      "record",
    ],
  ];
  const write = (facts: typeof document.facts, record: string) => {
    for (const fact of facts) {
      rows.push([
        fact.company,
        fact.fiscalYear,
        fact.periodStart ?? "",
        fact.periodEnd,
        fact.statementType,
        fact.metric,
        fact.rawValue,
        fact.unit,
        fact.scale,
        fact.multiplier,
        fact.normalizedValue,
        fact.sourceUrl,
        fact.sourceLocator,
        fact.filedAt,
        fact.reviewStatus,
        fact.sourceHash,
        fact.conversionNotes.join(" | "),
        record,
      ]);
    }
  };
  write(document.facts, "selected");
  write(document.supersededFacts, "superseded");
  return toCsv(rows);
}
