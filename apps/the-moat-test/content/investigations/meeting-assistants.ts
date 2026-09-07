import {
  InvestigationSchema,
  type Investigation,
} from "@/domain/schemas/investigation";

/**
 * The first investigation. The ten sections and their order are fixed by BRD
 * section 4. Each carries an explicit status so a draft section is visibly a draft
 * rather than quietly presented as finished work.
 */
export const MEETING_ASSISTANTS: Investigation = InvestigationSchema.parse({
  slug: "meeting-assistants",
  title: "The Moat Test",
  question: "What remains valuable when AI features are easy to reproduce?",
  capability: "Technical and commercial diligence",
  artifactType: "investigation",
  status: "in-progress",
  evidenceStatus:
    "One deterministic method measured on 24 synthetic transcripts. No model has been run. No interviews have been conducted. Gold annotations are drafts that no human has reviewed.",
  demoUrl: null,
  updatedAt: "2026-09-07",
  summary:
    "If a model can summarise a transcript, what makes an AI meeting assistant worth paying for? This investigation builds a small challenger, measures where it fails, and separates what was actually measured from what is still a proposition.",
  limitations: [
    "The 24 transcripts are synthetic. They were authored for this benchmark and no real meeting is represented.",
    "Gold annotations were drafted by a coding agent. No human has reviewed them, so every number could move after review.",
    "The AI challenger has never been executed. No model provider is configured and no measured result exists for it.",
    "No commercial meeting assistant has been tested. Nothing here describes any vendor's performance.",
    "No user interviews have been conducted and no reader study has been run.",
    "Twelve held-out cases is a small sample. Read the observed range rather than the tail estimate.",
  ],
  sections: [
    {
      key: "hypothesis",
      number: 1,
      title: "Hypothesis",
      status: "draft",
      standfirst:
        "Reproducing the visible feature is not the same as reproducing the business behind it.",
      blocks: [
        {
          kind: "paragraph",
          text: "A general model can turn a transcript into readable notes. That capability is now cheap and widely available, which makes it a poor place to look for durable value. The hypothesis of this investigation is that what remains valuable sits either side of the summary: getting a reliable transcript in the first place, and putting the result somewhere the work is actually tracked.",
          evidenceIds: ["EV-009", "EV-010"],
        },
        {
          kind: "paragraph",
          text: "There is a second, narrower hypothesis, and it is the one this build can actually test: that the difficult part of transcript-to-notes is not writing a fluent summary but refusing to say things the transcript does not support. Leaving an owner null when nobody volunteered is harder to get right, and more consequential, than any amount of prose quality.",
          evidenceIds: ["EV-011"],
        },
        {
          kind: "callout",
          tone: "limitation",
          title: "What this section is",
          text: "These are propositions the author holds, not findings. Each cites a hypothesis record in the ledger, which records that no evidence supports it yet.",
          evidenceIds: ["EV-009", "EV-010", "EV-011"],
        },
      ],
    },
    {
      key: "customer-job",
      number: 2,
      title: "The customer's job",
      status: "draft",
      standfirst:
        "Nobody wants meeting notes. They want the commitments made in the meeting to survive contact with the following week.",
      blocks: [
        {
          kind: "paragraph",
          text: "The job is not 'summarise this call'. It is 'make sure the thing I agreed to still exists on Thursday, with my name on it, and with the version of the decision that survived the argument'. A summary that is pleasant to read and silently drops a reassignment has failed that job while appearing to succeed.",
        },
        {
          kind: "list",
          items: [
            "An action with no owner is a real outcome, not a gap to fill. Six of the twenty-four transcripts contain a task that nobody accepted.",
            "A decision that was reversed later in the same meeting is the most expensive thing to get wrong, because the wrong answer reads as confident.",
            "A meeting that produced nothing should produce nothing. One transcript in the corpus is deliberately of this kind.",
          ],
          evidenceIds: ["EV-003"],
        },
        {
          kind: "paragraph",
          text: "This framing is why the benchmark reports invented owners separately from owner accuracy, and why a single fabricated commitment disqualifies a case regardless of how well it scored elsewhere.",
          evidenceIds: ["EV-011"],
        },
      ],
    },
    {
      key: "what-was-built",
      number: 3,
      title: "What was built",
      status: "complete",
      standfirst:
        "A typed extraction contract, a deterministic tag-reading baseline, a 24-case synthetic corpus, and an evaluation harness that refuses to produce a single score.",
      blocks: [
        {
          kind: "paragraph",
          text: "The extraction contract is a closed schema: a summary of at most 1,200 characters, decisions with a current, superseded, or unresolved status, actions with an owner that may be null and a date that may stay as its original text, plus open questions and uncertainties. Every decision and action must cite the transcript lines it came from. The schema rejects unknown fields, so a model confidence score is a validation failure rather than a tolerated extra.",
        },
        {
          kind: "paragraph",
          text: "The Tagged transcript baseline reads only lines that carry an explicit ACTION: or DECISION: tag. It records the line id, leaves owner and date null, and reports every tagged decision as unresolved because a tag does not say whether a decision still stands. It is a control for the benchmark, not a product and not a stand-in for any vendor.",
          evidenceIds: ["EV-001"],
        },
        { kind: "slot", slot: "baseline-example" },
        {
          kind: "callout",
          tone: "note",
          title: "The AI challenger is not part of this",
          text: "The provider seam exists and the extraction prompt is frozen, but no provider is configured. Nothing in this build has called a model, and the lab says so where you would expect a result.",
          evidenceIds: ["EV-006"],
        },
      ],
    },
    {
      key: "experiment-design",
      number: 4,
      title: "Experiment design",
      status: "complete",
      standfirst:
        "Twenty-four synthetic transcripts across six failure families, split twelve development and twelve held-out, with drafted gold annotations that no human has reviewed.",
      blocks: [
        {
          kind: "paragraph",
          text: "The six families are explicit ownership, ambiguous owner or date, a decision later reversed, conflicting statements with no resolution, multiple projects with repeated participant names, and embedded instructions that try to override the extraction task. Two cases of each family sit in each split. Transcripts run 427 to 484 words with stable line ids so that every claim can point at a line.",
          evidenceIds: ["EV-003"],
        },
        {
          kind: "list",
          items: [
            "Matching between predicted and gold items is one-to-one. A duplicate prediction cannot count as a second true positive.",
            "Precision is N/A when nothing was predicted. Recall is N/A when the case has no gold actions. Neither is rendered as zero.",
            "Invented owners and dates resolved where the transcript supports none are reported separately from accuracy.",
            "Citation coverage, citation validity, and citation support are three different measures. The third needs a reviewer and is reported as pending.",
            "There is no overall score. The measures have different denominators and no defensible weighting.",
          ],
        },
        {
          kind: "callout",
          tone: "limitation",
          title: "The gold annotations are drafts",
          text: "A coding agent authored them. That is not review, and the artifacts record humanReviewed: false throughout. Every number in the next section could move once a person checks the annotations.",
          evidenceIds: ["EV-003"],
        },
      ],
    },
    {
      key: "results",
      number: 5,
      title: "Results",
      status: "evidence-pending",
      standfirst:
        "The baseline never invents anything and recovers about a quarter of the commitments. Zero of twelve held-out cases met the acceptance criteria.",
      blocks: [
        { kind: "slot", slot: "results-table" },
        {
          kind: "paragraph",
          text: "Precision of 1.00 with recall of 0.24 is the signature of a method that only speaks when a human has already done the work of tagging the line. Owner accuracy of 0.00 across the six matched actions that have an explicit owner is not a near miss: the baseline never assigns an owner at all, by design, so it is correct about ambiguity and useless about attribution.",
          evidenceIds: ["EV-001"],
        },
        {
          kind: "paragraph",
          text: "The one accepted case in the development split is the meeting that produced nothing. The baseline passed it by producing nothing, which is the right answer for the wrong reason.",
          evidenceIds: ["EV-002"],
        },
        {
          kind: "callout",
          tone: "limitation",
          title: "This measures one method, once",
          text: "There is no second method to compare against. Any statement here about how a model-based extractor would score is a guess, and it is labelled as one.",
          evidenceIds: ["EV-006"],
        },
      ],
    },
    {
      key: "failure-cases",
      number: 6,
      title: "Failure cases",
      status: "evidence-pending",
      standfirst:
        "Where the baseline breaks, and the failures a model-based method would have to avoid instead.",
      blocks: [
        { kind: "slot", slot: "failure-table" },
        {
          kind: "paragraph",
          text: "The baseline's failures are all failures of omission: missed actions, missed decisions, and decision status it never attempts to determine. It has no failures of commission, and it produced no critical defect on any of the 24 cases.",
          evidenceIds: ["EV-004"],
        },
        {
          kind: "paragraph",
          text: "That clean record deserves suspicion rather than credit. It reads almost nothing, so it cannot be misled by the four transcripts that embed an instruction aimed at an automated reader, and it cannot present a reversed decision as final because it never claims a decision is final. Safety by inability is not the same as safety by judgment.",
          evidenceIds: ["EV-004"],
        },
      ],
    },
    {
      key: "business-implications",
      number: 7,
      title: "Business implications",
      status: "draft",
      standfirst:
        "What the measured part supports, what it does not, and which requirements change by customer segment.",
      blocks: [
        {
          kind: "paragraph",
          text: "The measured part supports one narrow statement: on this synthetic corpus, a method that reads only explicit tags is trustworthy and nearly useless, and the gap between those two properties is where the product problem lives. It supports nothing about pricing, nothing about any vendor, and nothing about what a model would do.",
          evidenceIds: ["EV-001", "EV-008"],
        },
        { kind: "slot", slot: "lens-panel" },
        {
          kind: "paragraph",
          text: "Switching customer lens changes which requirements matter and which evidence is missing. It does not change a single measured number, and the panel above is explicit about that: the benchmark is a property of the method and the corpus, not of who is reading.",
        },
      ],
    },
    {
      key: "recommendation",
      number: 8,
      title: "Recommendation",
      status: "draft",
      standfirst: "An authored position, labelled draft, with its disconfirming evidence attached.",
      blocks: [
        { kind: "slot", slot: "thesis" },
      ],
    },
    {
      key: "what-would-change-it",
      number: 9,
      title: "What would change the recommendation",
      status: "draft",
      standfirst:
        "The specific results that would move the position, listed before the work is done rather than after.",
      blocks: [
        {
          kind: "list",
          items: [
            "A model-based extractor that reaches high recall with zero fabricated owners on the held-out split would make the extraction layer look more defensible than argued here, not less.",
            "The same extractor fabricating owners on the ambiguous-owner family would confirm the trust argument and raise the value of the refusal behaviour.",
            "Three to five practitioners saying that capture is reliable and that integration took them a weekend would remove the two load-bearing hypotheses.",
            "A human review of the gold annotations that changes recall materially would mean the current numbers should not be cited at all.",
            "A permitted commercial comparator scoring similarly to the baseline would suggest the category's value is not in extraction quality.",
          ],
          evidenceIds: ["EV-006", "EV-009", "EV-010", "EV-011"],
        },
      ],
    },
    {
      key: "sources-and-limitations",
      number: 10,
      title: "Sources and limitations",
      status: "complete",
      standfirst:
        "Every claim above links to a record here. Records are typed so that a hypothesis cannot be mistaken for a measurement.",
      blocks: [
        { kind: "slot", slot: "evidence-list" },
        {
          kind: "callout",
          tone: "limitation",
          title: "What is deliberately absent",
          text: "There are no interview records, because no interviews have taken place. There are no audience preference percentages, because no preferences have been collected. There is no commercial comparator, because no permitted output from any product has been obtained. There is no claim about how long this took to build.",
          evidenceIds: ["EV-008"],
        },
      ],
    },
  ],
});
