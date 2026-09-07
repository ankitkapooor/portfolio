import { ThesisSchema, type Thesis } from "@/domain/schemas/evidence";

/**
 * The authored commercial thesis (BRD section 9).
 *
 * Status is draft. Every claim cites an evidence id that exists in the ledger, and
 * `validate-content` fails if one does not. Citing a hypothesis record is honest:
 * it says "this is a proposition", not "this has been shown".
 */
export const THESIS: Thesis = ThesisSchema.parse({
  id: "thesis-meeting-assistants",
  investigationSlug: "meeting-assistants",
  status: "draft",
  targetCustomer: {
    id: "target-customer",
    text: "A team of five to fifty people whose commitments are made in calls and tracked somewhere else, and who already lose work in the gap between the two. Individuals are not the target: an individual can reread their own notes, and the cost of a missed action falls on the person who missed it.",
    evidenceIds: ["EV-010"],
  },
  recommendedPosition: {
    id: "recommended-position",
    text: "If you are building here, do not compete on the summary. Compete on being trusted with a commitment: capture that does not fail, extraction that leaves owners null rather than guessing, and delivery into the tool where the work is actually tracked. The measured part of this investigation supports only the middle claim, and only for one narrow method.",
    evidenceIds: ["EV-001", "EV-009", "EV-010", "EV-011"],
  },
  alternativesRejected: [
    {
      option: "Compete on summary quality",
      reason:
        "Summary quality is the part of the job that a general model reproduces most readily, and the part a reader can check least. Nothing measured here bears on it, which is itself the point: it is not where the difficulty concentrates.",
      evidenceIds: ["EV-009"],
    },
    {
      option: "Ship the deterministic baseline as a product",
      reason:
        "It recovers 8 of 33 commitments on held-out cases and gets 0 of 6 owners right. Zero of twelve cases met the acceptance criteria. It is a control, not a product.",
      evidenceIds: ["EV-001"],
    },
    {
      option: "Publish a head-to-head comparison against a named commercial tool",
      reason:
        "No permitted output from any commercial product has been obtained, so any such comparison would be fabricated.",
      evidenceIds: ["EV-008"],
    },
  ],
  estimatedEconomics: {
    prototypeInferenceCost: {
      id: "prototype-inference-cost",
      text: "Prototype inference cost for the deterministic baseline is $0.00 across 24 cases, because it makes no model calls. No model-based method has been run, so no inference cost has been measured for one.",
      evidenceIds: ["EV-005", "EV-006"],
    },
    productionTco: {
      id: "production-tco",
      text: "Production total cost of ownership has not been estimated and is not derivable from the number above. A $0.00 experiment budget is not the cost of operating a service.",
      evidenceIds: ["EV-005"],
    },
    excludedFromPrototypeCost: [
      "Meeting capture: joining calls, recording, and handling the calls where it fails",
      "Speech-to-text, which is a metered cost this prototype never incurs",
      "Storage and retention of transcripts, including deletion guarantees",
      "Reliability engineering and on-call for a service that must not miss a meeting",
      "Support, onboarding, and the human cost of correcting a wrong extraction",
      "Distribution: getting into the calendar and the workspace people already use",
      "Integration maintenance as every connected tool changes its API",
    ],
  },
  missingCapabilities: [
    {
      id: "missing-capture",
      text: "There is no capture at all. This prototype starts from a transcript that someone else produced, which skips the part the author believes is hardest.",
      evidenceIds: ["EV-009"],
    },
    {
      id: "missing-integration",
      text: "Nothing is delivered anywhere. There is no calendar, no workspace, and no task tracker on the other end of the extraction.",
      evidenceIds: ["EV-010"],
    },
    {
      id: "missing-model",
      text: "The AI challenger has never been run. Everything the article says about what a model would do is a hypothesis.",
      evidenceIds: ["EV-006"],
    },
  ],
  disconfirmingEvidence: [
    {
      id: "disconfirming-precision",
      text: "The tag-only baseline reached precision 1.00 with zero critical defects. If a buyer's real requirement is 'never invent anything', a method with no intelligence at all already satisfies it, which weakens the argument that trustworthiness alone is defensible.",
      evidenceIds: ["EV-001", "EV-004"],
    },
    {
      id: "disconfirming-safety-by-inability",
      text: "The baseline's clean injection record comes from reading almost nothing. That undercuts any reading of these numbers as evidence that careful extraction is safe; it only shows that a method which ignores text cannot be misled by it.",
      evidenceIds: ["EV-004"],
    },
    {
      id: "disconfirming-untested-position",
      text: "The recommended position rests mostly on hypotheses. If capture turns out to be a commodity and integration turns out to be a weekend of work, the whole argument collapses and nothing measured here would have warned about it.",
      evidenceIds: ["EV-009", "EV-010", "EV-011"],
    },
  ],
});
