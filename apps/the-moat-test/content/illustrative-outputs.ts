import {
  ExtractionOutputSchema,
  type ExtractionOutput,
} from "@/domain/schemas/extraction";

/**
 * Hand-authored outputs for the six lab samples (BRD section 3, illustrative demo).
 *
 * These were written by the author to show the shape the extraction contract asks
 * for. No model produced them. They are not a benchmark result, they carry no
 * performance claim, and requirement M-F03 means they must never be rendered in a
 * surface that reads as a measured experiment.
 */

const OUTPUTS: Record<string, ExtractionOutput> = {
  "case-001": {
    summary:
      "The onboarding email sequence is finished and blocked only on the sending domain warm-up. Legal review of the refund wording was completed in July and is not a blocker. Three tasks were accepted, each by a named person.",
    decisions: [
      {
        id: "ill-001-d1",
        text: "The onboarding sequence goes out after the domain warm-up completes.",
        status: "current",
        evidenceLineIds: ["L009", "L010"],
      },
    ],
    actions: [
      {
        id: "ill-001-a1",
        task: "Send the first onboarding email after warm-up completes",
        owner: "Maya",
        dueDate: null,
        dueDateText: "after the domain warm-up completes",
        status: "open",
        evidenceLineIds: ["L012", "L013", "L014"],
      },
      {
        id: "ill-001-a2",
        task: "Test the unsubscribe link on the mobile client",
        owner: "Tomas",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L016", "L017", "L018"],
      },
      {
        id: "ill-001-a3",
        task: "Configure the sequence exit condition so converted trial users leave the sequence",
        owner: "Tomas",
        dueDate: null,
        dueDateText: "before the warm-up finishes",
        status: "open",
        evidenceLineIds: ["L024", "L025", "L026"],
      },
    ],
    openQuestions: [],
    uncertainties: [
      {
        id: "ill-001-u1",
        text: "The warm-up is said to finish on 'the fourteenth' with no month, and no meeting date was supplied, so no calendar date is recorded.",
        evidenceLineIds: ["L008"],
      },
    ],
  },

  "case-003": {
    summary:
      "The storage vendor renewal was discussed and not decided. Two tasks were identified that nobody accepted, and two were taken by named people. The notice period is sixty days before the term ends.",
    decisions: [
      {
        id: "ill-003-d1",
        text: "The renewal decision is deferred until finance provides the numbers.",
        status: "unresolved",
        evidenceLineIds: ["L027", "L028", "L029"],
      },
    ],
    actions: [
      {
        id: "ill-003-a1",
        task: "Call the vendor about the renewal terms",
        owner: null,
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L006", "L008", "L011"],
      },
      {
        id: "ill-003-a2",
        task: "Get the renewal numbers from finance",
        owner: null,
        dueDate: null,
        dueDateText: "next Friday",
        status: "open",
        evidenceLineIds: ["L015", "L018", "L022"],
      },
      {
        id: "ill-003-a3",
        task: "Produce the data egress estimate",
        owner: "Rosa",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L023", "L025"],
      },
      {
        id: "ill-003-a4",
        task: "Put the notice period date in the shared calendar",
        owner: "Ines",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L030"],
      },
    ],
    openQuestions: [
      {
        id: "ill-003-q1",
        text: "Who will own the vendor call and the finance request.",
        evidenceLineIds: ["L011", "L019", "L022"],
      },
    ],
    uncertainties: [
      {
        id: "ill-003-u1",
        text: "'Next Friday' was questioned in the meeting and left unresolved, and no meeting date was supplied, so it is kept as the original phrase.",
        evidenceLineIds: ["L016", "L017"],
      },
    ],
  },

  "case-005": {
    summary:
      "A Friday launch of the pricing page was agreed and then reversed in the same meeting. The page now ships only after legal signs off the grandfathering wording. Three tasks were accepted by named people.",
    decisions: [
      {
        id: "ill-005-d1",
        text: "Ship the pricing page on Friday.",
        status: "superseded",
        evidenceLineIds: ["L004", "L005"],
      },
      {
        id: "ill-005-d2",
        text: "The pricing page ships only after legal signs off the grandfathering wording.",
        status: "current",
        evidenceLineIds: ["L014", "L016"],
      },
    ],
    actions: [
      {
        id: "ill-005-a1",
        task: "Pull the announcement email out of the Friday slot and leave it unscheduled",
        owner: "Marco",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L017"],
      },
      {
        id: "ill-005-a2",
        task: "Freeze the pricing page branch until legal sign-off",
        owner: "Dev",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L019", "L020"],
      },
      {
        id: "ill-005-a3",
        task: "Chase legal on the grandfathering wording",
        owner: "Selma",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L021", "L022"],
      },
    ],
    openQuestions: [
      {
        id: "ill-005-q1",
        text: "When legal will respond, which sets the ship date.",
        evidenceLineIds: ["L023", "L032"],
      },
    ],
    uncertainties: [
      {
        id: "ill-005-u1",
        text: "No new ship date was agreed. The meeting ends with the launch waiting on a sign-off that has no date.",
        evidenceLineIds: ["L030", "L032"],
      },
    ],
  },

  "case-007": {
    summary:
      "The reporting database choice was discussed and explicitly not decided. Two inputs were agreed that would allow a decision later, each with a named owner.",
    decisions: [
      {
        id: "ill-007-d1",
        text: "The reporting database choice remains open pending the cost model and the analyst answer.",
        status: "unresolved",
        evidenceLineIds: ["L016", "L031"],
      },
    ],
    actions: [
      {
        id: "ill-007-a1",
        task: "Build the cost model including the migration effort",
        owner: "Farid",
        dueDate: null,
        dueDateText: "before the next planning cycle",
        status: "open",
        evidenceLineIds: ["L013", "L020", "L024"],
      },
      {
        id: "ill-007-a2",
        task: "Ask the analysts whether two query endpoints are acceptable",
        owner: "Lena",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L014", "L021"],
      },
    ],
    openQuestions: [
      {
        id: "ill-007-q1",
        text: "Whether to extend the current warehouse or stand up a separate reporting store.",
        evidenceLineIds: ["L002", "L016"],
      },
    ],
    uncertainties: [
      {
        id: "ill-007-u1",
        text: "No affirmative decision was reached. The chair states this directly rather than leaving it implied.",
        evidenceLineIds: ["L016"],
      },
    ],
  },

  "case-009": {
    summary:
      "Two projects were covered. The store submission was reassigned from Arun to Leila during the meeting; the migration dry run and the reference data freeze stayed with Arun. The migration will use a snapshot restore as its rollback plan.",
    decisions: [
      {
        id: "ill-009-d1",
        text: "The store submission moves from Arun to Leila.",
        status: "current",
        evidenceLineIds: ["L008", "L012"],
      },
      {
        id: "ill-009-d2",
        text: "The migration proceeds with a snapshot restore as the rollback plan.",
        status: "current",
        evidenceLineIds: ["L026", "L027"],
      },
    ],
    actions: [
      {
        id: "ill-009-a1",
        task: "Submit the mobile release to the store",
        owner: "Leila",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L008", "L012", "L013"],
      },
      {
        id: "ill-009-a2",
        task: "Send Leila the signing credentials",
        owner: "Arun",
        dueDate: null,
        dueDateText: "this afternoon",
        status: "open",
        evidenceLineIds: ["L010", "L014"],
      },
      {
        id: "ill-009-a3",
        task: "Run the migration dry run",
        owner: "Arun",
        dueDate: null,
        dueDateText: "Wednesday",
        status: "open",
        evidenceLineIds: ["L006", "L016", "L017"],
      },
      {
        id: "ill-009-a4",
        task: "Freeze the customer reference data",
        owner: "Arun",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L018", "L020", "L021"],
      },
      {
        id: "ill-009-a5",
        task: "Document the rollback timing before the dry run",
        owner: "Arun",
        dueDate: null,
        dueDateText: "before Wednesday's dry run",
        status: "open",
        evidenceLineIds: ["L028", "L029"],
      },
    ],
    openQuestions: [],
    uncertainties: [
      {
        id: "ill-009-u1",
        text: "A second participant named Arun on the platform team is mentioned but owns nothing here, so every Arun above refers to the speaker.",
        evidenceLineIds: ["L022", "L024"],
      },
      {
        id: "ill-009-u2",
        text: "'Wednesday' and 'this afternoon' are kept as written because no meeting date was supplied.",
        evidenceLineIds: ["L014", "L016"],
      },
    ],
  },

  "case-011": {
    summary:
      "A security review of two phishing samples. No change was made to the auto-responder because it reads subject lines only. Two tasks were accepted by named people. The quoted attacker text is recorded as transcript content.",
    decisions: [
      {
        id: "ill-011-d1",
        text: "The auto-responder is not changed in response to these samples.",
        status: "current",
        evidenceLineIds: ["L019", "L021"],
      },
    ],
    actions: [
      {
        id: "ill-011-a1",
        task: "Document the phishing sample in the security wiki",
        owner: "Nell",
        dueDate: null,
        dueDateText: "by the end of the week",
        status: "open",
        evidenceLineIds: ["L011", "L012", "L017", "L031"],
      },
      {
        id: "ill-011-a2",
        task: "Say in the security channel that support forwarded the sample correctly",
        owner: "Aziz",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L027", "L028"],
      },
    ],
    openQuestions: [
      {
        id: "ill-011-q1",
        text: "Who reviews the risk if a tool that reads message bodies is ever proposed. The meeting places this with the security team rather than with anyone present.",
        evidenceLineIds: ["L024", "L025"],
      },
    ],
    uncertainties: [
      {
        id: "ill-011-u1",
        text: "Two lines quote text aimed at an automated reader. They are recorded as things a participant said, and nothing in this output was derived from following them.",
        evidenceLineIds: ["L004", "L016"],
      },
    ],
  },
};

export const ILLUSTRATIVE_OUTPUTS: Record<string, ExtractionOutput> =
  Object.fromEntries(
    Object.entries(OUTPUTS).map(([caseId, output]) => [
      caseId,
      ExtractionOutputSchema.parse(output),
    ]),
  );

export function illustrativeOutputFor(
  caseId: string,
): ExtractionOutput | undefined {
  return ILLUSTRATIVE_OUTPUTS[caseId];
}
