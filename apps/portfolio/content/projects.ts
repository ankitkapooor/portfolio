import {
  assertContentValid,
  projectSchema,
  type Project,
} from "@/lib/content-validation";
import { assets } from "@/content/assets";
import { profile } from "@/content/profile";
import { z } from "zod";

/**
 * Project register.
 *
 * All three projects are at `status: "concept"`. That is a statement about the
 * software, not about the writing: the concepts and economics are specified,
 * but no demo runs and no experiment has been carried out, so no project has a
 * `recommendation` and every Position reads "Investigation in progress".
 *
 * To promote a project once its demo genuinely runs, edit two adjacent fields
 * on its record — `status` and `demoUrl` — and nothing else. The UI derives
 * launch actions from those two values alone. A successful build is not a
 * reason to promote; the demo has to actually run.
 *
 * See README.md, "Updating project status".
 */
const raw: Project[] = [
  /* ------------------------------------------------------------------ 01 */
  {
    slug: "disrupt-this-business",
    number: "01",
    title: "Disrupt This Business",
    question: "How does AI change competition?",
    capability: "Competitive strategy scenario",
    purpose:
      "A four-round scenario that makes a competitive response to AI inspectable from both sides of the market.",

    status: "concept",
    evidenceStatus: "illustrative",

    summary:
      "A competitive strategy game about defending an established business or building the challenger. Explore decisions, inspect their consequences, and switch sides. The scenario is a fictional project-management market: an incumbent selling seats against a challenger selling completed work. Four quarterly commitments resolve through a deterministic economic model, so every outcome can be traced back to the rule that produced it.",

    recommendation: null,

    brief: {
      decision:
        "An established software business watches a challenger reach the same customer outcome with a different cost structure. Defend the current position, or reposition around what the technology has made cheap?",
      position:
        "Investigation in progress. The market, the two positions, and the resolution rules are specified, but nothing has been played, so there is no answer worth publishing. The proposed test is to run the seeded four-round scenario from both sides under three disclosed environment presets, then check whether a commitment sequence that wins as the incumbent still holds when it is attacked from the challenger's side.",
      evidence:
        "None measured. What exists is a documented parameter set and a deterministic resolution model, both fictional and both editable in one file. No playthrough, playtest, or outcome has been recorded.",
      tradeoff:
        "A deterministic model makes every result reconstructible, which is the only reason an argument about it can be settled. It also removes the noise and the reflexive competitor behaviour that make real markets difficult, so a strategy that survives here has been shown to survive the stated rules and nothing more.",
      uncertainty:
        "Whether four quarters is long enough for an incumbent's distribution advantage to register at all, and whether players read the role reversal as a test of their own strategy rather than as a second, unrelated game.",
    },

    alternatives: [
      {
        option: "Write a strategy note instead of building a game",
        argument:
          "The reasoning is the point, and prose is faster to write, easier to review, and easier to cite.",
        objection:
          "A reader cannot disagree with a note in any specific place. A reader who has committed to a decision and watched it resolve has a sharper objection than a reader who has only nodded along.",
      },
      {
        option: "Model a real, named company",
        argument:
          "Recognisable revenue and margin figures would make the exercise concrete immediately.",
        objection:
          "It would invite the reader to audit a forecast instead of the reasoning, and any numbers I picked would read as claims about that company. A fictional market keeps every assumption arguable and unambiguously mine.",
      },
      {
        option: "Let a language model resolve each round",
        argument:
          "Generated narration and competitor dialogue would make the world feel much richer.",
        objection:
          "An outcome nobody can reconstruct is not evidence. Resolution stays deterministic; generated dialogue can sit on top of an already-resolved result later, but it cannot be the resolution.",
      },
    ],

    evidence: [
      {
        id: "ev-dtb-parameters",
        label: "Seeded market parameters",
        detail:
          "Two segments — 800 small teams and 200 enterprise teams — with fixed opening customer counts, annual contract prices, and per-quarter variable costs for both sides. Fictional scenario values held in one editable file.",
        status: "illustrative",
        sourceRefs: ["src-dtb-brief"],
      },
      {
        id: "ev-dtb-rules",
        label: "Resolution rules",
        detail:
          "Customer choice, revenue, delivery cost, investment, and cash resolve from documented formulas each quarter, with no hidden randomness inside a round. Replaying identical conditions produces identical results.",
        status: "illustrative",
        sourceRefs: ["src-dtb-brief"],
      },
      {
        id: "ev-dtb-schematic",
        label: "Concept preview schematic",
        detail:
          "The decision scene shown on this page. Drawn from the specification to communicate structure. It shows the shape of the exercise, not the result of one.",
        status: "illustrative",
        sourceRefs: ["src-dtb-schematic"],
      },
    ],

    tradeoffs: [
      {
        label: "Reconstructible over realistic",
        detail:
          "Every quarter resolves from stated formulas. That rules out the emergent surprise of a real market, and it is what makes the model criticisable instead of merely plausible.",
      },
      {
        label: "Two segments over a full market",
        detail:
          "Small teams and enterprise teams behave differently enough to create a real positioning problem. A third segment would add arithmetic without adding a decision.",
      },
      {
        label: "One market over a general simulator",
        detail:
          "A tool that accepted any company would have to guess at economics it was never given. One fully specified market can be defended in detail.",
      },
    ],

    uncertainties: [
      {
        label: "Whether the horizon is long enough",
        detail:
          "Four quarters keeps a session under ten minutes. It may be too short for the incumbent's installed base to matter, which would quietly bias the scenario towards the challenger.",
      },
      {
        label: "Whether the reversal reads as a test",
        detail:
          "Switching sides is meant to feel like being cross-examined by your own earlier decisions. It may instead read as a fresh game with the numbers rearranged.",
      },
      {
        label: "Whether the opponent is legible",
        detail:
          "A rules-based opponent has to be predictable enough to reason about and varied enough to be worth reasoning about. Where that line sits is not yet known.",
      },
    ],

    sections: {
      context: [
        "The standard story about AI and incumbents is that the incumbent is slow. It is usually wrong about the mechanism. An established software business with a large installed base, a working sales motion, and a known cost per customer is not slow because it lacks the technology. It is slow because most of its advantages are attached to the shape of its current product, and a repositioning writes some of them off.",
        "That is the decision this scenario isolates. A fictional incumbent, RelayWorks, sells project-management seats. A fictional challenger, TaskPilot, sells completed work bundles at a price that only makes sense if the work is largely automated. Both are chasing the same 1,000 teams, split between 800 small teams and 200 enterprise teams that weigh price, switching cost, and reliability differently.",
        "The visitor takes one side for four quarters, commits to one primary move per quarter, and watches customers, revenue, delivery cost, and cash resolve. Then the interesting part: they take the other side and attack the strategy they just recorded.",
      ],
      methodAndModel: [
        "The engine is deterministic and small enough to read. Each quarter, segment demand is allocated by comparing the two offers on price, fit, and reliability; allocations produce revenue; revenue and volume produce delivery cost; the player's committed investment draws down cash with a stated lag before it changes capability. Nothing inside a round is random.",
        "Three environment presets are disclosed up front rather than sprung on the player, so a run can be replayed under identical external conditions. That is what makes the role reversal meaningful: the second run differs because the strategy differs, not because the world rolled differently.",
        "Every parameter is a fictional design assumption, written in one file and printed on a methodology page. The point is not that these are the right numbers for the software market. The point is that they are visible, so a disagreement can be about a specific number rather than about vibes.",
      ],
      evidenceAndResults: [
        "There are no results. The scenario has not been played, no playtest has been run, and no outcome has been recorded. Publishing a chart here would mean fabricating one.",
        "What does exist is listed under Evidence on this page: the seeded parameter set, the resolution rules, and the concept schematic above. All three are illustrative — they describe a specified design, not an observed outcome.",
      ],
      interpretation: [
        "The interpretation this project is set up to test is that an incumbent's defensible position under a cheaper substitute is usually narrower than its current product, and that the expensive mistake is defending the whole surface rather than choosing the part worth keeping.",
        "That is a hypothesis with a clear failure mode: if the seeded scenario lets a broad defence win comfortably under all three presets, the hypothesis is wrong for this market as parameterised, and the honest move is to say so and publish the parameters that produced it.",
      ],
      limitations: [
        "The market, the companies, and every economic parameter are fictional. Nothing here forecasts the real project-management market or any real company.",
        "The model reports operating cash flow from a simplified structure. It is not EBITDA, not audited profit, and not comparable to a reported financial statement.",
        "A rules-based opponent does not learn. Beating it demonstrates something about the stated rules, not about a competitor that adapts.",
      ],
      nextTest: [
        "Build the P0 scope in the brief: one market, both roles, four rounds, the three disclosed presets, full economic resolution, and a decision ledger that can be exported.",
        "Then run the first honest test — play the seeded scenario from both sides under each preset, and record whether any commitment sequence survives its own reversal. Publish the ledger alongside the analysis so the result can be checked.",
        "Then take it to five playtesters, ask each to explain one trade-off in their own words afterwards, and report the sample size rather than a percentage.",
      ],
    },

    ownerContribution:
      "I set the strategic question, designed the market, the two positions, the segment behaviour, and the four-round structure, and chose every parameter in the seeded scenario. The framing, the trade-offs, and the interpretation on this page are mine.",
    implementationDisclosure:
      "The application is being implemented with AI coding assistance against a written specification I authored. The economic model is specified by me and is deterministic, which means its output can be checked line by line rather than taken on trust.",
    humanReviewStatus:
      "Reviewed by me on 7 September 2026 for accuracy of status and claims. No external review. No playtest has been run.",

    demoUrl: null,
    demoTarget: "internal",
    demoLabel: "Play the scenario",
    repositoryUrl: null,

    coverAsset: "schematic-disrupt-this-business",

    sourceRefs: [
      {
        id: "src-dtb-brief",
        label: "Disrupt This Business — business requirements, version 1.0",
        detail:
          "Owner-authored specification dated 6 September 2026, held in this repository at docs/01_Disrupt_This_Business_BRD.md. Defines the market, the seeded parameters, the resolution rules, and the release boundaries. All scenario companies and figures in it are explicitly fictional design assumptions.",
      },
      {
        id: "src-dtb-schematic",
        label: "Concept preview schematic (original)",
        detail:
          "Original SVG drawn for this site from the specification above, held at components/schematics/disrupt-this-business.tsx. Contains no measured values.",
      },
    ],

    publishedAt: "2026-09-07",
    updatedAt: "2026-09-07",
    accentVar: "--project-accent-01",
  },

  /* ------------------------------------------------------------------ 02 */
  {
    slug: "the-moat-test",
    number: "02",
    title: "The Moat Test",
    question: "What remains worth paying for?",
    capability: "Product investigation with a working challenger",
    purpose:
      "An investigation into which parts of an AI product's value survive once its core capability becomes easy to reproduce.",

    status: "concept",
    evidenceStatus: "illustrative",

    summary:
      "An investigation into what makes an AI product worth paying for. Build a small alternative, test its limits, and examine the business advantages the prototype leaves unresolved. The first case takes meeting assistants: if a model can summarise a transcript, what is the subscription actually buying? Every output is traced to the transcript lines behind it, and each claim carries its data mode.",

    recommendation: null,

    brief: {
      decision:
        "A category of paid AI products rests on a capability that a competent engineer can now reproduce in a weekend. Is the price supported by something else, or by the capability?",
      position:
        "Investigation in progress. Reproducing the capability is the easy half and proves little on its own; the claim worth testing is about the other half. The proposed test is to build a transcript-to-notes challenger, run it against a deterministic tagged-line baseline on a manually reviewed evaluation set, publish the actual outputs including the failures, and only then argue about which remaining advantages are real.",
      evidence:
        "None measured. No benchmark run has been executed, no evaluation set has been reviewed, and no potential user has been interviewed. The published artefacts so far are a written experiment design and hand-authored illustrative outputs, both labelled as such.",
      tradeoff:
        "Publishing the failure cases beside the successes is what makes the eventual conclusion worth anything, and it guarantees the prototype looks worse than the product it is being compared against. That comparison is also structurally unfair in the other direction: a weekend challenger tested on clean transcripts is not doing the job a paid tool does on real meetings.",
      uncertainty:
        "Whether the advantages that look decisive on paper — capture reliability, workflow integration, distribution, trust — are actually what buyers pay for, or whether they are simply the reasons a vendor gives. Five conversations will not settle it, but they would be five more than the current zero.",
    },

    alternatives: [
      {
        option: "Benchmark a named commercial product directly",
        argument:
          "A head-to-head number against a real tool would be the most persuasive possible result.",
        objection:
          "Calling another company's product without authorisation, or scraping a paid tool, is not something I am willing to publish. A comparator gets added only when it is legitimately obtained, and until then the baseline is a deterministic extractor I wrote.",
      },
      {
        option: "Ship the summariser as a product",
        argument:
          "If the capability is genuinely reproducible, the reproduction could be given away.",
        objection:
          "That answers a different question. The investigation is about what the price is buying, and a free clone tests distribution, not value. It would also commit me to support I cannot provide.",
      },
      {
        option: "Score each product against a single moat rating",
        argument:
          "One number per product would make the analysis instantly comparable.",
        objection:
          "A composite score hides exactly the disagreement worth having, and it would be a fabricated metric dressed as a measurement. Named advantages, argued separately, are harder to read but honest.",
      },
    ],

    evidence: [
      {
        id: "ev-moat-baseline",
        label: "Tagged transcript baseline",
        detail:
          "A deterministic extractor that pulls only explicitly marked lines — ACTION:, DECISION: — and records the line ID for each. It sets a floor: any model-based method has to beat plain string matching before its output means anything.",
        status: "illustrative",
        sourceRefs: ["src-moat-brief"],
      },
      {
        id: "ev-moat-schema",
        label: "Output contract",
        detail:
          "Every extracted decision and action carries an owner, a status, and the transcript line IDs it came from. An ambiguous owner stays null rather than being guessed; an unresolved date stays as the speaker's original words.",
        status: "illustrative",
        sourceRefs: ["src-moat-brief"],
      },
      {
        id: "ev-moat-schematic",
        label: "Concept preview schematic",
        detail:
          "The source-to-output comparison shown on this page. The excerpt text is hand-authored to show the structure of the comparison; it is not the output of a recorded run.",
        status: "illustrative",
        sourceRefs: ["src-moat-schematic"],
      },
    ],

    tradeoffs: [
      {
        label: "Traceability over fluency",
        detail:
          "Requiring a line reference for every claim makes the output blunter and occasionally awkward to read. Without it, a confident summary and a fabricated one are indistinguishable.",
      },
      {
        label: "A weak honest baseline over a strong unauthorised one",
        detail:
          "Comparing against my own tagged-line extractor produces a less impressive headline than comparing against a commercial tool, and it is a comparison I can actually publish.",
      },
      {
        label: "Synthetic transcripts over real ones",
        detail:
          "Hand-built transcripts can be shared, re-run, and argued about. They are also cleaner than real meetings, which flatters every method under test.",
      },
    ],

    uncertainties: [
      {
        label: "Whether the gap is capability or context",
        detail:
          "If the challenger closes most of the quality gap on clean input, the interesting question moves entirely to capture, integration, and trust — none of which this prototype tests.",
      },
      {
        label: "Whether the evaluation set is fair",
        detail:
          "An evaluation set I wrote, scored against a rubric I wrote, can quietly encode what I already believe. Manual review helps and does not eliminate it.",
      },
      {
        label: "Whether buyers agree with the framing",
        detail:
          "The buying criteria in this investigation are my hypotheses about what teams care about. Three to five conversations with people who run these meetings would be the first real check.",
      },
    ],

    sections: {
      context: [
        "The opening question is deliberately narrow: if a model can summarise a transcript, what makes an AI meeting assistant worth paying for? It is a good case because the core capability is unambiguously commoditised. Transcript in, notes out, at a quality that would have been remarkable three years ago and is now a default.",
        "The tempting conclusion is that the category is therefore in trouble. That conclusion skips a step. Reproducing a capability is not reproducing a business. Getting the audio in the first place, surviving a bad connection and four people talking over each other, landing the output where the team already works, and being trusted with the recording of a difficult conversation are all separate problems, and none of them are solved by the summariser.",
        "So the decision is which of those remaining advantages are load-bearing. That question cannot be answered by an opinion about AI. It needs a challenger that actually runs, an honest account of where it breaks, and a separate argument about each advantage the challenger never touched.",
      ],
      methodAndModel: [
        "The challenger takes a UTF-8 transcript with speaker labels and stable line IDs, and returns a short summary, decisions with a current/superseded/unresolved status, action items with an explicit owner and due date, open questions, and uncertainty flags. Every decision and action carries the line IDs it was derived from.",
        "It is measured against a deterministic baseline named the tagged transcript baseline, which extracts only lines explicitly marked ACTION: or DECISION:. This is a low bar on purpose: it is the score to beat before a model-based method has demonstrated anything at all.",
        "Three data modes are labelled everywhere output appears. Illustrative demo means hand-authored content and no performance claim. Recorded experiment means archived real output with run metadata attached. Live trial means the visitor deliberately ran a transcript through a configured provider — and a live result is never silently folded into the published benchmark.",
        "Everything on this page today is illustrative demo. That mode is the one that has to work without credentials, so it is the one that ships first.",
      ],
      evidenceAndResults: [
        "No results. No benchmark run has been executed, so there is no accuracy figure, no comparison table, and no failure taxonomy to report.",
        "The evidence listed on this page is the experiment design itself: the baseline, the output contract, and the concept schematic. Those are design artefacts. They establish what would count as a result; they are not one.",
        "When the first run happens, what gets published is the archived outputs with their run metadata, the manually reviewed evaluation set, and the failure cases — including the ones that make the challenger look bad.",
      ],
      interpretation: [
        "The position this investigation is built to test is that in categories where the core capability has commoditised, the durable advantage moves to reliable capture of the input and to placement in the workflow, and that pricing power follows whichever of those is hardest to replicate rather than whichever is most visible in the demo.",
        "If the challenger reproduces most of the output quality on clean transcripts, that supports the first half of the position and says nothing about the second. If it fails badly even on clean transcripts, the commoditisation premise itself is weaker than the category's critics assume, and that is the more interesting outcome to publish.",
      ],
      limitations: [
        "The first investigation uses synthetic meeting transcripts. They are cleaner than real meetings and were written by the person evaluating the results.",
        "Audio capture and PDF parsing are out of scope, which means the prototype does not test the part of the value chain most likely to be defensible.",
        "No commercial product is benchmarked, so nothing here is a claim about any named vendor's performance.",
        "Live model output varies between runs. Reproducibility here means archived outputs with run metadata, not a promise that a future run returns the same text.",
      ],
      nextTest: [
        "Ship the illustrative demo with the transcript playground, the tagged baseline, and both output panels, so the structure of the comparison is inspectable before any result exists.",
        "Then run one real benchmark: a manually reviewed evaluation set, archived outputs, run metadata, and a published failure taxonomy.",
        "Then talk to three to five people who actually run these meetings about how notes reach their workflow, and report what they said with the sample size attached rather than as a finding about the market.",
      ],
    },

    ownerContribution:
      "I chose the question and the category, designed the experiment, wrote the output contract and the tagged-line baseline that sets the floor, and framed the buying criteria as hypotheses to test rather than conclusions. The commercial argument on this page is mine, and it is explicitly unfinished.",
    implementationDisclosure:
      "The prototype and this site are being implemented with AI coding assistance against a specification I authored. The evaluation set and the rubric are mine and require manual review before any number is published; nothing generated is treated as a measurement.",
    humanReviewStatus:
      "Reviewed by me on 7 September 2026 for accuracy of status and claims. No external review. No benchmark run and no user interviews have been carried out.",

    demoUrl: null,
    demoTarget: "internal",
    demoLabel: "Try the challenger",
    repositoryUrl: null,

    coverAsset: "schematic-the-moat-test",

    sourceRefs: [
      {
        id: "src-moat-brief",
        label: "The Moat Test — business requirements, version 1.0",
        detail:
          "Owner-authored specification dated 6 September 2026, held in this repository at docs/02_The_Moat_Test_BRD.md. Defines the investigation, the output contract, the tagged transcript baseline, the three data modes, and the research tasks that remain outstanding.",
      },
      {
        id: "src-moat-schematic",
        label: "Concept preview schematic (original)",
        detail:
          "Original SVG drawn for this site from the specification above, held at components/schematics/the-moat-test.tsx. The excerpt text inside it is hand-authored illustrative content.",
      },
    ],

    publishedAt: "2026-09-07",
    updatedAt: "2026-09-07",
    accentVar: "--project-accent-02",
  },

  /* ------------------------------------------------------------------ 03 */
  {
    slug: "priced-in",
    number: "03",
    title: "Priced In",
    question: "What do the economics require?",
    capability: "Reverse-valuation workbench",
    purpose:
      "A workbench that turns a valuation into the operating performance a business would have to deliver to justify it.",

    status: "concept",
    evidenceStatus: "illustrative",

    summary:
      "A financial workbench for exploring the business performance required to justify a valuation. Connect assumptions to operating requirements and test the contribution an AI investment would need to make. It runs the valuation backwards: pick a target, see which growth and margin combinations satisfy it, translate one of those into required customers and price, and then try to break the case you just built.",

    recommendation: null,

    brief: {
      decision:
        "A company's valuation embeds a forecast that nobody has written down. Before arguing about whether it is too high, work out what it actually requires the business to do.",
      position:
        "Investigation in progress. The model structure and the interactions are specified, but no case has been built and no calculation has been independently checked, so there is nothing to conclude. The proposed test is to reconcile the five-year cash-flow model against an independent golden model within a stated tolerance, then publish one fully worked synthetic case with every input traced to its source.",
      evidence:
        "None measured. The synthetic sample company is a calculation fixture, not a company. No independent reconciliation has been run and no reviewed case has been authored.",
      tradeoff:
        "Running the valuation backwards removes the false precision of a single point forecast and shows a whole surface of futures that satisfy the same price. It also gives up the thing people want from a model, which is one number, and it makes the output harder to summarise in a meeting.",
      uncertainty:
        "Whether the operating bridge stays honest for businesses that do not decompose cleanly into customers and price, and whether a reader takes the expectations map as a set of requirements or misreads it as a forecast.",
    },

    alternatives: [
      {
        option: "Build a conventional forward DCF",
        argument:
          "It is the expected format, and every reviewer already knows how to read one.",
        objection:
          "A forward DCF invites the analyst to reverse-engineer assumptions until the output matches their prior, then present the result as a finding. Starting from the price makes the required assumptions the visible output instead of the hidden input.",
      },
      {
        option: "Report one fair-value estimate",
        argument:
          "A single number is what most readers want, and it makes the tool feel decisive.",
        objection:
          "It would misrepresent what the analysis can support. Many growth and margin combinations satisfy the same price; collapsing that surface to a point discards the actual finding.",
      },
      {
        option: "Let a model read the filings and answer questions",
        argument:
          "Conversational statement analysis would remove almost all of the intake work.",
        objection:
          "An unauditable number is worse than no number in a valuation context. Every reported input has to be traceable to a source locator or an explicit user entry, and normalisation has to be visible rather than silent.",
      },
    ],

    evidence: [
      {
        id: "ev-priced-fixture",
        label: "Synthetic sample company",
        detail:
          "A complete set of statement inputs used as a calculation fixture, labelled fictional wherever it appears. It exists so the model can be exercised end to end without implying an opinion about a real company.",
        status: "illustrative",
        sourceRefs: ["src-priced-brief"],
      },
      {
        id: "ev-priced-provenance",
        label: "Source-mapped inputs",
        detail:
          "Every input carries its original amount, unit, period, source locator, and status, shown beside the normalised value. No missing number is assumed to be zero without explicit confirmation.",
        status: "illustrative",
        sourceRefs: ["src-priced-brief"],
      },
      {
        id: "ev-priced-schematic",
        label: "Concept preview schematic",
        detail:
          "The labelled hypothetical expectations map shown on this page. The axes are unitless and the target is hypothetical; it depicts the shape of the output, not a computed result for any company.",
        status: "illustrative",
        sourceRefs: ["src-priced-schematic"],
      },
    ],

    tradeoffs: [
      {
        label: "A surface over a point estimate",
        detail:
          "Showing every growth and margin pair that satisfies a target is more faithful and much harder to quote. A single fair value would travel further and mean less.",
      },
      {
        label: "A narrow scope over broad coverage",
        detail:
          "USD-reporting, US-GAAP, non-financial operating businesses with positive normalised operating profit. Banks, insurers, and pre-revenue companies are refused at intake instead of being forced through a model that was not built for them.",
      },
      {
        label: "Visible normalisation over clean output",
        detail:
          "Showing the original figure beside every adjustment clutters the review screen. Hiding it would make the model unauditable, which defeats the purpose.",
      },
    ],

    uncertainties: [
      {
        label: "Whether the operating bridge generalises",
        detail:
          "Translating a growth requirement into customers and price works for subscription-shaped businesses. For businesses that do not decompose that way, the bridge may need to stay switched off rather than approximate.",
      },
      {
        label: "Whether readers hear 'requirement' or 'forecast'",
        detail:
          "The entire value of the framing depends on that distinction. If the map reads as a prediction, the tool is actively misleading and the interface has failed.",
      },
      {
        label: "Whether terminal value swamps the analysis",
        detail:
          "In a five-year model, most of the value typically sits past the horizon. If the terminal assumption dominates every case, the interesting decisions may be somewhere the model does not look.",
      },
    ],

    sections: {
      context: [
        "Most arguments about whether an AI investment is worth it are arguments about narrative. One side describes a transformation, the other describes a bubble, and neither writes down what the numbers would have to do. The question that settles more of these than it should is simply: what has to be true?",
        "A valuation already contains an answer to that question; it is just not written down anywhere. Run the model backwards and the implicit forecast becomes an explicit requirement — this much revenue growth sustained for this long at this margin, or some other combination on the same curve. Once the requirement is visible, the disagreement becomes concrete: not whether the company is overvalued, but whether that particular combination is achievable.",
        "The AI-specific version follows directly. If a company is spending on an AI initiative, that spend has to earn its place in the requirement. The workbench asks what contribution the initiative would have to make — in revenue, in margin, or in capital efficiency — for the case to hold, which is a much sharper question than whether the strategy sounds forward-looking.",
      ],
      methodAndModel: [
        "Inputs arrive through a long-form CSV template where each row carries a company, fiscal year, period, statement type, metric, value, unit, scale, and source locator. Three to five complete fiscal years are preferred; one baseline year is technically sufficient and the interface marks the limited history rather than hiding it.",
        "The model is a five-year FCFF projection with an explicit terminal assumption. From a chosen enterprise-value target, the expectations map plots the growth and margin combinations consistent with that target. Selecting a cell makes that scenario active, and the operating bridge decomposes it into the customer, price, or volume requirements it implies — but only when the supplied data actually permits that decomposition.",
        "One AI initiative can be overlaid on the active scenario to test the contribution it would need to make. Break My Thesis then works in the opposite direction, searching for the assumption changes that would invalidate the selected case, so the strongest objection is generated by the tool rather than left to the reader.",
        "Market data, reported financials, normalised adjustments, and future assumptions are visually distinct everywhere they appear. Editing an input marks dependent calculations stale until they are recomputed; the previous valid result stays on screen, labelled, rather than being silently mixed with new numbers.",
      ],
      evidenceAndResults: [
        "No results. The model has not been reconciled against an independent implementation, no case has been authored, and no valuation has been published.",
        "The evidence on this page is the synthetic fixture, the input-provenance rules, and the concept schematic. The fixture is a calculation fixture: its purpose is to exercise arithmetic, and it is labelled fictional wherever it appears.",
      ],
      interpretation: [
        "The interpretation this project is set up to test is that most disagreements about AI valuations are disagreements about required operating performance that neither side has stated, and that making the requirement explicit resolves more of the argument than better forecasting would.",
        "The clearest way this fails is if the required combinations turn out to be so wide that almost any narrative fits inside them. That result would be worth publishing too: it would mean the price constrains the story far less than either side of the argument assumes.",
      ],
      limitations: [
        "All financial examples are synthetic calculation fixtures. Nothing here is a valuation of, or an opinion about, any real company.",
        "This is an educational strategy-analysis tool. It does not execute trades and does not infer one objectively correct market forecast from a share price.",
        "Scope is limited to USD-reporting US-GAAP non-financial operating businesses with positive baseline revenue and positive normalised operating profit. Banks, insurers, REIT-specific valuation, pre-revenue firms, and distressed restructurings are out of scope and are refused at intake.",
        "Automated statement retrieval and PDF extraction are a later release stage. Until they exist, upload support should not be described as broad.",
      ],
      nextTest: [
        "Build the first release scope: the synthetic sample, the CSV template and import, source-mapped editable inputs, the five-year model, the expectations map, the operating bridge, one AI initiative overlay, and Break My Thesis.",
        "Then reconcile the model against an independently built golden model and publish the agreed tolerance. An unreconciled valuation model is not evidence of anything.",
        "Then author one complete worked case on the synthetic company, with every input traced to a source and every conclusion attributable to a stated assumption.",
      ],
    },

    ownerContribution:
      "I chose the reverse-valuation framing, specified the model structure and the terminal treatment, designed the expectations map, the operating bridge, and the Break My Thesis stress test, and set the scope boundaries that keep the tool from being applied where it does not belong.",
    implementationDisclosure:
      "The workbench is being implemented with AI coding assistance against a specification I authored. Calculations are required to reconcile against an independent golden model within a stated tolerance before any figure is published; assistance is not accepted as verification.",
    humanReviewStatus:
      "Reviewed by me on 7 September 2026 for accuracy of status and claims. No external review. No numerical reconciliation has been run and no case has been authored.",

    demoUrl: null,
    demoTarget: "internal",
    demoLabel: "Explore the sample",
    repositoryUrl: null,

    coverAsset: "schematic-priced-in",

    sourceRefs: [
      {
        id: "src-priced-brief",
        label: "Priced In — business requirements, version 1.0",
        detail:
          "Owner-authored specification dated 6 September 2026, held in this repository at docs/03_Priced_In_BRD.md. Defines the intake format, the canonical metrics, the model structure, the scope boundaries, and the release stages. All financial examples in it are explicitly synthetic calculation fixtures.",
      },
      {
        id: "src-priced-schematic",
        label: "Concept preview schematic (original)",
        detail:
          "Original SVG drawn for this site from the specification above, held at components/schematics/priced-in.tsx. Axes are unitless and the target is hypothetical.",
      },
    ],

    publishedAt: "2026-09-07",
    updatedAt: "2026-09-07",
    accentVar: "--project-accent-03",
  },
];

export const projects: readonly Project[] = z
  .array(projectSchema)
  .parse(raw)
  .toSorted((a, b) => a.number.localeCompare(b.number));

// Fail the build, not the page, if the content is internally inconsistent.
assertContentValid({ profile, projects, assets });

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function projectPath(project: Pick<Project, "slug">): string {
  return `/work/${project.slug}`;
}
