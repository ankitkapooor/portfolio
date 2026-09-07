import type { TranscriptCase } from "@/domain/schemas/corpus";
import type { ExtractionOutput } from "@/domain/schemas/extraction";
import { invalidLineReferences } from "@/domain/schemas/extraction";
import type { ItemJudgment } from "@/domain/schemas/experiment";
import {
  detectCriticalDefects,
  type CriticalDefect,
} from "./defects";
import { matchActions, matchDecisions, normalizeOwner } from "./matching";
import {
  harmonicMean,
  percentile,
  ratio,
  type Metric,
} from "./metric";

export * from "./metric";
export * from "./matching";
export * from "./defects";

/**
 * Evaluation (BRD section 7). Every metric is reported separately with its own
 * denominator. There is deliberately no overall score: the BRD forbids collapsing
 * the benchmark into one number, and no weighting of these measures is defensible.
 */

/** Proposed thresholds. Configurable, but frozen for a given report. */
export const ACCEPTANCE_THRESHOLDS = {
  minActionRecall: 0.9,
  minOwnerAccuracy: 1.0,
} as const;

export type EvaluationCounts = {
  predictedActions: number;
  goldActions: number;
  matchedActions: number;
  ownerCorrect: number;
  ownerDenominator: number;
  dueDateCorrect: number;
  dueDateDenominator: number;
  inventedOwner: number;
  goldOwnerUnknown: number;
  resolvedDateWhereUnknown: number;
  goldDateUnknown: number;
  predictedDecisions: number;
  goldDecisions: number;
  matchedDecisions: number;
  decisionStatusCorrect: number;
  decisionsMissed: number;
  decisionsInvented: number;
  decisionsIncorrectlyFinalized: number;
  citedItems: number;
  extractedItems: number;
  validReferences: number;
  totalReferences: number;
  needsAdjudication: number;
};

const ZERO_COUNTS: EvaluationCounts = {
  predictedActions: 0,
  goldActions: 0,
  matchedActions: 0,
  ownerCorrect: 0,
  ownerDenominator: 0,
  dueDateCorrect: 0,
  dueDateDenominator: 0,
  inventedOwner: 0,
  goldOwnerUnknown: 0,
  resolvedDateWhereUnknown: 0,
  goldDateUnknown: 0,
  predictedDecisions: 0,
  goldDecisions: 0,
  matchedDecisions: 0,
  decisionStatusCorrect: 0,
  decisionsMissed: 0,
  decisionsInvented: 0,
  decisionsIncorrectlyFinalized: 0,
  citedItems: 0,
  extractedItems: 0,
  validReferences: 0,
  totalReferences: 0,
  needsAdjudication: 0,
};

export function addCounts(
  a: EvaluationCounts,
  b: EvaluationCounts,
): EvaluationCounts {
  const sum = { ...ZERO_COUNTS };
  for (const key of Object.keys(ZERO_COUNTS) as (keyof EvaluationCounts)[]) {
    sum[key] = a[key] + b[key];
  }
  return sum;
}

/**
 * Citation support cannot be computed. It requires a reviewer to read the cited
 * passage and judge whether it supports the claim, so it is reported as pending.
 */
export type CitationSupport = {
  status: "requires-human-review";
  pendingItems: number;
  note: string;
};

export type MetricSet = {
  actionPrecision: Metric;
  actionRecall: Metric;
  actionF1: Metric;
  ownerAccuracy: Metric;
  dueDateAccuracy: Metric;
  /** Reported separately from accuracy, per BRD section 7. */
  inventedOwnerRate: Metric;
  resolvedDateWhereGoldUnknownRate: Metric;
  decisionStatusCorrectness: Metric;
  citationCoverage: Metric;
  citationValidity: Metric;
  citationSupport: CitationSupport;
};

export function metricsFromCounts(counts: EvaluationCounts): MetricSet {
  const actionPrecision = ratio(
    counts.matchedActions,
    counts.predictedActions,
    "No actions were predicted, so precision has no denominator.",
  );
  const actionRecall = ratio(
    counts.matchedActions,
    counts.goldActions,
    "This case has no gold actions, so recall has no denominator.",
  );
  return {
    actionPrecision,
    actionRecall,
    actionF1: harmonicMean(actionPrecision, actionRecall),
    ownerAccuracy: ratio(
      counts.ownerCorrect,
      counts.ownerDenominator,
      "No matched action has an explicit gold owner.",
    ),
    dueDateAccuracy: ratio(
      counts.dueDateCorrect,
      counts.dueDateDenominator,
      "No matched action has an explicit gold date.",
    ),
    inventedOwnerRate: ratio(
      counts.inventedOwner,
      counts.goldOwnerUnknown,
      "No matched action has an unknown gold owner.",
    ),
    resolvedDateWhereGoldUnknownRate: ratio(
      counts.resolvedDateWhereUnknown,
      counts.goldDateUnknown,
      "No matched action has an unknown gold date.",
    ),
    decisionStatusCorrectness: ratio(
      counts.decisionStatusCorrect,
      counts.matchedDecisions,
      "No decision was matched, so status correctness has no denominator.",
    ),
    citationCoverage: ratio(
      counts.citedItems,
      counts.extractedItems,
      "Nothing was extracted, so citation coverage has no denominator.",
    ),
    citationValidity: ratio(
      counts.validReferences,
      counts.totalReferences,
      "No line references were produced, so citation validity has no denominator.",
    ),
    citationSupport: {
      status: "requires-human-review",
      pendingItems: counts.extractedItems,
      note: "Citation support requires a reviewer to confirm that each cited passage actually supports the claim. No reviewer has done so.",
    },
  };
}

export type CaseEvaluation = {
  caseId: string;
  family: TranscriptCase["family"];
  split: TranscriptCase["split"];
  produced: boolean;
  counts: EvaluationCounts;
  metrics: MetricSet;
  criticalDefects: CriticalDefect[];
  invalidLineReferences: string[];
  emptyCase: boolean;
  accepted: boolean;
  acceptanceFailures: string[];
  judgments: ItemJudgment[];
};

export type EvaluateCaseInput = {
  runId: string;
  transcriptCase: TranscriptCase;
  output: ExtractionOutput | null;
};

export function evaluateCase(input: EvaluateCaseInput): CaseEvaluation {
  const { transcriptCase: item, output, runId } = input;
  const emptyCase =
    item.goldActions.length === 0 && item.goldDecisions.length === 0;

  if (output === null) {
    const counts: EvaluationCounts = {
      ...ZERO_COUNTS,
      goldActions: item.goldActions.length,
      goldDecisions: item.goldDecisions.length,
      decisionsMissed: item.goldDecisions.length,
    };
    return {
      caseId: item.id,
      family: item.family,
      split: item.split,
      produced: false,
      counts,
      metrics: metricsFromCounts(counts),
      criticalDefects: [],
      invalidLineReferences: [],
      emptyCase,
      accepted: false,
      acceptanceFailures: ["The method produced no valid output for this case."],
      judgments: [],
    };
  }

  const actionMatch = matchActions(
    output.actions,
    item.goldActions,
    item.acceptableAlternatives,
  );
  const decisionMatch = matchDecisions(
    output.decisions,
    item.goldDecisions,
    item.acceptableAlternatives,
  );

  let ownerCorrect = 0;
  let ownerDenominator = 0;
  let dueDateCorrect = 0;
  let dueDateDenominator = 0;
  let inventedOwner = 0;
  let goldOwnerUnknown = 0;
  let resolvedDateWhereUnknown = 0;
  let goldDateUnknown = 0;

  for (const { predicted, gold } of actionMatch.pairs) {
    if (gold.owner !== null) {
      ownerDenominator += 1;
      if (
        predicted.owner !== null &&
        normalizeOwner(predicted.owner) === normalizeOwner(gold.owner)
      ) {
        ownerCorrect += 1;
      }
    } else {
      goldOwnerUnknown += 1;
      if (predicted.owner !== null) inventedOwner += 1;
    }

    if (gold.dueDate !== null) {
      dueDateDenominator += 1;
      if (predicted.dueDate === gold.dueDate) dueDateCorrect += 1;
    } else {
      goldDateUnknown += 1;
      if (predicted.dueDate !== null) resolvedDateWhereUnknown += 1;
    }
  }

  let decisionStatusCorrect = 0;
  let decisionsIncorrectlyFinalized = 0;
  for (const { predicted, gold } of decisionMatch.pairs) {
    if (predicted.status === gold.status) decisionStatusCorrect += 1;
    if (gold.status !== "current" && predicted.status === "current") {
      decisionsIncorrectlyFinalized += 1;
    }
  }

  const extractedItems = [
    ...output.actions.map((action) => ({
      id: action.id,
      refs: action.evidenceLineIds,
    })),
    ...output.decisions.map((decision) => ({
      id: decision.id,
      refs: decision.evidenceLineIds,
    })),
  ];
  const knownLineIds = new Set(item.lineIds);
  const citedItems = extractedItems.filter((entry) => entry.refs.length > 0).length;
  const totalReferences = extractedItems.reduce(
    (total, entry) => total + entry.refs.length,
    0,
  );
  const validReferences = extractedItems.reduce(
    (total, entry) =>
      total + entry.refs.filter((ref) => knownLineIds.has(ref)).length,
    0,
  );

  const counts: EvaluationCounts = {
    predictedActions: output.actions.length,
    goldActions: item.goldActions.length,
    matchedActions: actionMatch.pairs.length,
    ownerCorrect,
    ownerDenominator,
    dueDateCorrect,
    dueDateDenominator,
    inventedOwner,
    goldOwnerUnknown,
    resolvedDateWhereUnknown,
    goldDateUnknown,
    predictedDecisions: output.decisions.length,
    goldDecisions: item.goldDecisions.length,
    matchedDecisions: decisionMatch.pairs.length,
    decisionStatusCorrect,
    decisionsMissed: decisionMatch.missed.length,
    decisionsInvented: decisionMatch.falsePositives.length,
    decisionsIncorrectlyFinalized,
    citedItems,
    extractedItems: extractedItems.length,
    validReferences,
    totalReferences,
    needsAdjudication:
      actionMatch.needsAdjudication.length + decisionMatch.needsAdjudication.length,
  };

  const metrics = metricsFromCounts(counts);
  const criticalDefects = detectCriticalDefects({
    output,
    actionMatch,
    decisionMatch,
    goldHasSupersededDecision: item.goldDecisions.some(
      (decision) => decision.status === "superseded",
    ),
  });

  const acceptanceFailures: string[] = [];
  if (criticalDefects.length > 0) {
    acceptanceFailures.push(
      `${criticalDefects.length} critical ${criticalDefects.length === 1 ? "defect" : "defects"}.`,
    );
  }
  if (emptyCase) {
    if (counts.predictedActions + counts.predictedDecisions > 0) {
      acceptanceFailures.push(
        "This case has no gold items, so any extracted item is invented.",
      );
    }
  } else {
    if (counts.goldActions === 0) {
      if (counts.predictedActions > 0) {
        acceptanceFailures.push(
          "This case has no gold actions, so every predicted action is invented.",
        );
      }
    } else if (
      metrics.actionRecall.status === "ok" &&
      metrics.actionRecall.value < ACCEPTANCE_THRESHOLDS.minActionRecall
    ) {
      acceptanceFailures.push(
        `Action recall ${metrics.actionRecall.value.toFixed(2)} is below the ${ACCEPTANCE_THRESHOLDS.minActionRecall.toFixed(2)} threshold.`,
      );
    }
    if (
      metrics.ownerAccuracy.status === "ok" &&
      metrics.ownerAccuracy.value < ACCEPTANCE_THRESHOLDS.minOwnerAccuracy
    ) {
      acceptanceFailures.push(
        `Owner accuracy ${metrics.ownerAccuracy.value.toFixed(2)} is below the required ${ACCEPTANCE_THRESHOLDS.minOwnerAccuracy.toFixed(2)}.`,
      );
    }
  }
  if (counts.extractedItems > 0 && counts.citedItems < counts.extractedItems) {
    acceptanceFailures.push("Not every extracted item cites a transcript line.");
  }
  if (counts.totalReferences > 0 && counts.validReferences < counts.totalReferences) {
    acceptanceFailures.push("Some cited line ids do not exist in the transcript.");
  }

  const judgments: ItemJudgment[] = [
    ...actionMatch.pairs.map<ItemJudgment>((pair) => ({
      runId,
      caseId: item.id,
      itemType: "action",
      predictedId: pair.predicted.id,
      goldId: pair.gold.id,
      judgment: "match",
      reason: "Exact match after normalization, or an accepted alternative phrasing.",
      requiresHumanReview: false,
    })),
    ...actionMatch.falsePositives.map<ItemJudgment>((prediction) => {
      const near = actionMatch.needsAdjudication.find(
        (entry) => entry.predicted.id === prediction.id,
      );
      return {
        runId,
        caseId: item.id,
        itemType: "action",
        predictedId: prediction.id,
        goldId: near?.nearestGoldId ?? null,
        judgment: near ? "needs-adjudication" : "false-positive",
        reason: near
          ? `Close to gold item ${near.nearestGoldId} but not an accepted phrasing. Counted as unmatched until a reviewer decides.`
          : "No gold action accepts this phrasing.",
        requiresHumanReview: Boolean(near),
      };
    }),
    ...actionMatch.missed.map<ItemJudgment>((gold) => ({
      runId,
      caseId: item.id,
      itemType: "action",
      predictedId: null,
      goldId: gold.id,
      judgment: "missed",
      reason: "No predicted action matched this gold action.",
      requiresHumanReview: false,
    })),
    ...decisionMatch.pairs.map<ItemJudgment>((pair) => ({
      runId,
      caseId: item.id,
      itemType: "decision",
      predictedId: pair.predicted.id,
      goldId: pair.gold.id,
      judgment: "match",
      reason:
        pair.predicted.status === pair.gold.status
          ? "Matched with the correct status."
          : `Matched, but status ${pair.predicted.status} should be ${pair.gold.status}.`,
      requiresHumanReview: pair.predicted.status !== pair.gold.status,
    })),
    ...decisionMatch.falsePositives.map<ItemJudgment>((prediction) => {
      const near = decisionMatch.needsAdjudication.find(
        (entry) => entry.predicted.id === prediction.id,
      );
      return {
        runId,
        caseId: item.id,
        itemType: "decision",
        predictedId: prediction.id,
        goldId: near?.nearestGoldId ?? null,
        judgment: near ? "needs-adjudication" : "false-positive",
        reason: near
          ? `Close to gold decision ${near.nearestGoldId} but not an accepted phrasing.`
          : "No gold decision accepts this phrasing.",
        requiresHumanReview: Boolean(near),
      };
    }),
    ...decisionMatch.missed.map<ItemJudgment>((gold) => ({
      runId,
      caseId: item.id,
      itemType: "decision",
      predictedId: null,
      goldId: gold.id,
      judgment: "missed",
      reason: "No predicted decision matched this gold decision.",
      requiresHumanReview: false,
    })),
  ];

  return {
    caseId: item.id,
    family: item.family,
    split: item.split,
    produced: true,
    counts,
    metrics,
    criticalDefects,
    invalidLineReferences: invalidLineReferences(output, item.lineIds),
    emptyCase,
    accepted: acceptanceFailures.length === 0,
    acceptanceFailures,
    judgments,
  };
}

export type CostPerAcceptedCase =
  | { status: "ok"; valueUsd: number; totalSpendUsd: number; acceptedCases: number }
  | { status: "no-accepted-cases"; totalSpendUsd: number; note: string };

/**
 * Total measured spend across all attempted cases, including failed attempts and
 * retries, divided by the number of accepted cases (BRD section 7).
 */
export function costPerAcceptedCase(
  totalSpendUsd: number,
  acceptedCases: number,
): CostPerAcceptedCase {
  if (acceptedCases === 0) {
    return {
      status: "no-accepted-cases",
      totalSpendUsd,
      note: "No case met the acceptance criteria, so there is no per-accepted-case cost to report.",
    };
  }
  return {
    status: "ok",
    valueUsd: totalSpendUsd / acceptedCases,
    totalSpendUsd,
    acceptedCases,
  };
}

export function formatCostPerAcceptedCase(value: CostPerAcceptedCase): string {
  if (value.status === "no-accepted-cases") return "No accepted cases";
  return `$${value.valueUsd.toFixed(2)}`;
}

export type ReviewInclusiveCost =
  | {
      status: "ok";
      valueUsd: number;
      assumedHourlyRateUsd: number;
      recordedReviewMinutes: number;
    }
  | { status: "not-applicable"; reason: string };

/**
 * Adds recorded review time valued at an explicitly assumed hourly rate. Review
 * minutes must be measured; they are never inferred from token counts.
 */
export function reviewInclusiveCost(args: {
  totalSpendUsd: number;
  recordedReviewMinutes: number | null;
  assumedHourlyRateUsd: number;
}): ReviewInclusiveCost {
  if (args.recordedReviewMinutes === null) {
    return {
      status: "not-applicable",
      reason:
        "No review minutes have been recorded. Review-inclusive cost cannot be computed without measured review time.",
    };
  }
  return {
    status: "ok",
    valueUsd:
      args.totalSpendUsd +
      (args.recordedReviewMinutes * args.assumedHourlyRateUsd) / 60,
    assumedHourlyRateUsd: args.assumedHourlyRateUsd,
    recordedReviewMinutes: args.recordedReviewMinutes,
  };
}

export type LatencySummary = {
  sampleCount: number;
  p50Ms: number | null;
  p95Ms: number | null;
  minMs: number | null;
  maxMs: number | null;
  note: string;
};

export function latencySummary(samples: readonly number[]): LatencySummary {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    sampleCount: samples.length,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    minMs: sorted[0] ?? null,
    maxMs: sorted[sorted.length - 1] ?? null,
    note:
      samples.length < 30
        ? `Nearest-rank percentiles over ${samples.length} samples. With a sample this small the p95 is close to the maximum; read the observed range instead of treating p95 as a tail estimate.`
        : `Nearest-rank percentiles over ${samples.length} samples.`,
  };
}

export type RunEvaluation = {
  runId: string;
  cases: CaseEvaluation[];
  /** Micro totals: counts summed across cases, then divided. */
  totals: EvaluationCounts;
  metrics: MetricSet;
  acceptedCases: number;
  attemptedCases: number;
  noActionCaseCount: number;
  noDecisionCaseCount: number;
  criticalDefectCount: number;
  needsAdjudicationCount: number;
  costPerAcceptedCase: CostPerAcceptedCase;
  reviewInclusiveCost: ReviewInclusiveCost;
  latency: LatencySummary;
};

export function aggregateEvaluation(args: {
  runId: string;
  cases: CaseEvaluation[];
  totalSpendUsd: number;
  latenciesMs: readonly number[];
  recordedReviewMinutes: number | null;
  assumedHourlyRateUsd: number;
}): RunEvaluation {
  const totals = args.cases.reduce(
    (accumulator, item) => addCounts(accumulator, item.counts),
    { ...ZERO_COUNTS },
  );
  const acceptedCases = args.cases.filter((item) => item.accepted).length;

  return {
    runId: args.runId,
    cases: args.cases,
    totals,
    metrics: metricsFromCounts(totals),
    acceptedCases,
    attemptedCases: args.cases.length,
    noActionCaseCount: args.cases.filter((item) => item.counts.goldActions === 0)
      .length,
    noDecisionCaseCount: args.cases.filter(
      (item) => item.counts.goldDecisions === 0,
    ).length,
    criticalDefectCount: args.cases.reduce(
      (total, item) => total + item.criticalDefects.length,
      0,
    ),
    needsAdjudicationCount: totals.needsAdjudication,
    costPerAcceptedCase: costPerAcceptedCase(args.totalSpendUsd, acceptedCases),
    reviewInclusiveCost: reviewInclusiveCost({
      totalSpendUsd: args.totalSpendUsd,
      recordedReviewMinutes: args.recordedReviewMinutes,
      assumedHourlyRateUsd: args.assumedHourlyRateUsd,
    }),
    latency: latencySummary(args.latenciesMs),
  };
}
