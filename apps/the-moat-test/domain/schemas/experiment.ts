import { z } from "zod";
import { DataModeSchema, ISODateSchema, SplitSchema } from "./primitives";
import { ExtractionOutputSchema } from "./extraction";

/**
 * Run and judgment contracts (BRD section 11). An ExperimentRun is written once
 * by `scripts/run-benchmark.ts` and never mutated; evaluation writes a sibling
 * file rather than editing the run.
 */

export const MethodIdSchema = z.enum([
  "tagged-transcript-baseline",
  "ai-structured-extraction",
]);
export type MethodId = z.infer<typeof MethodIdSchema>;

export const TokenUsageSchema = z
  .object({
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
  })
  .strict();

export const RunErrorSchema = z
  .object({
    caseId: z.string().min(1),
    stage: z.enum(["generate", "validate", "repair"]),
    message: z.string().min(1),
  })
  .strict();

export const CaseOutputSchema = z
  .object({
    caseId: z.string().min(1),
    /** Null when every attempt for this case failed. */
    output: ExtractionOutputSchema.nullable(),
    attemptCount: z.number().int().positive(),
    elapsedMs: z.number().nonnegative(),
    costUsd: z.number().nonnegative(),
    invalidLineReferences: z.array(z.string()),
  })
  .strict();
export type CaseOutput = z.infer<typeof CaseOutputSchema>;

export const ExperimentRunSchema = z
  .object({
    runId: z.string().min(1),
    corpusVersion: z.string().min(1),
    split: SplitSchema,
    method: MethodIdSchema,
    methodVersion: z.string().min(1),
    dataMode: DataModeSchema,
    /** False for a deterministic run executed in the browser and not written to disk. */
    archived: z.boolean(),
    corpusHash: z.string().min(1),
    promptHash: z.string().min(1),
    provider: z.string().min(1).nullable(),
    model: z.string().min(1).nullable(),
    settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    timestamp: z.string().min(1),
    caseCount: z.number().int().nonnegative(),
    attemptCount: z.number().int().nonnegative(),
    tokenUsage: TokenUsageSchema.nullable(),
    pricingDate: ISODateSchema.nullable(),
    pricingTableVersion: z.string().min(1).nullable(),
    /** Total measured spend for this run, including failed attempts and retries. */
    measuredCostUsd: z.number().nonnegative(),
    maxCostUsd: z.number().nonnegative(),
    elapsedMs: z.number().nonnegative(),
    perCaseElapsedMs: z.array(z.number().nonnegative()),
    outputHash: z.string().min(1),
    errors: z.array(RunErrorSchema),
    reviewerStatus: z.enum(["unreviewed", "pending-review", "reviewed"]),
    reviewerId: z.string().min(1).nullable(),
    notes: z.string(),
  })
  .strict();
export type ExperimentRun = z.infer<typeof ExperimentRunSchema>;

export const RunArtifactSchema = z
  .object({
    run: ExperimentRunSchema,
    outputs: z.array(CaseOutputSchema),
  })
  .strict();
export type RunArtifact = z.infer<typeof RunArtifactSchema>;

export const ItemJudgmentSchema = z
  .object({
    runId: z.string().min(1),
    caseId: z.string().min(1),
    itemType: z.enum(["action", "decision"]),
    predictedId: z.string().min(1).nullable(),
    goldId: z.string().min(1).nullable(),
    judgment: z.enum([
      "match",
      "false-positive",
      "missed",
      "needs-adjudication",
    ]),
    reason: z.string().min(1),
    requiresHumanReview: z.boolean(),
  })
  .strict();
export type ItemJudgment = z.infer<typeof ItemJudgmentSchema>;
