import { z } from "zod";

/**
 * Evidence ledger and thesis contracts (BRD section 9). An authored conclusion may
 * only cite an evidence id that exists; `scripts/validate-content.ts` fails the
 * build rather than publishing a broken reference.
 */

export const EvidenceTypeSchema = z.enum([
  "measured",
  "public-source",
  "interview",
  "assumption",
  "hypothesis",
]);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  measured: "Measured",
  "public-source": "Public source",
  interview: "Interview",
  assumption: "Assumption",
  hypothesis: "Hypothesis",
};

/**
 * A short text marker per type, so evidence types are never distinguished by
 * colour alone (BRD section 13).
 */
export const EVIDENCE_TYPE_MARKS: Record<EvidenceType, string> = {
  measured: "M",
  "public-source": "S",
  interview: "I",
  assumption: "A",
  hypothesis: "H",
};

export const EVIDENCE_TYPE_MEANINGS: Record<EvidenceType, string> = {
  measured:
    "Produced by running code in this repository and preserved as an artifact.",
  "public-source":
    "A publicly reachable document. Its existence does not make its claims true.",
  interview:
    "An approved, anonymized note from a conversation with a real person, with an actual sample size.",
  assumption:
    "A stated input chosen by the author. Not measured and not sourced.",
  hypothesis:
    "A proposition the author believes is worth testing. No evidence is claimed for it yet.",
};

export const ReviewerStatusSchema = z.enum([
  "unreviewed",
  "pending-review",
  "reviewed",
]);

export const EvidenceRecordSchema = z
  .object({
    id: z.string().regex(/^EV-\d{3}$/, "evidence ids look like EV-001"),
    type: EvidenceTypeSchema,
    sourceUrl: z.string().url().nullable(),
    artifactPath: z.string().min(1).nullable(),
    sourceTitle: z.string().min(1),
    sourceDate: z.string().min(1),
    retrievedAt: z.string().min(1),
    scope: z.string().min(1),
    observation: z.string().min(1),
    limitations: z.string().min(1),
    reviewerStatus: ReviewerStatusSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.sourceUrl === null && value.artifactPath === null) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "an evidence record needs a sourceUrl or an artifactPath",
      });
    }
  });
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;

export const ClaimSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    evidenceIds: z.array(z.string()).min(1),
  })
  .strict();
export type Claim = z.infer<typeof ClaimSchema>;

export const ThesisSchema = z
  .object({
    id: z.string().min(1),
    investigationSlug: z.string().min(1),
    status: z.enum(["draft", "reviewed"]),
    targetCustomer: ClaimSchema,
    recommendedPosition: ClaimSchema,
    alternativesRejected: z.array(
      z
        .object({
          option: z.string().min(1),
          reason: z.string().min(1),
          evidenceIds: z.array(z.string()).min(1),
        })
        .strict(),
    ),
    /**
     * Prototype inference cost is kept separate from production TCO on purpose;
     * see BRD section 9.
     */
    estimatedEconomics: z
      .object({
        prototypeInferenceCost: ClaimSchema,
        productionTco: ClaimSchema,
        excludedFromPrototypeCost: z.array(z.string().min(1)).min(1),
      })
      .strict(),
    missingCapabilities: z.array(ClaimSchema),
    disconfirmingEvidence: z.array(ClaimSchema),
  })
  .strict();
export type Thesis = z.infer<typeof ThesisSchema>;

/** Every evidence id referenced anywhere in a thesis. */
export function thesisEvidenceIds(thesis: Thesis): string[] {
  const ids = new Set<string>();
  const add = (claim: { evidenceIds: string[] }) =>
    claim.evidenceIds.forEach((id) => ids.add(id));
  add(thesis.targetCustomer);
  add(thesis.recommendedPosition);
  thesis.alternativesRejected.forEach(add);
  add(thesis.estimatedEconomics.prototypeInferenceCost);
  add(thesis.estimatedEconomics.productionTco);
  thesis.missingCapabilities.forEach(add);
  thesis.disconfirmingEvidence.forEach(add);
  return [...ids];
}
