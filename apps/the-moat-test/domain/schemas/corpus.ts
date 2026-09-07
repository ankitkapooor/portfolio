import { z } from "zod";
import {
  ActionStatusSchema,
  CaseFamilySchema,
  DecisionStatusSchema,
  ISODateSchema,
  LineIdSchema,
  SplitSchema,
  TimezoneSchema,
} from "./primitives";

/**
 * Corpus and gold-annotation contracts (BRD section 6).
 *
 * Gold annotations live experiment-side. Nothing in this file may be imported by
 * a client component or placed in a generation prompt; `scripts/validate-content.ts`
 * enforces the client half of that rule.
 */

export const MIN_CASE_WORDS = 400;
export const MAX_CASE_WORDS = 900;

export const TranscriptLineSchema = z
  .object({
    id: LineIdSchema,
    speaker: z.string().min(1),
    text: z.string().min(1),
  })
  .strict();
export type TranscriptLine = z.infer<typeof TranscriptLineSchema>;

export const GoldActionSchema = z
  .object({
    id: z.string().min(1),
    task: z.string().min(1),
    /** Null means the transcript does not name an owner; naming one is a defect. */
    owner: z.string().min(1).nullable(),
    /** Null means no unambiguous calendar date is derivable. */
    dueDate: ISODateSchema.nullable(),
    dueDateText: z.string().min(1).nullable(),
    status: ActionStatusSchema,
    evidenceLineIds: z.array(LineIdSchema).min(1),
  })
  .strict();
export type GoldAction = z.infer<typeof GoldActionSchema>;

export const GoldDecisionSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    status: DecisionStatusSchema,
    evidenceLineIds: z.array(LineIdSchema).min(1),
  })
  .strict();
export type GoldDecision = z.infer<typeof GoldDecisionSchema>;

/**
 * Alternative acceptable phrasings, keyed by gold item id. The evaluation matcher
 * treats these as equivalent to the gold text after normalization. Anything not
 * listed here and not an exact normalized match goes to human adjudication rather
 * than being silently scored.
 */
export const AcceptableAlternativesSchema = z.record(
  z.string(),
  z.array(z.string().min(1)),
);

export const GoldAnnotationSchema = z
  .object({
    caseId: z.string().min(1),
    version: z.string().min(1),
    goldActions: z.array(GoldActionSchema),
    goldDecisions: z.array(GoldDecisionSchema),
    acceptableAlternatives: AcceptableAlternativesSchema,
    annotationRationale: z.string().min(1),
    /** Authored by a coding agent. An agent writing annotations is not review. */
    humanReviewed: z.boolean(),
    reviewerId: z.string().min(1).nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.humanReviewed && value.reviewerId === null) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewerId"],
        message: "humanReviewed=true requires a reviewerId",
      });
    }
    if (!value.humanReviewed && value.reviewerId !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewerId"],
        message: "reviewerId must be null while humanReviewed=false",
      });
    }
  });
export type GoldAnnotation = z.infer<typeof GoldAnnotationSchema>;

export const TranscriptCaseSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    split: SplitSchema,
    family: CaseFamilySchema,
    title: z.string().min(1),
    /** Always true in this repository. There is no real meeting data here. */
    synthetic: z.literal(true),
    lines: z.array(TranscriptLineSchema).min(1),
    transcript: z.string().min(1),
    lineIds: z.array(LineIdSchema).min(1),
    wordCount: z.number().int().positive(),
    meetingDate: ISODateSchema.nullable(),
    timezone: TimezoneSchema.nullable(),
    goldActions: z.array(GoldActionSchema),
    goldDecisions: z.array(GoldDecisionSchema),
    acceptableAlternatives: AcceptableAlternativesSchema,
    annotationRationale: z.string().min(1),
    humanReviewed: z.boolean(),
    reviewerId: z.string().min(1).nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const ids = value.lines.map((line) => line.id);
    if (ids.join("|") !== value.lineIds.join("|")) {
      ctx.addIssue({
        code: "custom",
        path: ["lineIds"],
        message: "lineIds must match the ids of lines, in order",
      });
    }
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["lines"],
        message: "duplicate line id",
      });
    }
    if (value.wordCount < MIN_CASE_WORDS || value.wordCount > MAX_CASE_WORDS) {
      ctx.addIssue({
        code: "custom",
        path: ["wordCount"],
        message: `transcript must be ${MIN_CASE_WORDS}-${MAX_CASE_WORDS} words, got ${value.wordCount}`,
      });
    }
    const known = new Set(ids);
    const goldItems = [...value.goldActions, ...value.goldDecisions];
    for (const item of goldItems) {
      for (const lineId of item.evidenceLineIds) {
        if (!known.has(lineId)) {
          ctx.addIssue({
            code: "custom",
            path: ["goldActions"],
            message: `gold item ${item.id} cites unknown line ${lineId}`,
          });
        }
      }
    }
    const goldIds = new Set(goldItems.map((item) => item.id));
    for (const key of Object.keys(value.acceptableAlternatives)) {
      if (!goldIds.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["acceptableAlternatives", key],
          message: `alternatives declared for unknown gold item ${key}`,
        });
      }
    }
    if (value.humanReviewed && value.reviewerId === null) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewerId"],
        message: "humanReviewed=true requires a reviewerId",
      });
    }
  });
export type TranscriptCase = z.infer<typeof TranscriptCaseSchema>;

/**
 * The public projection of a case. This is the only shape allowed to cross into
 * the browser or into a generation prompt: it carries the transcript but no gold
 * annotation and no annotation rationale.
 */
export const PublicSampleSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    title: z.string().min(1),
    family: CaseFamilySchema,
    split: SplitSchema,
    synthetic: z.literal(true),
    transcript: z.string().min(1),
    lineIds: z.array(LineIdSchema),
    wordCount: z.number().int().positive(),
    meetingDate: ISODateSchema.nullable(),
    timezone: TimezoneSchema.nullable(),
  })
  .strict();
export type PublicSample = z.infer<typeof PublicSampleSchema>;

export function toPublicSample(value: TranscriptCase): PublicSample {
  return PublicSampleSchema.parse({
    id: value.id,
    version: value.version,
    title: value.title,
    family: value.family,
    split: value.split,
    synthetic: value.synthetic,
    transcript: value.transcript,
    lineIds: value.lineIds,
    wordCount: value.wordCount,
    meetingDate: value.meetingDate,
    timezone: value.timezone,
  });
}

export function goldAnnotationOf(value: TranscriptCase): GoldAnnotation {
  return GoldAnnotationSchema.parse({
    caseId: value.id,
    version: value.version,
    goldActions: value.goldActions,
    goldDecisions: value.goldDecisions,
    acceptableAlternatives: value.acceptableAlternatives,
    annotationRationale: value.annotationRationale,
    humanReviewed: value.humanReviewed,
    reviewerId: value.reviewerId,
  });
}
