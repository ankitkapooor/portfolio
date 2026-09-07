/**
 * Customer lenses (BRD section 8).
 *
 * A lens changes which requirements matter and which evidence is missing. It does
 * not touch a single measured number, and there is no weighted star rating and no
 * automatic BUY or BUILD verdict: a checklist with arbitrary weights would produce
 * a decision this investigation has not earned.
 */

export const LENS_IDS = ["individual", "small-team", "enterprise"] as const;
export type LensId = (typeof LENS_IDS)[number];

/**
 * Evidence state for a requirement. "no-evidence" is a first-class value rather
 * than a low score, because most of these have never been investigated.
 */
export type RequirementEvidence = "measured" | "hypothesis" | "no-evidence";

export const REQUIREMENT_EVIDENCE_LABELS: Record<RequirementEvidence, string> = {
  measured: "Measured here",
  hypothesis: "Hypothesis only",
  "no-evidence": "Not investigated",
};

export type LensRequirement = {
  id: string;
  label: string;
  /** Why this requirement matters for this segment specifically. */
  note: string;
  evidence: RequirementEvidence;
  evidenceIds: string[];
  /** Default checked state. The reader can edit the checklist. */
  defaultSelected: boolean;
};

export type Lens = {
  id: LensId;
  name: string;
  who: string;
  requirements: LensRequirement[];
  /** What this investigation has not looked at for this segment. */
  gaps: string[];
};

export const LENSES: Record<LensId, Lens> = {
  individual: {
    id: "individual",
    name: "Individual",
    who: "One person keeping their own commitments straight.",
    requirements: [
      {
        id: "capture",
        label: "Reliable capture",
        note: "One missed recording is an inconvenience, not an incident: the person was in the meeting.",
        evidence: "no-evidence",
        evidenceIds: ["EV-009"],
        defaultSelected: true,
      },
      {
        id: "no-fabrication",
        label: "Never invents an owner or a deadline",
        note: "Lower stakes here. The reader was present and can spot a wrong attribution.",
        evidence: "measured",
        evidenceIds: ["EV-001", "EV-004"],
        defaultSelected: true,
      },
      {
        id: "recall",
        label: "Recovers most commitments",
        note: "The main value for one person: a list they did not have to write themselves.",
        evidence: "measured",
        evidenceIds: ["EV-001"],
        defaultSelected: true,
      },
      {
        id: "integrations",
        label: "Writes into the task tracker",
        note: "Often unnecessary. An individual's tracker may be a text file.",
        evidence: "no-evidence",
        evidenceIds: ["EV-010"],
        defaultSelected: false,
      },
      {
        id: "retention",
        label: "Retention and deletion controls",
        note: "Personal preference rather than policy.",
        evidence: "no-evidence",
        evidenceIds: ["EV-008"],
        defaultSelected: false,
      },
      {
        id: "cost",
        label: "Low per-seat cost",
        note: "Paid personally, so the price ceiling is low.",
        evidence: "no-evidence",
        evidenceIds: ["EV-005"],
        defaultSelected: true,
      },
    ],
    gaps: [
      "No individual user has been observed or interviewed.",
      "Nothing here measures whether a generated list is more useful than the person's own notes.",
    ],
  },
  "small-team": {
    id: "small-team",
    name: "Small team",
    who: "Five to fifty people whose commitments cross between them.",
    requirements: [
      {
        id: "capture",
        label: "Reliable capture",
        note: "A missed recording means a commitment made in front of colleagues has no record.",
        evidence: "hypothesis",
        evidenceIds: ["EV-009"],
        defaultSelected: true,
      },
      {
        id: "no-fabrication",
        label: "Never invents an owner or a deadline",
        note: "The failure that costs trust: a name attached to work nobody accepted.",
        evidence: "measured",
        evidenceIds: ["EV-001", "EV-004", "EV-011"],
        defaultSelected: true,
      },
      {
        id: "recall",
        label: "Recovers most commitments",
        note: "A quarter of commitments is not enough to stop taking notes by hand.",
        evidence: "measured",
        evidenceIds: ["EV-001"],
        defaultSelected: true,
      },
      {
        id: "reversal",
        label: "Uses the decision that survived the meeting",
        note: "Reversals happen most in the meetings a small team holds to argue something out.",
        evidence: "measured",
        evidenceIds: ["EV-004"],
        defaultSelected: true,
      },
      {
        id: "integrations",
        label: "Writes into the task tracker",
        note: "Notes that do not reach the tracker get read once.",
        evidence: "hypothesis",
        evidenceIds: ["EV-010"],
        defaultSelected: true,
      },
      {
        id: "sharing",
        label: "Shareable output with the source visible",
        note: "A colleague needs to check the line a claim came from.",
        evidence: "measured",
        evidenceIds: ["EV-001"],
        defaultSelected: true,
      },
      {
        id: "cost",
        label: "Predictable cost as the team grows",
        note: "Per-seat pricing compounds quickly at this size.",
        evidence: "no-evidence",
        evidenceIds: ["EV-005"],
        defaultSelected: true,
      },
    ],
    gaps: [
      "No team has been interviewed about how they handle commitments today.",
      "No integration has been built, so the requirement that matters most is entirely untested.",
      "Total cost of ownership has not been estimated.",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    who: "An organisation with procurement, retention policy, and an audit trail.",
    requirements: [
      {
        id: "capture",
        label: "Reliable capture with an availability commitment",
        note: "Capture failure becomes a contractual matter, not an inconvenience.",
        evidence: "no-evidence",
        evidenceIds: ["EV-009"],
        defaultSelected: true,
      },
      {
        id: "no-fabrication",
        label: "Never invents an owner or a deadline",
        note: "A fabricated commitment in a minuted meeting is a compliance problem.",
        evidence: "measured",
        evidenceIds: ["EV-001", "EV-004", "EV-011"],
        defaultSelected: true,
      },
      {
        id: "injection",
        label: "Treats transcript content as untrusted",
        note: "Anyone who can speak in a meeting can put text in front of the extractor.",
        evidence: "measured",
        evidenceIds: ["EV-004"],
        defaultSelected: true,
      },
      {
        id: "retention",
        label: "Retention, residency, and deletion guarantees",
        note: "Usually the first question procurement asks and the first one this prototype fails.",
        evidence: "no-evidence",
        evidenceIds: ["EV-008"],
        defaultSelected: true,
      },
      {
        id: "audit",
        label: "Every claim traceable to a source line",
        note: "An auditor needs to see why the record says what it says.",
        evidence: "measured",
        evidenceIds: ["EV-001"],
        defaultSelected: true,
      },
      {
        id: "integrations",
        label: "Integrates with the systems of record",
        note: "Several of them, each with its own change cadence.",
        evidence: "hypothesis",
        evidenceIds: ["EV-010"],
        defaultSelected: true,
      },
      {
        id: "cost",
        label: "Total cost of ownership, not inference cost",
        note: "Inference is a rounding error against support, integration, and reliability.",
        evidence: "no-evidence",
        evidenceIds: ["EV-005"],
        defaultSelected: true,
      },
    ],
    gaps: [
      "No procurement requirement has been gathered from anyone who runs one.",
      "Retention, residency, and access control are absent from this prototype entirely.",
      "No availability or support model exists to evaluate.",
    ],
  },
};

export function lensById(id: LensId): Lens {
  return LENSES[id];
}
