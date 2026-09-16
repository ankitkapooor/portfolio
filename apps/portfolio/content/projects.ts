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
 * All five projects are at `status: "prototype"`: the software genuinely runs.
 * Each now carries a `demoUrl` on its own subdomain, because each one is
 * deployed and a visitor can actually reach it. Those remain two separate
 * facts, and the UI treats them that way: `status` describes how mature the
 * software is, `demoUrl` describes whether the public can get to it.
 *
 * Being reachable is not a finding either. Every Position still reads
 * "Investigation in progress" and every `recommendation` is still null, because
 * no project has reached a conclusion. What each project has actually produced
 * is carried by `evidenceStatus` alone: Disrupt This Business and Priced In
 * remain `illustrative`, and The Moat Test is `measured-partial` on the
 * strength of two archived baseline runs whose gold annotations no person has
 * reviewed. Deploying changed none of that.
 *
 * A successful build is not a reason to move `status`, and a deployed demo is
 * not a reason to move `evidenceStatus`. The two featured systems are grouped
 * separately from the three focused Strategy Lab experiments, but the same
 * evidence and authorship rules apply to every record.
 *
 * See README.md, "Updating project status".
 */
const raw: Project[] = [
  /* ------------------------------------------------------------------ 01 */
  {
    slug: "market-entry-war-room",
    number: "01",
    title: "Market Entry War Room",
    question: "Where should we play?",
    decisionDomain: "Growth strategy",
    portfolioGroup: "featured",
    capability: "Market selection decision system",
    purpose:
      "A decision system that turns a business strategy into measurable assumptions, ranks US metropolitan markets using public data, and tests whether the recommendation survives different strategic priorities.",
    whyItMatters:
      "Market-entry recommendations are often presented as point answers even though the result depends on assumptions about customer fit, growth, affordability, scale, and cost. The system makes those assumptions visible and lets the user see which ones are actually driving the decision.",
    workflow: [
      "Describe the business and target customer.",
      "Translate the strategy into editable measurable assumptions.",
      "Score metropolitan markets using public data and explicit factor weights.",
      "Adjust priorities and compare candidate markets in the War Room.",
      "Perturb the assumptions through sensitivity analysis.",
      "Evaluate the ranking together with its robustness.",
    ],
    decisionOutput:
      "A ranked set of metropolitan markets with factor-level explanations, direct comparisons, and evidence showing how robust each ranking is to plausible changes in strategic priorities.",

    status: "prototype",
    evidenceStatus: "measured-partial",

    summary:
      "Describe the business, inspect how its strategy becomes measurable assumptions, and rank US metropolitan markets using Census data and an explicit weighted model. The War Room lets priorities change in real time, compares candidates directly, and uses Monte Carlo sensitivity analysis to show whether an apparent winner remains strong when the assumptions move. Every result belongs to the scenario that produced it.",

    recommendation: null,

    brief: {
      decision:
        "A business wants to expand into a new US metropolitan market. Where should it open next, given its customer, price positioning, growth priorities, and cost tolerance?",
      position:
        "No universal market recommendation. The system is designed to produce a scenario-specific ranking whose assumptions, factor contributions, missing data, and sensitivity can be inspected before anyone acts on it.",
      evidence:
        "Measured in part. The running system scores 393 metropolitan areas using configured 2024 and 2019 Census ACS vintages, explicit metric directions, percentile normalization, weighted factor scores, and Monte Carlo perturbation. The ranking is reproducible from the data and settings, but its commercial coverage is deliberately incomplete.",
      tradeoff:
        "Transparency and consistency are prioritized over pretending to have perfect market data. Missing factors are dropped and their weights redistributed with a warning instead of being silently scored as zero.",
      uncertainty:
        "Competition coverage is absent, residential rent stands in for commercial occupancy cost, and the growth measure is a five-year change rather than a predictive market forecast.",
    },

    alternatives: [
      {
        option: "Ask a language model which city to enter",
        argument:
          "It would be fast, flexible, and able to absorb a nuanced description of the business.",
        objection:
          "It is rejected as the decision engine because the recommendation would not be reconstructible from explicit evidence and arithmetic.",
      },
      {
        option: "Use one fixed consulting-style scorecard",
        argument:
          "A single scorecard is easy to communicate and keeps every market on one consistent scale.",
        objection:
          "It is rejected as the only interface because it hides how subjective weighting changes the answer and can make a fragile winner look definitive.",
      },
      {
        option: "Add every possible commercial dataset",
        argument:
          "More sources could improve category-specific competition and operating-cost coverage.",
        objection:
          "It is rejected for the MVP because inconsistent proprietary coverage can create false precision and make the model harder to audit or reproduce.",
      },
    ],

    evidence: [
      {
        id: "ev-market-census",
        label: "Census market dataset",
        detail:
          "The running system exposes 393 metro-level observations from the US Census ACS, with 2024 as the current configured vintage and 2019 as the comparison vintage. Each metric retains its source and vintage, and missing prior observations remain missing rather than becoming zero.",
        status: "measured-partial",
        sourceRefs: ["src-market-entry-census", "src-market-entry-demo"],
      },
      {
        id: "ev-market-model",
        label: "Explicit scoring model",
        detail:
          "Metric direction, percentile normalization, within-factor aggregation, and user-visible factor weights produce the ranking deterministically. Unavailable factors are excluded and their weight is redistributed across the factors that remain.",
        status: "measured-partial",
        sourceRefs: ["src-market-entry-readme", "src-market-entry-demo"],
      },
      {
        id: "ev-market-sensitivity",
        label: "Sensitivity analysis",
        detail:
          "Monte Carlo runs perturb the effective factor weights within a disclosed band, renormalize them, and report rank stability so the apparent leader is evaluated across plausible changes in priorities rather than at one point estimate.",
        status: "measured-partial",
        sourceRefs: ["src-market-entry-readme"],
      },
    ],

    tradeoffs: [
      {
        label: "Transparent coverage over false completeness",
        detail:
          "The MVP drops competition when no comparable public measure exists. That narrows the answer, but it keeps the missing evidence visible instead of filling the gap with an opaque estimate.",
      },
      {
        label: "Relative ranks over absolute truth",
        detail:
          "A percentile says where one metro stands against the others in this run. It does not say that a high-scoring market is intrinsically good or that the business will succeed there.",
      },
      {
        label: "Editable priorities over one official answer",
        detail:
          "Allowing weights to move makes the judgment inspectable, but it also means the model cannot offer a context-free winner. The output is useful only with the scenario attached.",
      },
    ],

    uncertainties: [
      {
        label: "Category-specific competition",
        detail:
          "No broad public source covers competing establishments consistently across every business category, so competition is currently absent from the ranking and its weight is redistributed.",
      },
      {
        label: "Operating-cost proxy",
        detail:
          "Median residential gross rent is available consistently, but it is only a proxy for commercial occupancy cost and may point in a different direction for a particular format.",
      },
      {
        label: "Growth is historical",
        detail:
          "The growth factor is the change between the 2019 and 2024 ACS vintages. It is not annualized and it is not a forecast of the next five years.",
      },
    ],

    sections: {
      context: [
        "Market-entry advice often arrives as a city name backed by a polished scorecard. The recommendation looks objective even when its result depends on unspoken judgments about who the customer is, how much they can pay, whether scale or growth matters more, and which costs the business can tolerate.",
        "The War Room starts one level earlier. A user describes the business and target customer, then inspects the structured assumptions the parser produced before the model runs. That separation matters: AI helps interpret the description, while public data and deterministic scoring decide how each metro ranks.",
        "The decision is not whether one metropolitan area is universally best. It is whether a candidate is attractive for this business under these priorities, why it reached that position, and whether the position survives a reasonable change in the assumptions.",
      ],
      methodAndModel: [
        "The running system uses the US Census American Community Survey at the metropolitan level. Its current configuration compares the 2024 ACS 1-year vintage with 2019, producing observations for market size, affluence, growth, customer fit, and a residential-rent proxy for cost.",
        "Raw metrics are converted to percentiles across the metros in the run. Metrics whose lower values are preferable are inverted, metrics roll into factor scores, and the final attractiveness score is a weighted sum. The requested weights must sum to one; when a factor is unavailable, its weight is redistributed proportionally and the interface states that explicitly.",
        "Sensitivity analysis perturbs the effective weights within a configured band, renormalizes them, and recomputes the ranking across repeated runs. This turns the finding from a single rank into a distribution: which markets stay near the top when the user's priorities move?",
      ],
      evidenceAndResults: [
        "The system is deployed and the full path from business description to assumptions, ranking, comparison, and sensitivity can be inspected. A built-in premium-fitness example currently scores all 393 loaded metros and exposes every factor contribution and raw observation behind the ordering.",
        "That example is evidence that the workflow and arithmetic run, not a universal market conclusion. Changing the business, customer, or weights can change the ordering, which is the behavior the product is built to reveal rather than suppress.",
        "The strongest current evidence is the sourced metro dataset, the deterministic score calculation, and the sensitivity mechanism. Evidence about category-level competition, actual commercial occupancy costs, or realized market-entry outcomes remains outside the MVP.",
      ],
      interpretation: [
        "The most useful output is not 'Market X ranks first.' It is 'Market X ranks first under these assumptions, for these reasons, and remains near the top across this range of plausible assumption changes.'",
        "That framing changes the conversation from defending one answer to examining what drives it. A weight that flips the ranking is not a nuisance; it identifies the strategic judgment the team actually needs to debate.",
      ],
      limitations: [
        "Competition is unmeasured in the current MVP because no public source covers every business category consistently. The factor is dropped and its weight redistributed rather than scored as zero.",
        "Median residential gross rent is used as a proxy for operating cost. It is not commercial lease data and should not be presented as such.",
        "Growth is a multi-year historical delta between configured Census vintages, not a predictive market forecast. A high rank establishes fit under the model, not the probability of a successful launch.",
      ],
      nextTest: [
        "Add a bounded, category-specific competition source for one business type and test whether its inclusion materially changes the top tier without making coverage inconsistent across markets.",
        "Run structured decision reviews with strategy practitioners: ask them to state a recommendation before and after sensitivity analysis, then record which assumption changes their conclusion and why.",
      ],
    },

    ownerContribution:
      "I framed the market-selection decision, specified how a business description becomes editable assumptions, designed the scoring and sensitivity workflow, and set the evidence and limitation rules that keep a scenario-specific result from being presented as a universal answer.",
    implementationDisclosure:
      "The application was implemented with AI coding assistance against an owner-authored specification. AI interprets the business description; Census observations, normalization, factor aggregation, ranking, and sensitivity are produced by deterministic code that can be inspected and tested.",
    humanReviewStatus:
      "No external review is claimed. This case is grounded in the public repository documentation and the running production workflow, and it preserves the limitations those sources disclose.",

    demoUrl: "https://warroom.ankitkapoor.me/ui/",
    demoTarget: "external",
    demoLabel: "Open the War Room",
    repositoryUrl: "https://github.com/ankitkapooor/market-entry-war-room",

    coverAsset: "schematic-market-entry-war-room",

    sourceRefs: [
      {
        id: "src-market-entry-readme",
        label: "Market Entry War Room — public repository documentation",
        detail:
          "Public repository documentation describing the strategy parser, scoring model, Census integration, factor weighting, missing-data handling, comparison workflow, and Monte Carlo sensitivity analysis.",
      },
      {
        id: "src-market-entry-census",
        label: "US Census American Community Survey",
        detail:
          "Metro-level ACS observations used by the running system. The inspected application and repository are configured for the 2024 ACS 1-year vintage with 2019 as the prior comparison vintage.",
      },
      {
        id: "src-market-entry-demo",
        label: "Market Entry War Room — production deployment",
        detail:
          "Running production deployment inspected on 14 September 2026 to verify the end-to-end workflow and the representative premium-fitness scenario used by the product schematic.",
      },
    ],

    publishedAt: "2026-09-14",
    updatedAt: "2026-09-14",
    accentVar: "--project-accent-01",
  },

  /* ------------------------------------------------------------------ 02 */
  {
    slug: "disrupt-this-business",
    number: "02",
    title: "Disrupt This Business",
    question: "How should we win?",
    decisionDomain: "Competitive strategy",
    portfolioGroup: "lab",
    capability: "Competitive strategy scenario",
    purpose:
      "A four-round scenario that makes a competitive response to AI inspectable from both sides of the market.",
    whyItMatters:
      "When AI changes the cost structure behind the same customer outcome, an incumbent has to decide which parts of its existing position are worth defending and which advantages have become liabilities.",
    workflow: [
      "Choose the incumbent or challenger position.",
      "Commit to one strategic move each quarter.",
      "Resolve customer allocation and economics through deterministic rules.",
      "Inspect the arithmetic behind the outcome.",
      "Switch sides and attack the strategy previously chosen.",
      "Compare whether the original position survives the reversal.",
    ],
    decisionOutput:
      "A reconstructible resolution ledger showing how strategic commitments change customers, revenue, delivery cost, investment, and cash under the stated market rules.",

    status: "prototype",
    evidenceStatus: "illustrative",

    summary:
      "A competitive strategy game about defending an established business or building the challenger. Explore decisions, inspect their consequences, and switch sides. The scenario is a fictional project-management market: an incumbent selling seats against a challenger selling completed work. Four quarterly commitments resolve through a deterministic economic model, so every outcome can be traced back to the rule that produced it.",

    recommendation: null,

    brief: {
      decision:
        "An established software business watches a challenger reach the same customer outcome with a different cost structure. Defend the current position, or reposition around what the technology has made cheap?",
      position:
        "Investigation in progress. The scenario now plays: a commitment locked in one quarter activates on the delay its rule specifies, and the resolution ledger shows each line's arithmetic against the formula that produced it. Anyone can reach it and play it, but no playtest has been run and no outcome has been recorded, so there is still no answer worth publishing. The proposed test is to run the seeded four-round scenario from both sides under three disclosed environment presets, then check whether a commitment sequence that wins as the incumbent still holds when it is attacked from the challenger's side.",
      evidence:
        "None measured. What exists is a running deterministic engine over a documented parameter set, both fictional and both editable in one file, with unit and end-to-end test suites passing. No playtest has been run, no player has been observed, and no outcome has been recorded.",
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
          "Customer choice, revenue, delivery cost, investment, and cash resolve from documented formulas each quarter, with no hidden randomness inside a round. Replaying identical conditions produces identical results. The rules are implemented and the engine resolves them; the ledger cites the formula behind every line it prints.",
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
        "The scenario runs. It resolves four quarters of commitments into a ledger that shows the arithmetic behind each line and links it to the formula that produced it, and it states its segment totals explicitly rather than leaving them to be inferred. It is deployed and open to anyone, so everything claimed on this page can be checked against the running scenario instead of taken on trust.",
        "There are still no results, and a demo that runs is not one. No playtest has been run, no player has been observed, and no outcome study has been recorded. Publishing a chart here would mean fabricating one.",
        "What does exist is listed under Evidence on this page: the seeded parameter set, the resolution rules that the engine now implements, and the concept schematic above. All three are illustrative — they describe a specified and working design, not an observed outcome.",
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
        "Run the first honest test — play the seeded scenario from both sides under each preset, and record whether any commitment sequence survives its own reversal. Publish the ledger alongside the analysis so the result can be checked.",
        "Then take it to five playtesters, ask each to explain one trade-off in their own words afterwards, and report the sample size rather than a percentage.",
      ],
    },

    ownerContribution:
      "I set the strategic question, designed the market, the two positions, the segment behaviour, and the four-round structure, and chose every parameter in the seeded scenario. The framing, the trade-offs, and the interpretation on this page are mine.",
    implementationDisclosure:
      "The application has been implemented with AI coding assistance against a written specification I authored. The economic model is specified by me and is deterministic, which means its output can be checked line by line rather than taken on trust — and the running ledger is what makes that check possible.",
    humanReviewStatus:
      "Reviewed by me on 7 September 2026 for accuracy of status and claims. No external review. No playtest has been run.",

    demoUrl: "https://disrupt.ankitkapoor.me",
    demoTarget: "external",
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
    updatedAt: "2026-09-14",
    accentVar: "--project-accent-02",
  },

  /* ------------------------------------------------------------------ 03 */
  {
    slug: "the-moat-test",
    number: "03",
    title: "The Moat Test",
    question: "What remains defensible?",
    decisionDomain: "Product strategy",
    portfolioGroup: "lab",
    capability: "Product investigation with a working challenger",
    purpose:
      "An investigation into which parts of an AI product's value survive once its core capability becomes easy to reproduce.",
    whyItMatters:
      "When the visible AI capability becomes easy to reproduce, the strategic question shifts from whether the feature can be built to which surrounding advantages still justify customer willingness to pay.",
    workflow: [
      "Reproduce a narrow version of the visible capability.",
      "Run an explicit baseline and challenger.",
      "Compare outputs without relying only on presentation quality.",
      "Trace claims back to supporting evidence.",
      "Inspect failure cases rather than hiding them.",
      "Separate reproducible capability from workflow, trust, distribution, and capture advantages.",
    ],
    decisionOutput:
      "An evidence-backed view of which parts of an AI product's value appear reproducible and which candidate moats remain unresolved and require further testing.",

    status: "prototype",
    evidenceStatus: "measured-partial",

    summary:
      "An investigation into what makes an AI product worth paying for. Build a small alternative, test its limits, and examine the business advantages the prototype leaves unresolved. The first case takes meeting assistants: if a model can summarise a transcript, what is the subscription actually buying? Every output is traced to the transcript lines behind it, and each claim carries its data mode.",

    recommendation: null,

    brief: {
      decision:
        "A category of paid AI products rests on a capability that a competent engineer can now reproduce in a weekend. Is the price supported by something else, or by the capability?",
      position:
        "Investigation in progress. Reproducing the capability is the easy half and proves little on its own; the claim worth testing is about the other half. The lab now runs, the deterministic baseline has been executed over the synthetic transcripts and archived twice, and the blind comparison genuinely withholds both method identities until a choice is made. But the gold annotations behind those runs are unreviewed drafts and no model-based challenger has yet been measured against them, so there is still nothing to conclude. The proposed test is unchanged: run the challenger against the baseline on a human-reviewed evaluation set, publish the actual outputs including the failures, and only then argue about which remaining advantages are real.",
      evidence:
        "Measured in part. On the held-out split — 12 synthetic transcripts, gold annotations that no person has reviewed — the tagged-line baseline returned 8 actions, all 8 of which matched the gold set, against the 33 actions that gold set records. Every one of its 22 extracted items carried a transcript line reference and all 22 references resolved, but whether each cited passage actually supports its claim is unmeasured for all 22, because that needs a reader. No challenger has been measured against the baseline and no potential user has been interviewed.",
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
        id: "ev-moat-baseline-runs",
        label: "Archived baseline runs",
        detail:
          "Two recorded runs of that baseline over the synthetic corpus, archived with their run metadata. On the held-out split of 12 transcripts it returned 8 actions, all 8 matching the gold annotations, against the 33 actions those annotations record, and it assigned the correct status to 1 of 14 matched decisions. All 22 of its extracted items carried a line reference and all 22 references resolved. Citation support is not measured for any of the 22, and the gold annotations are drafts no person has reviewed — which is why this is partial and not reviewed.",
        status: "measured-partial",
        sourceRefs: ["src-moat-run-held-out"],
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
        "The concept preview on this page is illustrative demo. The figures under Evidence and results are recorded experiment: they come from archived runs with their metadata attached, and the run record they are copied from is cited below.",
      ],
      evidenceAndResults: [
        "The lab runs. It executes the deterministic baseline over the synthetic transcripts and archives each run with its metadata, and the blind comparison keeps both method identities hidden until a choice has been made. It is deployed and open to anyone, so a reader can run the blind comparison themselves rather than take my description of it.",
        "Two runs have been recorded and archived, and that is the whole reason this case is labelled Measured, partial rather than Illustrative. On the held-out split — 12 synthetic transcripts — the tagged-line baseline returned 8 actions and all 8 of them matched the gold annotations, against the 33 actions those annotations record. It assigned the correct status to 1 of 14 matched decisions. Every one of its 22 extracted items carried a transcript line reference, and all 22 references resolved. Those figures are copied from the archived run record cited below, and they describe the deliberately unimpressive baseline, not a challenger.",
        "The word partial is doing real work here. The corpus is synthetic and was authored for this benchmark. The gold annotations are drafts written by a coding agent and no person has reviewed them, so a recall figure measured against them is a measurement against an unreviewed draft. Whether each cited passage actually supports the claim attached to it is not measured at all, for any of the 22 items, because that requires someone to sit and read. And the thing this investigation is actually about — whether a model-based challenger clears this floor, and which commercial advantages survive if it does — has not been measured.",
        "The evidence listed on this page therefore splits in two. The baseline, the output contract, and the concept schematic are design artefacts: they establish what would count as a result. The archived runs are a result, of a narrow and clearly bounded kind.",
      ],
      interpretation: [
        "The position this investigation is built to test is that in categories where the core capability has commoditised, the durable advantage moves to reliable capture of the input and to placement in the workflow, and that pricing power follows whichever of those is hardest to replicate rather than whichever is most visible in the demo.",
        "If the challenger reproduces most of the output quality on clean transcripts, that supports the first half of the position and says nothing about the second. If it fails badly even on clean transcripts, the commoditisation premise itself is weaker than the category's critics assume, and that is the more interesting outcome to publish.",
      ],
      limitations: [
        "The first investigation uses synthetic meeting transcripts. They are cleaner than real meetings, they were authored for this benchmark and depict no real meeting, and the gold annotations scored against them are drafts that no person has reviewed.",
        "Audio capture and PDF parsing are out of scope, which means the prototype does not test the part of the value chain most likely to be defensible.",
        "No commercial product is benchmarked, so nothing here is a claim about any named vendor's performance.",
        "Live model output varies between runs. Reproducibility here means archived outputs with run metadata, not a promise that a future run returns the same text.",
      ],
      nextTest: [
        "Have a person review the gold annotations and read every cited passage, so the recorded metrics stop being measurements against an unreviewed draft and citation support stops being unmeasured. Until that happens this benchmark can only honestly be reported as partial.",
        "Then talk to three to five people who actually run these meetings about how notes reach their workflow, and report what they said with the sample size attached rather than as a finding about the market.",
      ],
    },

    ownerContribution:
      "I chose the question and the category, designed the experiment, wrote the output contract and the tagged-line baseline that sets the floor, and framed the buying criteria as hypotheses to test rather than conclusions. The commercial argument on this page is mine, and it is explicitly unfinished.",
    implementationDisclosure:
      "The prototype and this site have been implemented with AI coding assistance against a specification I authored. The evaluation set and the rubric are mine, but the gold annotations the archived runs are scored against were drafted by that assistance and have not been reviewed by a person. That is precisely why the figures on this page are reported as measured against an unreviewed draft rather than as settled numbers, and why the evidence label stops at partial.",
    humanReviewStatus:
      "Reviewed by me on 7 September 2026 for accuracy of status and claims. No external review. The baseline runs cited here are archived machine output; no person has reviewed their gold annotations or their citation support, and no user interviews have been carried out.",

    demoUrl: "https://moat.ankitkapoor.me",
    demoTarget: "external",
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
        id: "src-moat-run-held-out",
        label: "Tagged transcript baseline — held-out run, 2026-09-07.1",
        detail:
          "Archived run record held in this repository at apps/the-moat-test/experiments/runs/tagged-transcript-baseline--held-out--2026-09-07.1/report.json, data mode \"recorded-experiment\", over 12 attempted cases. Every figure quoted on this page is copied from that file. The file itself records that the corpus is synthetic and depicts no real meeting, that the gold annotations are drafts written by a coding agent and no human has reviewed them, and that citation support is not measured because it requires a reviewer to read each cited passage.",
      },
      {
        id: "src-moat-schematic",
        label: "Concept preview schematic (original)",
        detail:
          "Original SVG drawn for this site from the specification above, held at components/schematics/the-moat-test.tsx. The excerpt text inside it is hand-authored illustrative content.",
      },
    ],

    publishedAt: "2026-09-07",
    updatedAt: "2026-09-14",
    accentVar: "--project-accent-03",
  },

  /* ------------------------------------------------------------------ 04 */
  {
    slug: "narrative-vs-numbers",
    number: "04",
    title: "Narrative vs. Numbers",
    question: "Are we executing the strategy?",
    decisionDomain: "Corporate strategy / execution",
    portfolioGroup: "featured",
    capability: "Strategy-to-execution evidence system",
    purpose:
      "A system that compares what management says is strategically important with the capital allocation and operating results visible in the company's filings.",
    whyItMatters:
      "Corporate strategy is easy to describe and harder to verify. A company's filings make it possible to ask whether management's stated priorities are visible in actual capital allocation and operating performance rather than accepting the narrative on its own.",
    workflow: [
      "Resolve a public-company ticker and retrieve the latest 10-K.",
      "Extract management's stated strategic priorities.",
      "Categorize each priority into an explicit evidence framework.",
      "Retrieve and normalize relevant SEC XBRL financial facts.",
      "Score action evidence, outcome evidence, and persistence deterministically.",
      "Show the claim beside the financial evidence supporting or contradicting it.",
    ],
    decisionOutput:
      "A claim-by-claim strategy alignment analysis showing what management said, what the financial record did, the arithmetic behind the score, the available evidence, and the analytical confidence.",

    status: "prototype",
    evidenceStatus: "measured-partial",

    summary:
      "Enter a public-company ticker and the system reads management's current priorities from the latest 10-K, retrieves the corresponding SEC XBRL financial history, and tests whether spending and operating results support those claims. Language models identify and categorize the stated priorities; financial metrics, thresholds, alignment scores, contradiction checks, and confidence calculations are produced through deterministic code.",

    recommendation: null,

    brief: {
      decision:
        "Management has described a set of strategic priorities. Does the financial record indicate that the company is actually allocating capital and producing results consistent with those priorities?",
      position:
        "No universal judgment. The tool evaluates one company and filing at a time, keeps interpretation separate from arithmetic, and exposes the evidence and confidence behind every claim-specific score.",
      evidence:
        "Measured in part. The running deployment reads the latest 10-K for current strategy, maps extracted claims to an explicit taxonomy, retrieves SEC XBRL facts, and scores action evidence, outcome evidence, and persistence through deterministic code. Results remain constrained by the available mapping and filing data.",
      tradeoff:
        "A constrained taxonomy and deterministic evidence model are less semantically flexible than asking a language model whether strategy and financials seem aligned. The constraint is intentional because the resulting score can be reconstructed.",
      uncertainty:
        "Extraction can be imperfect, category-to-metric mappings can omit relevant evidence, and some components may be missing. Analytical confidence therefore remains separate from alignment and missing data is never silently treated as zero.",
    },

    alternatives: [
      {
        option: "Summarize the 10-K with a language model",
        argument:
          "A generated summary would make a long filing easier to understand and could surface management's current themes quickly.",
        objection:
          "Comprehension alone does not test whether spending and operating results support the stated priorities.",
      },
      {
        option: "Build a conventional financial-ratio dashboard",
        argument:
          "A ratio dashboard would stay grounded in reported numbers and be familiar to a financial reader.",
        objection:
          "It would not connect those numbers to the strategic claims management asked investors and operators to believe.",
      },
      {
        option: "Ask a language model to judge alignment directly",
        argument:
          "A model could consider more context and handle unusual language without a fixed evidence taxonomy.",
        objection:
          "It is rejected as the scoring engine because the financial judgment would be difficult to audit, reproduce, and distinguish from persuasive language.",
      },
    ],

    evidence: [
      {
        id: "ev-narrative-filings",
        label: "SEC filing and XBRL record",
        detail:
          "The system resolves a public-company ticker, reads the latest 10-K for current strategic priorities, and retrieves normalized annual facts from the SEC company-facts record for the requested history.",
        status: "measured-partial",
        sourceRefs: ["src-narrative-sec", "src-narrative-demo"],
      },
      {
        id: "ev-narrative-model",
        label: "Deterministic alignment model",
        detail:
          "Alignment is computed as 0.50 action evidence, 0.30 outcome evidence, and 0.20 persistence when all components are present. Missing components have their weight redistributed and are listed as limitations rather than scored as zero.",
        status: "measured-partial",
        sourceRefs: ["src-narrative-readme"],
      },
      {
        id: "ev-narrative-confidence",
        label: "Separate analytical confidence",
        detail:
          "Extraction confidence, mapped-metric coverage, and available history produce an analytical-confidence measure that is displayed separately from alignment, preventing a strong score on thin evidence from reading as certainty.",
        status: "measured-partial",
        sourceRefs: ["src-narrative-readme", "src-narrative-demo"],
      },
    ],

    tradeoffs: [
      {
        label: "Reconstructible scoring over semantic freedom",
        detail:
          "A fixed taxonomy cannot capture every possible strategic nuance, but it keeps the financial judgment tied to approved metrics, directions, thresholds, and arithmetic.",
      },
      {
        label: "Current strategy over historical narrative drift",
        detail:
          "The latest 10-K supplies the current priorities while earlier periods supply financial history. The MVP does not yet test how management's stated strategy changed across filings.",
      },
      {
        label: "Visible gaps over complete-looking scores",
        detail:
          "Missing evidence lowers coverage and may redistribute component weights. The report is messier because it states the gap, and more honest because it does not quietly turn absence into a neutral observation.",
      },
    ],

    uncertainties: [
      {
        label: "Extraction quality",
        detail:
          "A language model identifies and categorizes strategic priorities from Item 1 and Item 7. It can miss, overstate, or misclassify a claim even though its source quote and extraction confidence remain visible.",
      },
      {
        label: "Evidence-map coverage",
        detail:
          "A strategic claim can matter without mapping cleanly to the metrics allowed for its category. The system can only score the evidence framework it has been given.",
      },
      {
        label: "Alignment is not causality",
        detail:
          "Movement in spending or outcomes consistent with a claim does not prove that the stated strategy caused it or that the strategy is economically attractive.",
      },
    ],

    sections: {
      context: [
        "Corporate strategy is easy to describe and much harder to verify. Annual filings contain carefully framed priorities, while the evidence of execution is spread across capital expenditure, operating metrics, margins, and several years of reported facts.",
        "Narrative vs. Numbers brings those two records together. It asks what management said was strategically important, which financial signals ought to move if the claim is being acted on, and whether the observed history supports, weakens, or leaves that claim unresolved.",
        "The decision is company- and filing-specific. The system does not label management generally credible or incredible, and it does not claim that alignment makes the strategy good. It tests whether stated priorities and visible execution point in the same direction.",
      ],
      methodAndModel: [
        "The latest 10-K supplies the current strategy. A language model is limited to returning a priority label, one category from a fixed taxonomy, the source quote, and extraction confidence. Categories outside the taxonomy are discarded rather than improvised.",
        "Each accepted category maps to approved financial signals with a required direction and threshold. SEC XBRL facts are normalized into annual metrics, then action evidence, outcome evidence, and persistence are calculated. With all components present, alignment equals 0.50 times action evidence, 0.30 times outcome evidence, and 0.20 times persistence.",
        "A component with no data is not scored as zero. Its weight is redistributed across available components and the gap is carried into the limitations. Analytical confidence is calculated separately from extraction certainty, evidence coverage, and available history.",
      ],
      evidenceAndResults: [
        "The system is deployed and can analyze one public company and filing at a time. The live page includes a Microsoft example drawn from its 10-K for the year ended 30 June 2026, placing a capacity-expansion claim beside changes in capital expenditure, property and equipment, and capital-expenditure intensity.",
        "That example demonstrates the product's claim-by-claim structure and the distinction between management language and computed evidence. It is not a general recommendation about Microsoft, and the tool's overall judgment depends on every extracted priority, available metric, limitation, and confidence value in the run.",
        "The current evidence establishes that the ingestion, normalization, mapping, scoring, contradiction, and confidence paths run over SEC data. It does not establish that the taxonomy captures every strategically relevant signal or that the score predicts performance.",
      ],
      interpretation: [
        "The central distinction is deliberate: AI interprets the filing; data grounds the claim; code performs the financial judgment. A model swap can change which priorities are extracted, but it cannot silently change the arithmetic used to score them.",
        "The most useful disagreement is therefore specific. A reader can challenge the extracted claim, its category, the approved metric, the direction, the threshold, the observed value, or the confidence instead of accepting or rejecting one opaque verdict.",
      ],
      limitations: [
        "Current strategy is read from the most recent 10-K. Historical years primarily provide financial persistence and do not yet show how the strategy narrative itself changed over time.",
        "Evidence depends on the configured strategy-category-to-metric mapping. Relevant qualitative execution or unmapped operational signals may be absent from the score.",
        "Missing components are shown and their weights redistributed, language-model extraction can be imperfect, and analytical confidence must remain distinct from alignment. Alignment is not proof of causality or strategic quality.",
      ],
      nextTest: [
        "Create a human-reviewed set of strategic-priority extractions across several industries and report category-level misses and disagreements before broadening the taxonomy.",
        "Have strategy and finance reviewers inspect the same claim-level reports, record which part of the evidence chain they dispute, and test whether the exposed arithmetic makes those disagreements more precise.",
      ],
    },

    ownerContribution:
      "I framed the strategy-execution question, defined the division of labor between language interpretation and financial judgment, specified the evidence taxonomy and scoring logic, and designed the report so every claim can be traced to its filing language and supporting metrics.",
    implementationDisclosure:
      "The application was implemented with AI coding assistance against an owner-authored specification. The language model is constrained to priority extraction and categorization; XBRL normalization, metric calculations, alignment, contradictions, and analytical confidence are deterministic.",
    humanReviewStatus:
      "No external review is claimed. This case is grounded in the public repository documentation, inspected implementation, and running production workflow, with known data and extraction limitations left visible.",

    demoUrl: "https://narrative.ankitkapoor.me",
    demoTarget: "external",
    demoLabel: "Run an analysis",
    repositoryUrl: "https://github.com/ankitkapooor/narrative-vs-numbers",

    coverAsset: "schematic-narrative-vs-numbers",

    sourceRefs: [
      {
        id: "src-narrative-readme",
        label: "Narrative vs. Numbers — public repository documentation",
        detail:
          "Public repository documentation describing 10-K ingestion, strategy extraction, SEC XBRL normalization, deterministic alignment scoring, confidence, caching, and known limitations. The alignment formula shown on this site was verified against the implementation.",
      },
      {
        id: "src-narrative-sec",
        label: "US Securities and Exchange Commission filings and XBRL data",
        detail:
          "Public 10-K filing text and company-facts XBRL records used by the application to connect management's stated priorities with normalized annual financial evidence.",
      },
      {
        id: "src-narrative-demo",
        label: "Narrative vs. Numbers — production deployment",
        detail:
          "Running production deployment inspected on 14 September 2026 to verify the end-to-end workflow and the Microsoft example represented by the product schematic.",
      },
    ],

    publishedAt: "2026-09-14",
    updatedAt: "2026-09-14",
    accentVar: "--project-accent-04",
  },

  /* ------------------------------------------------------------------ 05 */
  {
    slug: "priced-in",
    number: "05",
    title: "Priced In",
    question: "What has to be true economically?",
    decisionDomain: "Finance / valuation",
    portfolioGroup: "lab",
    capability: "Reverse-valuation workbench",
    purpose:
      "A workbench that turns a valuation into the operating performance a business would have to deliver to justify it.",
    whyItMatters:
      "Strategic narratives eventually imply financial requirements. Running valuation logic backwards makes those requirements explicit and allows a decision-maker to ask whether the growth, margin, customer, or efficiency assumptions embedded in the case are actually plausible.",
    workflow: [
      "Review and normalize the financial inputs.",
      "Run the valuation model backwards from a target value.",
      "Map the growth and margin combinations consistent with that value.",
      "Select a scenario and translate it into operating requirements where possible.",
      "Overlay the contribution an AI initiative would need to make.",
      "Use Break My Thesis to search for assumptions that invalidate the case.",
    ],
    decisionOutput:
      "An expectations map showing the operating performance consistent with a valuation, plus the assumptions and failure conditions that determine whether the case holds.",

    status: "prototype",
    evidenceStatus: "illustrative",

    summary:
      "A financial workbench for exploring the business performance required to justify a valuation. Connect assumptions to operating requirements and test the contribution an AI investment would need to make. It runs the valuation backwards: pick a target, see which growth and margin combinations satisfy it, translate one of those into required customers and price, and then try to break the case you just built.",

    recommendation: null,

    brief: {
      decision:
        "A company's valuation embeds a forecast that nobody has written down. Before arguing about whether it is too high, work out what it actually requires the business to do.",
      position:
        "Investigation in progress. The workbench now computes a valuation and draws the expectations map, and its arithmetic agrees with golden fixtures worked out by hand. But no real company has been analysed, no finance professional has looked at the method, and no case has been authored, so there is nothing to conclude. The proposed test is unchanged: reconcile the five-year cash-flow model against an independent golden model within a stated tolerance, then publish one fully worked synthetic case with every input traced to its source.",
      evidence:
        "None measured. The workbench runs and its output matches fixtures computed by hand, but a fixture checks arithmetic rather than establishing a finding, and the synthetic sample company is a calculation fixture, not a company. No real company has been analysed, no end-to-end reconciliation against an independent model has been run, no finance professional has reviewed anything, and no case has been authored.",
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
        "The workbench runs. It computes a valuation from the supplied inputs and renders the expectations map as a forty-one by forty-one grid, drawn off the main thread, with the band that lands near the chosen target marked and the cells whose inputs are invalid hatched rather than quietly filled in. It is deployed and open to anyone, so the map can be explored directly rather than described here.",
        "There are still no results. Golden fixtures worked out by hand agree with what the model returns, which establishes that the arithmetic does what it claims — and nothing whatsoever about a company. The model has not been reconciled against an independent implementation end to end, no real company has been analysed, no finance professional has reviewed the method, no case has been authored, and no valuation has been published.",
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
        "The five-year model and the expectations map are live. The rest of the first release scope in the brief is still outstanding.",
        "Then reconcile the model against an independently built golden model and publish the agreed tolerance. Hand-computed fixtures check individual figures; they are not a reconciliation, and an unreconciled valuation model is not evidence about a company.",
        "Then author one complete worked case on the synthetic company, with every input traced to a source and every conclusion attributable to a stated assumption.",
      ],
    },

    ownerContribution:
      "I chose the reverse-valuation framing, specified the model structure and the terminal treatment, designed the expectations map, the operating bridge, and the Break My Thesis stress test, and set the scope boundaries that keep the tool from being applied where it does not belong.",
    implementationDisclosure:
      "The workbench has been implemented with AI coding assistance against a specification I authored. Calculations are required to reconcile against an independent golden model within a stated tolerance before any figure is published; assistance is not accepted as verification, which is why no figure the workbench computes appears on this page.",
    humanReviewStatus:
      "Reviewed by me on 7 September 2026 for accuracy of status and claims. No external review, and no review by a finance professional. No end-to-end numerical reconciliation has been run and no case has been authored.",

    demoUrl: "https://priced.ankitkapoor.me",
    demoTarget: "external",
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
    updatedAt: "2026-09-14",
    accentVar: "--project-accent-05",
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
