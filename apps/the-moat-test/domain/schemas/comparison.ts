import { z } from "zod";

/**
 * Blind comparison contract (BRD section 8). The assignment of methods to the
 * A and B panels is derived from a seed that is stored for the session, so a
 * reload cannot conveniently reorder the labels.
 */

/**
 * What can appear in a comparison panel. The illustrative challenger is included
 * because it is what the no-key demonstration actually compares against; it is
 * labelled as hand-authored at reveal.
 */
export const PanelSourceSchema = z.enum([
  "tagged-transcript-baseline",
  "ai-structured-extraction",
  "illustrative-challenger",
]);
export type PanelSource = z.infer<typeof PanelSourceSchema>;

export const ComparisonChoiceSchema = z.enum([
  "A",
  "B",
  "tie",
  "insufficient-information",
]);
export type ComparisonChoice = z.infer<typeof ComparisonChoiceSchema>;

export const COMPARISON_CHOICE_LABELS: Record<ComparisonChoice, string> = {
  A: "Output A is more useful",
  B: "Output B is more useful",
  tie: "They are equally useful",
  "insufficient-information": "Not enough information to choose",
};

export const ComparisonSessionSchema = z
  .object({
    id: z.string().min(1),
    sampleId: z.string().min(1),
    /** Stable per browser; combined with sampleId to derive the panel order. */
    sessionSeed: z.string().min(1),
    panelA: PanelSourceSchema,
    panelB: PanelSourceSchema,
    choice: ComparisonChoiceSchema.nullable(),
    reason: z.string().nullable(),
    revealed: z.boolean(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    appVersion: z.string().min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.panelA === value.panelB) {
      ctx.addIssue({
        code: "custom",
        path: ["panelB"],
        message: "a blind comparison needs two different methods",
      });
    }
    if (value.revealed && value.choice === null) {
      ctx.addIssue({
        code: "custom",
        path: ["choice"],
        message: "identities are revealed only after a choice is recorded",
      });
    }
  });
export type ComparisonSession = z.infer<typeof ComparisonSessionSchema>;
