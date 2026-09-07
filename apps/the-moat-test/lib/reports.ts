import type { EvaluationCounts, RunEvaluation } from "@/domain/evaluation";
import type { BenchmarkReport, ReviewQueueItem } from "@/domain/evaluation/report";
import {
  CASE_FAMILY_LABELS,
  type CaseFamily,
} from "@/domain/schemas/primitives";
import heldOutEvaluation from "@/experiments/runs/tagged-transcript-baseline--held-out--2026-09-07.1/evaluation.json";
import developmentEvaluation from "@/experiments/runs/tagged-transcript-baseline--development--2026-09-07.1/evaluation.json";
import heldOutReport from "@/experiments/runs/tagged-transcript-baseline--held-out--2026-09-07.1/report.json";
import heldOutQueue from "@/experiments/runs/tagged-transcript-baseline--held-out--2026-09-07.1/review-queue.json";
import developmentReport from "@/experiments/runs/tagged-transcript-baseline--development--2026-09-07.1/report.json";
import developmentQueue from "@/experiments/runs/tagged-transcript-baseline--development--2026-09-07.1/review-queue.json";

/**
 * The archived runs the article publishes.
 *
 * These are the artifacts `run-benchmark`, `evaluate-run` and `build-report` wrote.
 * They carry gold-derived counts but no gold text, so they are safe to render.
 * Adding a run here means running the CLIs, not editing a number by hand.
 */

const REPORTS = {
  "held-out": heldOutReport as unknown as BenchmarkReport,
  development: developmentReport as unknown as BenchmarkReport,
} as const;

type ReviewQueueFile = {
  runId: string;
  generatedAt: string;
  pendingItems: number;
  items: ReviewQueueItem[];
};

const QUEUES = {
  "held-out": heldOutQueue as unknown as ReviewQueueFile,
  development: developmentQueue as unknown as ReviewQueueFile,
} as const;

export type PublishedSplit = keyof typeof REPORTS;

export const PUBLISHED_SPLITS: readonly PublishedSplit[] = [
  "held-out",
  "development",
];

export function reportFor(split: PublishedSplit): BenchmarkReport {
  return REPORTS[split];
}

export function reviewQueueFor(split: PublishedSplit): ReviewQueueItem[] {
  return QUEUES[split].items;
}

export function allReports(): BenchmarkReport[] {
  return PUBLISHED_SPLITS.map(reportFor);
}

export const SPLIT_LABELS: Record<PublishedSplit, string> = {
  "held-out": "Held-out split",
  development: "Development split",
};

export const SPLIT_NOTES: Record<PublishedSplit, string> = {
  "held-out":
    "Twelve cases the method was not developed against. Read this one first.",
  development:
    "Twelve cases used while building the method, so not an independent test.",
};

const EVALUATIONS = {
  "held-out": heldOutEvaluation as unknown as RunEvaluation,
  development: developmentEvaluation as unknown as RunEvaluation,
} as const;

export type FamilyBreakdown = {
  family: CaseFamily;
  label: string;
  caseCount: number;
  counts: EvaluationCounts;
  criticalDefects: number;
  acceptedCases: number;
};

/**
 * Per-family counts for the failure table.
 *
 * Deliberately returns counts only. The full evaluation carries gold text in its
 * item judgments, and that must not travel to the browser.
 */
export function familyBreakdown(split: PublishedSplit): FamilyBreakdown[] {
  const evaluation = EVALUATIONS[split];
  const byFamily = new Map<CaseFamily, FamilyBreakdown>();

  for (const item of evaluation.cases) {
    const existing = byFamily.get(item.family);
    if (!existing) {
      byFamily.set(item.family, {
        family: item.family,
        label: CASE_FAMILY_LABELS[item.family],
        caseCount: 1,
        counts: { ...item.counts },
        criticalDefects: item.criticalDefects.length,
        acceptedCases: item.accepted ? 1 : 0,
      });
      continue;
    }
    existing.caseCount += 1;
    existing.criticalDefects += item.criticalDefects.length;
    existing.acceptedCases += item.accepted ? 1 : 0;
    for (const key of Object.keys(existing.counts) as (keyof EvaluationCounts)[]) {
      existing.counts[key] += item.counts[key];
    }
  }

  return [...byFamily.values()].sort((a, b) => a.label.localeCompare(b.label));
}
