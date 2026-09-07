import { z } from "zod";
import {
  ActionStatusSchema,
  DecisionStatusSchema,
  ISODateSchema,
  LineIdSchema,
} from "./primitives";

/**
 * The extraction contract from BRD section 12. Changing any field here changes
 * the published output format, so the shape is deliberately closed (`.strict()`)
 * — an extra key such as a model confidence score is a validation failure, not a
 * tolerated extra.
 */

export const SUMMARY_MAX_CHARS = 1200;

/** A short grounded statement: text plus the transcript lines that support it. */
export const GroundedTextSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1).max(600),
    evidenceLineIds: z.array(LineIdSchema),
  })
  .strict();
export type GroundedText = z.infer<typeof GroundedTextSchema>;

export const ExtractionDecisionSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1).max(600),
    status: DecisionStatusSchema,
    evidenceLineIds: z.array(LineIdSchema),
  })
  .strict();
export type ExtractionDecision = z.infer<typeof ExtractionDecisionSchema>;

export const ExtractionActionSchema = z
  .object({
    id: z.string().min(1),
    task: z.string().min(1).max(600),
    /** Null when the transcript does not name an owner. Never guessed. */
    owner: z.string().min(1).nullable(),
    /** Only set when a supplied meeting date and timezone make it unambiguous. */
    dueDate: ISODateSchema.nullable(),
    /** The original unresolved phrasing, e.g. "next Friday". */
    dueDateText: z.string().min(1).nullable(),
    status: ActionStatusSchema,
    evidenceLineIds: z.array(LineIdSchema),
  })
  .strict();
export type ExtractionAction = z.infer<typeof ExtractionActionSchema>;

export const ExtractionOutputSchema = z
  .object({
    summary: z.string().max(SUMMARY_MAX_CHARS),
    decisions: z.array(ExtractionDecisionSchema),
    actions: z.array(ExtractionActionSchema),
    openQuestions: z.array(GroundedTextSchema),
    uncertainties: z.array(GroundedTextSchema),
  })
  .strict();
export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;

/** Every line id cited by any item in the output, de-duplicated. */
export function citedLineIds(output: ExtractionOutput): string[] {
  const ids = new Set<string>();
  for (const decision of output.decisions) {
    decision.evidenceLineIds.forEach((id) => ids.add(id));
  }
  for (const action of output.actions) {
    action.evidenceLineIds.forEach((id) => ids.add(id));
  }
  for (const item of [...output.openQuestions, ...output.uncertainties]) {
    item.evidenceLineIds.forEach((id) => ids.add(id));
  }
  return [...ids];
}

/**
 * Server-side reference check from BRD section 12: a structurally valid output
 * can still cite lines that do not exist in the transcript it was given.
 */
export function invalidLineReferences(
  output: ExtractionOutput,
  transcriptLineIds: readonly string[],
): string[] {
  const known = new Set(transcriptLineIds);
  return citedLineIds(output).filter((id) => !known.has(id));
}
