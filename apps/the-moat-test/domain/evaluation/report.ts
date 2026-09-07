import type {
  CostPerAcceptedCase,
  LatencySummary,
  MetricSet,
  ReviewInclusiveCost,
  RunEvaluation,
} from "./index";

/**
 * The published shape of a benchmark run. `scripts/build-report.ts` writes it and
 * the article reads it, so the two cannot drift: a change to the report table is a
 * type error in the CLI.
 *
 * The two literal fields are deliberate. A report that claimed a non-synthetic
 * corpus or reviewed gold annotations would not compile.
 */
export type BenchmarkReport = {
  runId: string;
  generatedAt: string;
  corpusVersion: string;
  corpusIsSynthetic: true;
  goldAnnotationsHumanReviewed: false;
  /** False when the corpus has moved since the run, so the numbers are stale. */
  comparable: boolean;
  method: {
    id: string;
    name: string;
    version: string;
    summary: string;
    isNot: string;
  };
  dataMode: string;
  split: string;
  caseCount: number;
  metrics: MetricSet;
  totals: RunEvaluation["totals"];
  acceptedCases: number;
  attemptedCases: number;
  noActionCaseCount: number;
  criticalDefectCount: number;
  costPerAcceptedCase: CostPerAcceptedCase;
  reviewInclusiveCost: ReviewInclusiveCost;
  latency: LatencySummary;
  reviewQueueLength: number;
  limitations: string[];
};

export type ReviewQueueKind =
  | "gold-annotation"
  | "citation-support"
  | "match-adjudication"
  | "critical-defect";

export type ReviewQueueItem = {
  id: string;
  kind: ReviewQueueKind;
  caseId: string;
  detail: string;
  status: "pending";
};

export const REVIEW_QUEUE_KIND_LABELS: Record<ReviewQueueKind, string> = {
  "gold-annotation": "Gold annotation",
  "citation-support": "Citation support",
  "match-adjudication": "Match adjudication",
  "critical-defect": "Critical defect",
};
