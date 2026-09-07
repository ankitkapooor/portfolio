import {
  EvidenceRecordSchema,
  type EvidenceRecord,
} from "@/domain/schemas/evidence";

/**
 * The evidence ledger (BRD section 9).
 *
 * Every published claim links to a record here. A claim that cites an id that is not
 * in this list fails `validate-content`, so a broken reference stops the build rather
 * than shipping quietly.
 *
 * There are no interview records. No interviews have been conducted.
 */

const HELD_OUT_RUN =
  "experiments/runs/tagged-transcript-baseline--held-out--2026-09-07.1";
const DEV_RUN =
  "experiments/runs/tagged-transcript-baseline--development--2026-09-07.1";

const RECORDS: EvidenceRecord[] = [
  {
    id: "EV-001",
    type: "measured",
    sourceUrl: null,
    artifactPath: `${HELD_OUT_RUN}/report.json`,
    sourceTitle: "Tagged transcript baseline, held-out split, corpus 2026-09-07.1",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope:
      "Twelve synthetic held-out transcripts, run once with the deterministic Tagged transcript baseline.",
    observation:
      "Action precision 1.00 (8 of 8 predicted actions matched). Action recall 0.24 (8 of 33 gold actions). Owner accuracy 0.00 (0 of 6 matched actions that have an explicit gold owner). Decision status correctness 0.07 (1 of 14 matched decisions). Zero critical defects. Zero of twelve cases met the acceptance criteria.",
    limitations:
      "Twelve cases is a small sample. The gold annotations are drafts that no human has reviewed, so every number here could move after review. This describes one narrow tag-reading method and nothing else.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-002",
    type: "measured",
    sourceUrl: null,
    artifactPath: `${DEV_RUN}/report.json`,
    sourceTitle: "Tagged transcript baseline, development split, corpus 2026-09-07.1",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope:
      "Twelve synthetic development transcripts, run once with the deterministic Tagged transcript baseline.",
    observation:
      "Action precision 1.00 (8 of 8). Action recall 0.24 (8 of 34). Owner accuracy 0.00 (0 of 6). One case met the acceptance criteria: the no-action meeting, where the baseline correctly produced no action items.",
    limitations:
      "Development cases are the ones used while building the method, so they are not an independent test. Reported here for comparison with the held-out split only.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-003",
    type: "measured",
    sourceUrl: null,
    artifactPath: "experiments/corpus/index.ts",
    sourceTitle: "Corpus composition, version 2026-09-07.1",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope:
      "The full corpus: 24 transcripts of 427 to 484 words, six case families, twelve development and twelve held-out cases, two of each family in each split.",
    observation:
      "The corpus contains 67 gold actions and 37 gold decisions across 24 cases. One case has no gold actions at all and several have no affirmative decision.",
    limitations:
      "Every transcript is synthetic and was authored for this benchmark. It is not a sample of real meetings and its difficulty distribution reflects the author's choices, not any observed population.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-004",
    type: "measured",
    sourceUrl: null,
    artifactPath: `${HELD_OUT_RUN}/evaluation.json`,
    sourceTitle: "Injection and reversal behaviour of the deterministic baseline",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope:
      "The four embedded-instruction cases and the four decision-reversal cases across both splits.",
    observation:
      "The baseline produced no item derived from an embedded instruction and never presented a reversed decision as current, because it reports every tagged decision as unresolved and never reads untagged text.",
    limitations:
      "This is safety by inability, not by judgment. A method that reads nothing cannot be tricked into reading something wrongly, and the same property is why its recall is 0.24.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-005",
    type: "measured",
    sourceUrl: null,
    artifactPath: `${HELD_OUT_RUN}/run.json`,
    sourceTitle: "Prototype inference cost of the deterministic baseline",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope: "One run of twelve held-out cases.",
    observation:
      "Measured spend was $0.00 and token usage was null, because the method makes no model calls. Per-case latency was p50 0.03 ms and p95 0.94 ms over twelve cases on the author's machine.",
    limitations:
      "Zero inference cost is a property of a method that does no inference. It says nothing about the cost of a model-based method and nothing about total cost of ownership.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-006",
    type: "assumption",
    sourceUrl: null,
    artifactPath: "server/providers/index.ts",
    sourceTitle: "No model provider is configured in this deployment",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope: "The provider seam used by the lab and by run-benchmark.",
    observation:
      "getProviderStatus() returns not-configured. The AI extraction method has never been executed, so no measured result exists for it and no comparison between it and the baseline has been made.",
    limitations:
      "This is a statement about this build, not a finding. Every claim in this investigation about what a model would do is a hypothesis.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-007",
    type: "assumption",
    sourceUrl: null,
    artifactPath: "domain/evaluation/index.ts",
    sourceTitle: "Assumed review rate used for review-inclusive cost",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope: "The review-inclusive cost formula.",
    observation:
      "A rate of $60 per hour is used as the default when review minutes are supplied. No review minutes have been recorded, so review-inclusive cost currently renders N/A.",
    limitations:
      "The rate is an assumption chosen by the author. It is not a market rate and it is not derived from anyone's salary.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-008",
    type: "assumption",
    sourceUrl: null,
    artifactPath: "content/evidence/index.ts",
    sourceTitle: "No commercial comparator has been obtained",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope: "The comparison surface and the benchmark.",
    observation:
      "No output from any commercial meeting assistant has been obtained under permitted terms, so none appears anywhere in this investigation. The baseline is not a stand-in for one and carries no vendor name.",
    limitations:
      "Until a permitted comparator exists, nothing here supports a claim about how any product on the market performs.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-009",
    type: "hypothesis",
    sourceUrl: null,
    artifactPath: "content/investigations/meeting-assistants.ts",
    sourceTitle: "Hypothesis: capture reliability, not summarisation, is the hard part",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope: "The meeting assistant category.",
    observation:
      "The author's proposition is that joining calls reliably, handling failure, and getting a usable transcript out of poor audio is where most of the engineering sits, and that transcript-to-notes is the visible but smaller part.",
    limitations:
      "Untested. Nothing in this repository measures capture, and no practitioner has been asked whether this matches their experience.",
    reviewerStatus: "unreviewed",
  },
  {
    id: "EV-010",
    type: "hypothesis",
    sourceUrl: null,
    artifactPath: "content/investigations/meeting-assistants.ts",
    sourceTitle: "Hypothesis: workflow placement determines whether notes are used",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope: "The meeting assistant category.",
    observation:
      "The author's proposition is that notes which do not arrive in the tool where work is tracked are read once and then ignored, so integration is a requirement rather than a feature.",
    limitations:
      "Untested. No user has been observed and no interviews have been conducted.",
    reviewerStatus: "unreviewed",
  },
  {
    id: "EV-011",
    type: "hypothesis",
    sourceUrl: null,
    artifactPath: "content/investigations/meeting-assistants.ts",
    sourceTitle: "Hypothesis: trust failures are asymmetric",
    sourceDate: "2026-09-07",
    retrievedAt: "2026-09-07",
    scope: "The meeting assistant category.",
    observation:
      "The author's proposition is that one fabricated commitment costs more trust than ten correct extractions earn, which would make the critical-defect count the metric a buyer should ask about first.",
    limitations:
      "Untested. It is consistent with how the acceptance criteria in this benchmark are written, but that is a design choice, not evidence.",
    reviewerStatus: "unreviewed",
  },
  {
    id: "EV-012",
    type: "public-source",
    sourceUrl: "https://www.w3.org/WAI/WCAG22/quickref/",
    artifactPath: null,
    sourceTitle: "How to Meet WCAG 2.2 (Quick Reference)",
    sourceDate: "2023-10-05",
    retrievedAt: "2026-09-06",
    scope: "Accessibility requirements applied to the comparison and article surfaces.",
    observation:
      "Used as the reference for keyboard operation, text alternatives, and not conveying information by colour alone.",
    limitations:
      "Citing the guidelines is not a conformance claim. No audit has been carried out against them.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-013",
    type: "public-source",
    sourceUrl: "https://pudding.cool/",
    artifactPath: null,
    sourceTitle: "The Pudding",
    sourceDate: "2026-09-06",
    retrievedAt: "2026-09-06",
    scope: "Editorial reference for placing interaction at the point a question arises.",
    observation:
      "Used as a design reference for the lab appearing inside the article rather than as a separate destination.",
    limitations: "A design reference. It substantiates nothing about this benchmark.",
    reviewerStatus: "pending-review",
  },
  {
    id: "EV-014",
    type: "public-source",
    sourceUrl: "https://nextjs.org/docs",
    artifactPath: null,
    sourceTitle: "Next.js documentation",
    sourceDate: "2026-09-06",
    retrievedAt: "2026-09-06",
    scope: "Implementation reference for the application shell.",
    observation:
      "Used for App Router conventions, including asynchronous route params and the generated route prop helpers.",
    limitations: "An implementation reference. It substantiates nothing about the category.",
    reviewerStatus: "pending-review",
  },
];

export const EVIDENCE: readonly EvidenceRecord[] = RECORDS.map((record) =>
  EvidenceRecordSchema.parse(record),
);

export function evidenceById(id: string): EvidenceRecord | undefined {
  return EVIDENCE.find((record) => record.id === id);
}

export function evidenceIds(): string[] {
  return EVIDENCE.map((record) => record.id);
}
