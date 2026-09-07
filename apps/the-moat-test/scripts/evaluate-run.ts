import { join } from "node:path";
import { caseById } from "@/experiments/corpus";
import {
  aggregateEvaluation,
  evaluateCase,
  formatCostPerAcceptedCase,
  formatMetric,
  type CaseEvaluation,
} from "@/domain/evaluation";
import { CliError, optionalNumber, parseFlags, requireString, runCli } from "./lib/cli";
import { corpusHash, readRunArtifact, runDir, writeJson } from "./lib/runs";

/**
 * evaluate-run: reads an archived run plus the gold annotations and computes the
 * metrics (BRD section 11). It refuses to score a run whose corpus hash no longer
 * matches the working tree, because that comparison would be meaningless.
 *
 *   npm run evaluate -- --run tagged-transcript-baseline--held-out--2026-09-07.1
 */

const DEFAULT_ASSUMED_HOURLY_RATE_USD = 60;

runCli(() => {
  const flags = parseFlags(process.argv.slice(2));
  const runId = requireString(flags, "run");
  const artifact = readRunArtifact(runId);

  const currentHash = corpusHash();
  if (artifact.run.corpusHash !== currentHash) {
    if (flags["allow-version-mismatch"] !== true) {
      throw new CliError(
        [
          "Corpus version mismatch.",
          `  run archived against ${artifact.run.corpusHash.slice(0, 16)}...`,
          `  working tree holds   ${currentHash.slice(0, 16)}...`,
          "Re-run the benchmark against the current corpus, or pass --allow-version-mismatch",
          "and label the result non-comparable.",
        ].join("\n"),
        4,
      );
    }
    process.stderr.write(
      "warning: scoring against a different corpus hash. This result is non-comparable.\n",
    );
  }

  const evaluations: CaseEvaluation[] = artifact.outputs.map((caseOutput) => {
    const transcriptCase = caseById(caseOutput.caseId);
    if (!transcriptCase) {
      throw new CliError(
        `Archived run references case ${caseOutput.caseId}, which is not in the corpus.`,
      );
    }
    return evaluateCase({
      runId,
      transcriptCase,
      output: caseOutput.output,
    });
  });

  const reviewMinutes = optionalNumber(flags, "review-minutes");
  const hourlyRate =
    optionalNumber(flags, "hourly-rate") ?? DEFAULT_ASSUMED_HOURLY_RATE_USD;

  const evaluation = aggregateEvaluation({
    runId,
    cases: evaluations,
    totalSpendUsd: artifact.run.measuredCostUsd,
    latenciesMs: artifact.run.perCaseElapsedMs,
    recordedReviewMinutes: reviewMinutes,
    assumedHourlyRateUsd: hourlyRate,
  });

  const path = join(runDir(runId), "evaluation.json");
  writeJson(path, {
    ...evaluation,
    corpusHashAtEvaluation: currentHash,
    corpusHashInRun: artifact.run.corpusHash,
    comparable: artifact.run.corpusHash === currentHash,
    assumedHourlyRateUsd: hourlyRate,
    goldAnnotationsHumanReviewed: false,
  });

  const { metrics, totals } = evaluation;
  process.stdout.write(
    [
      `evaluate-run: ${runId}`,
      `  cases                    ${evaluation.attemptedCases} (${evaluation.noActionCaseCount} with no gold actions)`,
      `  action precision         ${formatMetric(metrics.actionPrecision)}  (${totals.matchedActions}/${totals.predictedActions})`,
      `  action recall            ${formatMetric(metrics.actionRecall)}  (${totals.matchedActions}/${totals.goldActions})`,
      `  action F1                ${formatMetric(metrics.actionF1)}`,
      `  owner accuracy           ${formatMetric(metrics.ownerAccuracy)}  (${totals.ownerCorrect}/${totals.ownerDenominator})`,
      `  due-date accuracy        ${formatMetric(metrics.dueDateAccuracy)}  (${totals.dueDateCorrect}/${totals.dueDateDenominator})`,
      `  invented owners          ${formatMetric(metrics.inventedOwnerRate)}  (${totals.inventedOwner}/${totals.goldOwnerUnknown})`,
      `  resolved unknown dates   ${formatMetric(metrics.resolvedDateWhereGoldUnknownRate)}  (${totals.resolvedDateWhereUnknown}/${totals.goldDateUnknown})`,
      `  decision status correct  ${formatMetric(metrics.decisionStatusCorrectness)}  (${totals.decisionStatusCorrect}/${totals.matchedDecisions})`,
      `  decisions missed         ${totals.decisionsMissed}`,
      `  decisions invented       ${totals.decisionsInvented}`,
      `  citation coverage        ${formatMetric(metrics.citationCoverage)}  (${totals.citedItems}/${totals.extractedItems})`,
      `  citation validity        ${formatMetric(metrics.citationValidity)}  (${totals.validReferences}/${totals.totalReferences})`,
      `  citation support         pending human review (${metrics.citationSupport.pendingItems} items)`,
      `  critical defects         ${evaluation.criticalDefectCount}`,
      `  needs adjudication       ${evaluation.needsAdjudicationCount}`,
      `  accepted cases           ${evaluation.acceptedCases}/${evaluation.attemptedCases}`,
      `  cost per accepted case   ${formatCostPerAcceptedCase(evaluation.costPerAcceptedCase)}`,
      `  review-inclusive cost    ${
        evaluation.reviewInclusiveCost.status === "ok"
          ? `$${evaluation.reviewInclusiveCost.valueUsd.toFixed(2)}`
          : "N/A"
      }`,
      `  latency p50 / p95        ${evaluation.latency.p50Ms?.toFixed(2) ?? "N/A"} ms / ${evaluation.latency.p95Ms?.toFixed(2) ?? "N/A"} ms (n=${evaluation.latency.sampleCount})`,
      `  written to               ${path.replace(process.cwd(), ".")}`,
      "",
      "  No overall score is produced. Gold annotations are drafts; no human has reviewed them.",
      "",
    ].join("\n"),
  );
});
