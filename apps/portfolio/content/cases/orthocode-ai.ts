import { parseCase } from "@/lib/case-schema";

/**
 * OrthoCode AI — strategic case (pilot of the v2 case template).
 *
 * Market facts were researched on 23 October 2026 from the sources listed at
 * the bottom. Figures are as reported by those publishers; survey figures are
 * provider self-reports, not measured claim data. Placements on the landscape
 * map are the owner's judgment and are labelled as such on the page.
 *
 * DRAFT — awaiting owner review before publication.
 */
export const orthocodeCase = parseCase({
  slug: "orthocode-ai",
  number: "06",
  title: "OrthoCode AI",
  lens: "Healthcare AI · Revenue cycle",
  question: "What would make a hospital trust an AI to code surgery?",
  bet: "Autonomous coding has already captured the easy specialties. In surgery, buyers are paying for codes that hold up in an audit, and speed matters less.",
  betDetail:
    "Radiology and emergency reads are short and templated, which is why autonomous coding took hold there first. An orthopedic operative note is long and narrative, full of modifiers, bundling edits, and add-on rules, and a single wrong line can turn into a False Claims Act problem. My bet is that in this setting the product a compliance officer signs off on is one that can show its work: every code tied to the sentence that justifies it, checked against the exact codebook in force on the date of service, and handed to a human whenever the system is unsure.",
  frameworks: ["PESTEL", "Positioning map", "VRIO", "Kill criteria"],
  status: "Live prototype · Open source",
  demoUrl: "https://orthocode.ankitkapoor.me",
  repositoryUrl: "https://github.com/ankitkapooor/autocode",
  researchedAt: "2026-10-23",

  conditions: [
    {
      id: "c-underserved",
      label: "Surgical coding is still underserved",
      detail:
        "KLAS's first dedicated report calls autonomous coding an early market and places the most significant adoption in radiology and emergency settings, with customers asking for broader specialty coverage.",
      status: "supported",
      sourceRefs: ["s-klas", "s-nym-klas"],
    },
    {
      id: "c-audit",
      label: "Audit exposure, not throughput, is the binding constraint",
      detail:
        "Automated coding rules that drift from billing standards create False Claims Act liability, and regulators find them by looking for statistical outliers. The UCHealth settlement shows both happening together.",
      status: "plausible",
      sourceRefs: ["s-doj-uchealth", "s-arnold-porter"],
    },
    {
      id: "c-cheap-evidence",
      label: "Evidence can be produced cheaply enough to keep the labor saving",
      detail:
        "If failing closed sends too many charts back to a coder, an auditable system saves nobody any time. This is the open question, and the system is built to measure it.",
      status: "untested",
      sourceRefs: [],
    },
  ],

  whyNow: {
    title: "Four forces making this urgent right now",
    framework: "PESTEL — four forces material, two set aside",
    intro:
      "Not every PESTEL box matters. Four forces are making auditable surgical coding urgent right now. The other two are listed with the reason they don't matter, so you can disagree with that judgment.",
    forces: [
      {
        letter: "P",
        name: "Political",
        impact: "low",
        headline: "The enforcement climate matters, but it acts through the law, not through politics.",
        claims: [],
        soWhat: "Federal payment politics shift revenue but not which product wins. The enforcement pressure that does matter is covered under Legal.",
      },
      {
        letter: "E",
        name: "Economic",
        impact: "high",
        headline: "Denials keep rising, and clean claims are getting harder.",
        claims: [
          {
            text: "41% of providers report denial rates of 10% or higher, up from 38% a year earlier.",
            sourceRefs: ["s-experian"],
          },
          {
            text: "68% say submitting clean claims is harder than a year ago; 54% report more claim errors.",
            sourceRefs: ["s-experian"],
          },
        ],
        soWhat: "Every denied claim is revenue that has to be won back by hand. Getting the code right before the bill goes out is where the money is.",
      },
      {
        letter: "S",
        name: "Social",
        impact: "high",
        headline: "The coder workforce can't keep up.",
        claims: [
          {
            text: "66% of health-information professionals reported persistent staffing shortages over the prior two years (NORC survey of 2,500 respondents).",
            sourceRefs: ["s-ahima"],
          },
          {
            text: "83% saw unfilled health-information positions increase or persist over the past year.",
            sourceRefs: ["s-ahima"],
          },
        ],
        soWhat: "Hospitals can't hire their way out of this. Any tool that makes one experienced coder more productive is worth paying for, as long as it doesn't add audit risk.",
      },
      {
        letter: "T",
        name: "Technological",
        impact: "high",
        headline: "Models can now read operative notes, but few providers are using them yet.",
        claims: [
          {
            text: "KLAS formally recognized autonomous coding as a distinct segment in August 2025.",
            sourceRefs: ["s-klas", "s-nym-klas"],
          },
          {
            text: "Only 14% of providers say they use AI in claims, while 67% believe it can improve the process.",
            sourceRefs: ["s-experian"],
          },
        ],
        soWhat: "Reading the notes is now cheap. The scarce part is making sure the model can only choose codes that exist and apply on the date of service.",
      },
      {
        letter: "E2",
        name: "Environmental",
        impact: "ruled-out",
        headline: "No material effect on this decision.",
        claims: [],
        soWhat: "Considered and excluded. Nothing environmental changes who buys coding software or why.",
      },
      {
        letter: "L",
        name: "Legal",
        impact: "high",
        headline: "Automated coding is now a liability question.",
        claims: [
          {
            text: "UCHealth paid $23M to resolve allegations that it automatically applied the highest-level ER code when standards weren't met. CMS had flagged it as a high outlier.",
            sourceRefs: ["s-doj-uchealth", "s-arnold-porter"],
          },
        ],
        soWhat: "An automated rule that can't explain itself becomes evidence in court. Being able to audit the system is a legal requirement before it is a feature.",
      },
    ],
  },

  landscape: {
    title: "How hospitals solve this today",
    framework: "Positioning map",
    intro:
      "Hospitals already solve coding four ways. Each one wins on something real. The gap is where autonomy and surgical depth meet.",
    xAxis: ["How much the system decides", "Assists a coder", "Codes on its own"],
    yAxis: ["Where it is proven", "Templated reads", "Surgical depth"],
    caveat:
      "Positions are my judgment from public sources, not measurements. Click a category to see why it sits where it does.",
    players: [
      {
        id: "manual",
        name: "In-house & outsourced coders",
        examples: "Certified coders, offshore coding vendors",
        x: 0.08,
        y: 0.72,
        wins: "Judgment on complex surgical cases, and an accountable person behind every code.",
        gap: "Doesn't scale with volume, and the workforce is shrinking. See the Social force.",
        sourceRefs: ["s-ahima"],
      },
      {
        id: "cac",
        name: "Computer-assisted coding",
        examples: "Suggestion engines inside incumbent RCM suites",
        x: 0.36,
        y: 0.46,
        wins: "Already embedded in hospital workflows and contracts, and it suggests codes without taking on liability.",
        gap: "The coder still does the work, so the labor savings are modest.",
        sourceRefs: [],
      },
      {
        id: "autonomous",
        name: "Autonomous coding platforms",
        examples: "CodaMetrix, Fathom, Nym; Solventum's offering in Epic Toolbox",
        x: 0.86,
        y: 0.24,
        wins: "High automation where documentation is short and repetitive. Adoption is strongest in radiology and the ER.",
        gap: "Surgical specialties are where customers still want coverage, and where an unexplained code carries the most risk.",
        sourceRefs: ["s-nym-klas", "s-solventum"],
      },
      {
        id: "llm",
        name: "General-purpose LLM tools",
        examples: "Chat assistants asked to suggest codes",
        x: 0.6,
        y: 0.1,
        wins: "Free, flexible, and good at reading narrative text.",
        gap: "Nothing stops it from producing a code that doesn't exist or doesn't apply on the date of service.",
        sourceRefs: [],
      },
      {
        id: "self",
        name: "OrthoCode AI",
        examples: "Bounded autonomy for orthopedic surgery",
        x: 0.62,
        y: 0.84,
        self: true,
        wins: "Every line is tied to page-level evidence and the active codebook. It fails closed to a human, and autonomy is off by default.",
        gap: "No customers, no measured accuracy yet, and no correction data. See the VRIO row on corrections.",
        sourceRefs: ["s-repo"],
      },
    ],
    whiteSpace: "The open space: autonomy you can audit, in specialties where documentation is long and narrative.",
  },

  vrio: {
    title: "What is actually hard to copy?",
    framework: "VRIO",
    intro:
      "Which of OrthoCode's capabilities would actually be hard to copy? This rates each one honestly, including the ones that aren't.",
    rows: [
      {
        capability: "Page-anchored evidence for every code line",
        v: "yes",
        r: "partial",
        i: "no",
        o: "yes",
        verdict: "Parity, soon",
        note: "Any well-funded vendor can build this. It's a feature, not a moat.",
      },
      {
        capability: "Versioned codebook releases + deterministic CMS rule checks",
        v: "yes",
        r: "no",
        i: "no",
        o: "yes",
        verdict: "Table stakes",
        note: "NCCI, MUE, and add-on checks are necessary to compete at all. Incumbents already have them.",
      },
      {
        capability: "Fails closed by default; autonomy is off",
        v: "yes",
        r: "yes",
        i: "partial",
        o: "yes",
        verdict: "Temporary edge",
        note: "Easy to build, but costly to adopt for vendors whose pitch is a high automation rate. This is a positioning choice more than a technology.",
      },
      {
        capability: "A growing library of orthopedic coder corrections",
        v: "yes",
        r: "yes",
        i: "yes",
        o: "no",
        verdict: "The only real moat",
        note: "It builds up over time and depends on its own history, so it can't be bought later. It doesn't exist yet.",
      },
    ],
    readout:
      "The code is not the moat. The engineering is what lets OrthoCode compete at all. The asset that's hard to copy is a body of corrected orthopedic charts, and that only builds up by running alongside real coders. That's why the system ships with a shadow mode, and why the go-to-market below starts there.",
  },

  killCriteria: [
    {
      condition: "Autonomous platforms ship page-level evidence trails as standard in surgery",
      ifTrue: "The differentiation shrinks to the correction data alone. Compete on orthopedic depth or don't compete.",
      test: "Track KLAS specialty reports and vendor release notes for evidence-trail features in surgical coding.",
      conditionRef: "c-underserved",
    },
    {
      condition: "Auditors and payers don't reward the evidence trail",
      ifTrue: "The buyer becomes compliance, which has a smaller budget than revenue cycle, and the pitch has to change.",
      test: "Compare denial and audit outcomes on shadow-coded vs. human-coded claims during a pilot.",
      conditionRef: "c-audit",
    },
    {
      condition: "Failing closed routes most surgical charts back to a coder",
      ifTrue: "Coders save no time, and the economic case fails even if the system is accurate.",
      test: "Measure the share of charts sent to review on a de-identified orthopedic gold set before any pilot.",
      conditionRef: "c-cheap-evidence",
    },
  ],

  system: {
    title: "How the code carries out the strategy",
    intro:
      "The architecture puts the strategy into code. Each stage is labeled with who makes the decision, and with the condition from the bet it protects.",
    steps: [
      {
        label: "De-identified chart → page text and evidence spans",
        decidedBy: "rules",
        detail: "Each page is extracted once and kept as immutable evidence spans. Every later decision has to point back to one.",
        serves: ["c-audit"],
      },
      {
        label: "Clinical fact extraction",
        decidedBy: "model",
        detail: "The model reads the note and outputs atomic facts through strict structured outputs (store=false). It reads; it does not choose codes.",
        serves: ["c-cheap-evidence"],
      },
      {
        label: "Candidate retrieval from the active codebook",
        decidedBy: "rules",
        detail: "Candidates come only from the codebook release in force on the date of service. No code is generated freely.",
        serves: ["c-audit"],
      },
      {
        label: "Bounded coding decisions",
        decidedBy: "model",
        detail: "TypeSafe JEV chooses among those candidates, with probabilities. Unknown candidates and lines without evidence are rejected.",
        serves: ["c-underserved"],
      },
      {
        label: "CMS rule enforcement",
        decidedBy: "rules",
        detail: "Active-code, NCCI, MUE, add-on, and unit checks are authoritative. The model cannot override them.",
        serves: ["c-audit"],
      },
      {
        label: "Calibration and routing",
        decidedBy: "human",
        detail: "Each chart is rated green, yellow, or red from its weakest line. Anything uncertain goes to a coder, and autonomy stays off unless explicitly enabled.",
        serves: ["c-audit", "c-cheap-evidence"],
      },
    ],
  },

  evidence: {
    built: [
      {
        text: "The supplied codebook bundle passes structural validation with 11,525 licensed 2026 CPT codes and 4.49M directional NCCI PTP revisions.",
        sourceRefs: ["s-repo"],
      },
      {
        text: "Three decision-engine modes, including a shadow mode that records agreement against the legacy path.",
        sourceRefs: ["s-repo"],
      },
      {
        text: "Parser, workflow, validation, and raw-data-boundary tests; the runtime never opens the raw bundle.",
        sourceRefs: ["s-repo"],
      },
    ],
    notClaimed: [
      "No coding-accuracy figure. Gold-set evaluation exists as tooling, not as a published result.",
      "No PHI. The development profile rejects it, and production would need a compliance review and vendor agreements.",
      "No customer, payer, or denial-outcome data.",
    ],
  },

  nextMoves: {
    title: "Collect corrections first, earn autonomy last",
    intro:
      "The go-to-market follows the VRIO analysis: collect corrections first, earn autonomy last.",
    stages: [
      {
        label: "Shadow",
        detail: "Run next to coders on de-identified orthopedic charts and publish agreement on a gold set.",
        gate: "Review-routing rate is low enough that coders actually save time",
      },
      {
        label: "Second look",
        detail: "Flag risky lines on charts humans have already coded, before the bill goes out. Sell to compliance, and collect corrections.",
        gate: "Flags change at least some outcomes before billing",
      },
      {
        label: "Assisted",
        detail: "Pre-fill green charts so a coder can approve them in one click.",
        gate: "Coders accept pre-filled lines without many edits",
      },
      {
        label: "Gated autonomy",
        detail: "Only green lines, only above an agreement threshold the customer sets.",
        gate: "Audit outcomes match or beat human-coded claims",
      },
    ],
  },

  sources: [
    {
      id: "s-klas",
      publisher: "KLAS Research",
      title: "Autonomous Coding 2025: A Promising Start for an Early Market",
      date: "August 2025",
      url: "https://klasresearch.com/report/autonomous-coding-2025-a-promising-start-for-an-early-market/3166",
    },
    {
      id: "s-nym-klas",
      publisher: "Nym (vendor press release summarizing the KLAS report)",
      title: "Nym rated a top performer by KLAS in first report dedicated to autonomous medical coding",
      date: "20 August 2025",
      url: "https://nym.health/press-release/nym-rated-a-top-performer-by-klas-in-first-report-dedicated-to-autonomous-medical-coding/",
    },
    {
      id: "s-experian",
      publisher: "Experian Health",
      title: "3rd annual State of Claims survey (250 provider respondents)",
      date: "22 September 2025",
      url: "https://experianplc.com/newsroom/press-releases/2025/experian-health-s-3rd-annual-state-of-claims-survey-finds-denial",
    },
    {
      id: "s-ahima",
      publisher: "AHIMA / NORC at the University of Chicago",
      title: "Health information workforce shortages persist as AI shows promise",
      date: "1 November 2023",
      url: "https://www.ahima.org/news-publications/press-room-press-releases/2023-press-releases/health-information-workforce-shortages-persist-as-ai-shows-promise-ahima-survey-reveals/",
    },
    {
      id: "s-doj-uchealth",
      publisher: "U.S. Department of Justice",
      title: "UCHealth agrees to pay $23M to resolve allegations of fraudulent billing for emergency department visits",
      date: "12 November 2024",
      url: "https://www.justice.gov/archives/opa/pr/uchealth-agrees-pay-23m-resolve-allegations-fraudulent-billing-emergency-department-visits",
    },
    {
      id: "s-arnold-porter",
      publisher: "Arnold & Porter (commentary)",
      title: "Beware of automated or AI-generated billing coding to government healthcare programs",
      date: "November 2024",
      url: "https://www.arnoldporter.com/en/perspectives/blogs/fca-qui-notes/posts/2024/11/beware-of-automated-or-ai-generated-billing-coding-to-government-healthcare-programs",
    },
    {
      id: "s-solventum",
      publisher: "Solventum",
      title: "Solventum autonomous coding listed in Epic Toolbox",
      date: "August 2024",
      url: "https://news.solventum.com/press-releases/detail/125/solventum-autonomous-coding-listed-in-epic-toolbox",
    },
    {
      id: "s-repo",
      publisher: "OrthoCode AI repository",
      title: "README and architecture documentation",
      date: "October 2026",
      url: "https://github.com/ankitkapooor/autocode",
    },
  ],
});
