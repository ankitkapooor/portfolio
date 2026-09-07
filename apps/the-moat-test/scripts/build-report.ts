import { existsSync } from "node:fs";
import { join } from "node:path";
import { caseById, CORPUS_VERSION } from "@/experiments/corpus";
import { CASE_FAMILY_LABELS } from "@/domain/schemas/primitives";
import { METHODS } from "@/domain/methods";
import {
  formatCostPerAcceptedCase,
  formatMetric,
  type RunEvaluation,
} from "@/domain/evaluation";
import type {
  BenchmarkReport,
  ReviewQueueItem,
} from "@/domain/evaluation/report";
import { CRITICAL_DEFECT_LABELS } from "@/domain/evaluation/defects";
import { CliError, parseFlags, requireString, runCli } from "./lib/cli";
import { readJson, readRunArtifact, runDir, writeJson } from "./lib/runs";
import { writeFileSync } from "node:fs";

/**
 * build-report: turns an evaluation into a published metrics table and a human
 * review queue (BRD section 11).
 *
 *   npm run report -- --run tagged-transcript-baseline--held-out--2026-09-07.1
 */

runCli(() => {
  const flags = parseFlags(process.argv.slice(2));
  const runId = requireString(flags, "run");
  const directory = runDir(runId);
  const evaluationPath = join(directory, "evaluation.json");
  if (!existsSync(evaluationPath)) {
    throw new CliError(
      `No evaluation.json for ${runId}. Run evaluate-run before build-report.`,
    );
  }

  const artifact = readRunArtifact(runId);
  const evaluation = readJson(evaluationPath) as RunEvaluation & {
    comparable: boolean;
  };

  const queue: ReviewQueueItem[] = [];

  for (const caseEvaluation of evaluation.cases) {
    const transcriptCase = caseById(caseEvaluation.caseId);
    if (transcriptCase && !transcriptCase.humanReviewed) {
      queue.push({
        id: `gold-${transcriptCase.id}`,
        kind: "gold-annotation",
        caseId: transcriptCase.id,
        detail: `Draft gold annotation for ${transcriptCase.id} (${CASE_FAMILY_LABELS[transcriptCase.family]}): ${transcriptCase.goldActions.length} actions, ${transcriptCase.goldDecisions.length} decisions. Authored by a coding agent and not reviewed.`,
        status: "pending",
      });
    }
    if (caseEvaluation.counts.extractedItems > 0) {
      queue.push({
        id: `support-${caseEvaluation.caseId}`,
        kind: "citation-support",
        caseId: caseEvaluation.caseId,
        detail: `Confirm that each of the ${caseEvaluation.counts.extractedItems} extracted items is actually supported by the passage it cites.`,
        status: "pending",
      });
    }
    for (const judgment of caseEvaluation.judgments) {
      if (judgment.requiresHumanReview) {
        queue.push({
          id: `adjudicate-${caseEvaluation.caseId}-${judgment.predictedId ?? judgment.goldId}`,
          kind: "match-adjudication",
          caseId: caseEvaluation.caseId,
          detail: judgment.reason,
          status: "pending",
        });
      }
    }
    for (const defect of caseEvaluation.criticalDefects) {
      queue.push({
        id: `defect-${caseEvaluation.caseId}-${defect.itemId ?? defect.kind}`,
        kind: "critical-defect",
        caseId: caseEvaluation.caseId,
        detail: `${CRITICAL_DEFECT_LABELS[defect.kind]}: ${defect.detail}`,
        status: "pending",
      });
    }
  }

  const method = METHODS[artifact.run.method];
  const report: BenchmarkReport = {
    runId,
    generatedAt: new Date().toISOString(),
    corpusVersion: CORPUS_VERSION,
    corpusIsSynthetic: true,
    goldAnnotationsHumanReviewed: false,
    comparable: evaluation.comparable,
    method: {
      id: method.id,
      name: method.name,
      version: artifact.run.methodVersion,
      summary: method.summary,
      isNot: method.isNot,
    },
    dataMode: artifact.run.dataMode,
    split: artifact.run.split,
    caseCount: artifact.run.caseCount,
    metrics: evaluation.metrics,
    totals: evaluation.totals,
    acceptedCases: evaluation.acceptedCases,
    attemptedCases: evaluation.attemptedCases,
    noActionCaseCount: evaluation.noActionCaseCount,
    criticalDefectCount: evaluation.criticalDefectCount,
    costPerAcceptedCase: evaluation.costPerAcceptedCase,
    reviewInclusiveCost: evaluation.reviewInclusiveCost,
    latency: evaluation.latency,
    reviewQueueLength: queue.length,
    limitations: [
      "The corpus is synthetic. It was authored for this benchmark and depicts no real meeting.",
      "Gold annotations are drafts written by a coding agent. No human has reviewed them.",
      "Citation support is not measured. It requires a reviewer to read each cited passage.",
      "Twelve cases per split is a small sample. Read the observed range, not the tail estimate.",
      "No commercial product was tested, and no result here describes any vendor's performance.",
    ],
  };

  writeJson(join(directory, "report.json"), report);
  writeJson(join(directory, "review-queue.json"), {
    runId,
    generatedAt: report.generatedAt,
    pendingItems: queue.length,
    items: queue,
  });
  writeFileSync(join(directory, "report.md"), renderMarkdown(report, queue), "utf8");

  process.stdout.write(
    [
      `build-report: ${runId}`,
      `  method                 ${method.name} ${artifact.run.methodVersion}`,
      `  split                  ${artifact.run.split} (${artifact.run.caseCount} synthetic cases)`,
      `  action precision       ${formatMetric(report.metrics.actionPrecision)}`,
      `  action recall          ${formatMetric(report.metrics.actionRecall)}`,
      `  action F1              ${formatMetric(report.metrics.actionF1)}`,
      `  accepted cases         ${report.acceptedCases}/${report.attemptedCases}`,
      `  cost per accepted case ${formatCostPerAcceptedCase(report.costPerAcceptedCase)}`,
      `  human review queue     ${queue.length} pending items`,
      `  written to             ${directory.replace(process.cwd(), ".")}/report.json, report.md, review-queue.json`,
      "",
    ].join("\n"),
  );
});

function renderMarkdown(report: BenchmarkReport, queue: ReviewQueueItem[]): string {
  const m = report.metrics;
  const rows: [string, string, string][] = [
    [
      "Action precision",
      formatMetric(m.actionPrecision),
      denominator(m.actionPrecision, `${report.totals.matchedActions} of ${report.totals.predictedActions} predicted actions`),
    ],
    [
      "Action recall",
      formatMetric(m.actionRecall),
      denominator(m.actionRecall, `${report.totals.matchedActions} of ${report.totals.goldActions} gold actions`),
    ],
    ["Action F1", formatMetric(m.actionF1), denominator(m.actionF1, "harmonic mean of the two above")],
    [
      "Owner accuracy",
      formatMetric(m.ownerAccuracy),
      denominator(m.ownerAccuracy, `${report.totals.ownerCorrect} of ${report.totals.ownerDenominator} matched actions with an explicit gold owner`),
    ],
    [
      "Due-date accuracy",
      formatMetric(m.dueDateAccuracy),
      denominator(m.dueDateAccuracy, `${report.totals.dueDateCorrect} of ${report.totals.dueDateDenominator} matched actions with an explicit gold date`),
    ],
    [
      "Invented owners",
      formatMetric(m.inventedOwnerRate),
      denominator(m.inventedOwnerRate, `${report.totals.inventedOwner} of ${report.totals.goldOwnerUnknown} matched actions where the gold owner is unknown`),
    ],
    [
      "Dates resolved where gold is unknown",
      formatMetric(m.resolvedDateWhereGoldUnknownRate),
      denominator(m.resolvedDateWhereGoldUnknownRate, `${report.totals.resolvedDateWhereUnknown} of ${report.totals.goldDateUnknown} matched actions where the gold date is unknown`),
    ],
    [
      "Decision status correctness",
      formatMetric(m.decisionStatusCorrectness),
      denominator(m.decisionStatusCorrectness, `${report.totals.decisionStatusCorrect} of ${report.totals.matchedDecisions} matched decisions`),
    ],
    [
      "Citation coverage",
      formatMetric(m.citationCoverage),
      denominator(m.citationCoverage, `${report.totals.citedItems} of ${report.totals.extractedItems} extracted items cite at least one line`),
    ],
    [
      "Citation validity",
      formatMetric(m.citationValidity),
      denominator(m.citationValidity, `${report.totals.validReferences} of ${report.totals.totalReferences} referenced line ids exist`),
    ],
    [
      "Citation support",
      "Pending human review",
      `${m.citationSupport.pendingItems} items await a reviewer's judgment`,
    ],
  ];

  return [
    `# Benchmark report: ${report.runId}`,
    "",
    `Generated ${report.generatedAt}.`,
    "",
    "## Scope",
    "",
    `- Method: **${report.method.name}** ${report.method.version}. ${report.method.summary}`,
    `- ${report.method.isNot}`,
    `- Data mode: ${report.dataMode}`,
    `- Corpus: ${report.corpusVersion}, ${report.caseCount} cases from the ${report.split} split. **Every transcript is synthetic.**`,
    `- Gold annotations human-reviewed: **${report.goldAnnotationsHumanReviewed ? "yes" : "no"}**`,
    `- Comparable to the current working tree: ${report.comparable ? "yes" : "no"}`,
    "",
    "## Metrics",
    "",
    "There is no overall score. Each measure has its own denominator and they are not commensurable.",
    "",
    "| Measure | Value | Denominator |",
    "| --- | --- | --- |",
    ...rows.map(([name, value, note]) => `| ${name} | ${value} | ${note} |`),
    "",
    "## Counts",
    "",
    `- Cases attempted: ${report.attemptedCases}`,
    `- Cases with no gold actions: ${report.noActionCaseCount} (reported separately; recall is N/A for these)`,
    `- Decisions missed: ${report.totals.decisionsMissed}`,
    `- Decisions invented: ${report.totals.decisionsInvented}`,
    `- Decisions incorrectly finalised: ${report.totals.decisionsIncorrectlyFinalized}`,
    `- Critical defects: ${report.criticalDefectCount}`,
    `- Matches needing human adjudication: ${report.totals.needsAdjudication}`,
    "",
    "## Cost",
    "",
    `- Prototype inference cost per accepted case: **${formatCostPerAcceptedCase(report.costPerAcceptedCase)}** (${report.acceptedCases} accepted of ${report.attemptedCases} attempted)`,
    `- Review-inclusive cost: ${report.reviewInclusiveCost.status === "ok" ? `$${report.reviewInclusiveCost.valueUsd.toFixed(2)}` : "N/A — no review minutes have been recorded"}`,
    "- Prototype inference cost is not total cost of ownership. It excludes capture, storage, reliability, support, distribution, and integration.",
    "",
    "## Latency",
    "",
    `- p50 ${report.latency.p50Ms?.toFixed(2) ?? "N/A"} ms, p95 ${report.latency.p95Ms?.toFixed(2) ?? "N/A"} ms, observed range ${report.latency.minMs?.toFixed(2) ?? "N/A"}–${report.latency.maxMs?.toFixed(2) ?? "N/A"} ms, n=${report.latency.sampleCount}`,
    `- ${report.latency.note}`,
    "",
    "## Limitations",
    "",
    ...report.limitations.map((line) => `- ${line}`),
    "",
    "## Human review queue",
    "",
    `${queue.length} items are pending. They are listed in review-queue.json.`,
    "",
    "| Kind | Count |",
    "| --- | --- |",
    ...countsByKind(queue).map(([kind, count]) => `| ${kind} | ${count} |`),
    "",
  ].join("\n");
}

function denominator(
  metric: { status: string; reason?: string },
  whenOk: string,
): string {
  return metric.status === "not-applicable" ? (metric.reason ?? "N/A") : whenOk;
}

function countsByKind(queue: ReviewQueueItem[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of queue) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  return [...counts.entries()];
}