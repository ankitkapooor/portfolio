import { z } from "zod";

/**
 * Investigation article contract (BRD section 4). The ten sections and their order
 * are fixed; each may be an honest draft.
 */

export const SECTION_KEYS = [
  "hypothesis",
  "customer-job",
  "what-was-built",
  "experiment-design",
  "results",
  "failure-cases",
  "business-implications",
  "recommendation",
  "what-would-change-it",
  "sources-and-limitations",
] as const;

export const SectionKeySchema = z.enum(SECTION_KEYS);
export type SectionKey = z.infer<typeof SectionKeySchema>;

export const SectionStatusSchema = z.enum([
  "draft",
  "evidence-pending",
  "complete",
]);
export type SectionStatus = z.infer<typeof SectionStatusSchema>;

export const SECTION_STATUS_LABELS: Record<SectionStatus, string> = {
  draft: "Draft",
  "evidence-pending": "Evidence pending",
  complete: "Complete",
};

/** A paragraph, list, callout, or a slot that renders a live component. */
export const BlockSchema = z.union([
  z
    .object({
      kind: z.literal("paragraph"),
      text: z.string().min(1),
      evidenceIds: z.array(z.string()).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("list"),
      items: z.array(z.string().min(1)).min(1),
      evidenceIds: z.array(z.string()).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("callout"),
      tone: z.enum(["limitation", "note"]),
      title: z.string().min(1),
      text: z.string().min(1),
      evidenceIds: z.array(z.string()).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("slot"),
      slot: z.enum([
        "baseline-example",
        "results-table",
        "failure-table",
        "lens-panel",
        "thesis",
        "evidence-list",
      ]),
    })
    .strict(),
]);
export type Block = z.infer<typeof BlockSchema>;

export const ArticleSectionSchema = z
  .object({
    key: SectionKeySchema,
    number: z.number().int().positive(),
    title: z.string().min(1),
    status: SectionStatusSchema,
    /** One sentence a reader can act on without reading the section. */
    standfirst: z.string().min(1),
    blocks: z.array(BlockSchema).min(1),
  })
  .strict();
export type ArticleSection = z.infer<typeof ArticleSectionSchema>;

export const InvestigationSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    question: z.string().min(1),
    capability: z.string().min(1),
    artifactType: z.literal("investigation"),
    status: z.enum(["in-progress", "published"]),
    evidenceStatus: z.string().min(1),
    demoUrl: z.string().nullable(),
    summary: z.string().min(1),
    limitations: z.array(z.string().min(1)).min(1),
    updatedAt: z.string().min(1),
    sections: z.array(ArticleSectionSchema).length(10),
  })
  .strict()
  .superRefine((value, ctx) => {
    const keys = value.sections.map((section) => section.key);
    if (keys.join("|") !== SECTION_KEYS.join("|")) {
      ctx.addIssue({
        code: "custom",
        path: ["sections"],
        message: "the ten article sections must appear in the order fixed by the BRD",
      });
    }
  });
export type Investigation = z.infer<typeof InvestigationSchema>;

/** Evidence ids referenced by any block in the article. */
export function investigationEvidenceIds(value: Investigation): string[] {
  const ids = new Set<string>();
  for (const section of value.sections) {
    for (const block of section.blocks) {
      if (block.kind === "slot") continue;
      block.evidenceIds?.forEach((id) => ids.add(id));
    }
  }
  return [...ids];
}
