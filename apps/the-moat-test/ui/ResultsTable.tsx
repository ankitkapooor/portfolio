import Link from "next/link";
import {
  formatCostPerAcceptedCase,
  formatMetric,
  type MetricSet,
} from "@/domain/evaluation";
import { metricDenominatorLabel, type Metric } from "@/domain/evaluation/metric";
import {
  PUBLISHED_SPLITS,
  SPLIT_LABELS,
  SPLIT_NOTES,
  reportFor,
} from "@/lib/reports";
import { DataModeBadge } from "./Badges";

/**
 * The measured results (BRD section 7).
 *
 * There is no overall score and no chart. The measures have different denominators
 * and no defensible weighting, so a single number would be an invention. The
 * denominator sits next to every value for the same reason.
 */

type MetricKey = Exclude<keyof MetricSet, "citationSupport">;

const METRIC_ROWS: { key: MetricKey; label: string; note: string }[] = [
  {
    key: "actionPrecision",
    label: "Action precision",
    note: "Predicted actions that matched a gold action, one-to-one.",
  },
  {
    key: "actionRecall",
    label: "Action recall",
    note: "Gold actions the method recovered.",
  },
  {
    key: "actionF1",
    label: "Action F1",
    note: "Harmonic mean of the two above. Defined only when both are.",
  },
  {
    key: "ownerAccuracy",
    label: "Owner accuracy",
    note: "Matched actions where the gold owner is a named person.",
  },
  {
    key: "dueDateAccuracy",
    label: "Due-date accuracy",
    note: "Matched actions where the gold date is an unambiguous calendar date.",
  },
  {
    key: "inventedOwnerRate",
    label: "Invented owners",
    note: "Reported separately: an owner supplied where the transcript names none.",
  },
  {
    key: "resolvedDateWhereGoldUnknownRate",
    label: "Dates resolved where gold is unknown",
    note: "Reported separately: a calendar date supplied where none is derivable.",
  },
  {
    key: "decisionStatusCorrectness",
    label: "Decision status correctness",
    note: "Matched decisions labelled current, superseded, or unresolved correctly.",
  },
  {
    key: "citationCoverage",
    label: "Citation coverage",
    note: "Extracted items that cite at least one transcript line.",
  },
  {
    key: "citationValidity",
    label: "Citation validity",
    note: "Cited line ids that exist in the transcript.",
  },
];

function MetricCell({ metric }: { metric: Metric }) {
  return (
    <td className="numeric">
      <span className="metricValue">{formatMetric(metric)}</span>
      <span className="metricDenominator">{metricDenominatorLabel(metric)}</span>
    </td>
  );
}

export function ResultsTable() {
  const reports = PUBLISHED_SPLITS.map((split) => ({
    split,
    report: reportFor(split),
  }));
  const stale = reports.filter(({ report }) => !report.comparable);

  return (
    <section className="resultsBlock" aria-labelledby="results-table-heading">
      <header className="resultsHeader">
        <h3 id="results-table-heading">
          Tagged transcript baseline, corpus {reports[0].report.corpusVersion}
        </h3>
        <DataModeBadge mode="recorded-experiment" />
      </header>
      <p className="measure resultsIntro">
        Both splits are shown because withholding the development numbers would hide
        that the method was tuned on them. There is deliberately no overall score.
      </p>

      <div className="tableScroll">
        <table className="table resultsTable">
          <caption>
            Values are micro-averaged: counts are summed across cases and then
            divided. N/A means the denominator was zero, which is not the same as a
            score of zero.
          </caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              {reports.map(({ split }) => (
                <th key={split} scope="col">
                  {SPLIT_LABELS[split]}
                  <span className="columnNote">{SPLIT_NOTES[split]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  {row.label}
                  <span className="rowNote">{row.note}</span>
                </th>
                {reports.map(({ split, report }) => (
                  <MetricCell key={split} metric={report.metrics[row.key]} />
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">
                Citation support
                <span className="rowNote">
                  Whether the cited line actually supports the claim.
                </span>
              </th>
              {reports.map(({ split, report }) => (
                <td key={split}>
                  <span className="metricValue">Pending human review</span>
                  <span className="metricDenominator">
                    {report.metrics.citationSupport.pendingItems} items await a
                    reviewer
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                Cases accepted
                <span className="rowNote">
                  All acceptance criteria met, including zero critical defects.
                </span>
              </th>
              {reports.map(({ split, report }) => (
                <td key={split} className="numeric">
                  <span className="metricValue">
                    {report.acceptedCases} of {report.attemptedCases}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                Critical defects
                <span className="rowNote">
                  Invented commitments, fabricated owners, followed injections.
                </span>
              </th>
              {reports.map(({ split, report }) => (
                <td key={split} className="numeric">
                  <span className="metricValue">{report.criticalDefectCount}</span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                Prototype inference cost per accepted case
                <span className="rowNote">
                  Total measured spend, including failed attempts, over accepted
                  cases. Not total cost of ownership.
                </span>
              </th>
              {reports.map(({ split, report }) => (
                <td key={split} className="numeric">
                  <span className="metricValue">
                    {formatCostPerAcceptedCase(report.costPerAcceptedCase)}
                  </span>
                  <span className="metricDenominator">
                    ${report.costPerAcceptedCase.totalSpendUsd.toFixed(2)} spent
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                Per-case latency
                <span className="rowNote">Nearest-rank percentiles.</span>
              </th>
              {reports.map(({ split, report }) => (
                <td key={split} className="numeric">
                  <span className="metricValue">
                    p50 {report.latency.p50Ms?.toFixed(2) ?? "N/A"} ms
                  </span>
                  <span className="metricDenominator">
                    observed {report.latency.minMs?.toFixed(2) ?? "N/A"}–
                    {report.latency.maxMs?.toFixed(2) ?? "N/A"} ms over{" "}
                    {report.latency.sampleCount} cases
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {stale.length > 0 ? (
        <p className="measure note noteLimitation">
          The corpus has changed since{" "}
          {stale.map(({ split }) => SPLIT_LABELS[split]).join(" and ")} was run.
          These numbers are stale and should not be cited until the benchmark is
          re-run.
        </p>
      ) : null}

      <p className="measure runProvenance">
        Runs{" "}
        {reports.map(({ report }, index) => (
          <span key={report.runId}>
            {index > 0 ? " and " : ""}
            <code>{report.runId}</code>
          </span>
        ))}
        . Corpus is synthetic; gold annotations are drafts that no human has
        reviewed. <Link href="/methodology">How these were produced</Link>.
      </p>
    </section>
  );
}
