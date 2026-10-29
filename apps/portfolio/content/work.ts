/**
 * Every project on the homepage, in display order.
 *
 * One list replaces the old Featured / Strategy Lab / More Projects tiers.
 * Each entry answers the three things a visitor scans for: what it is
 * (`tagline`), why it matters (`why`), and how to see it (`demoUrl`,
 * `repositoryUrl`, `casePath`). Browser projects have a screenshot poster at
 * public/work/<slug>.jpg and a short recorded walkthrough at
 * public/work/<slug>.webm, both captured from the live demos on 23 October
 * 2026 (see tools/demo-recorder). Downloadable apps use a still image of
 * their information page instead.
 */

export const workCategories = ["Strategy", "Applied AI", "Finance", "Healthcare", "Research", "Just for fun"] as const;
export type WorkCategory = (typeof workCategories)[number];

export type WorkItem = {
  slug: string;
  title: string;
  category: WorkCategory;
  tagline: string;
  why: string;
  stack: readonly string[];
  demoUrl: string;
  /** Downloadable apps link to their information and installation page. */
  delivery?: "download";
  repositoryUrl: string | null;
  /** Long-form case study on this site, where one exists. */
  casePath: string | null;
};

export const work: readonly WorkItem[] = [
  {
    slug: "market-entry-war-room",
    title: "Market Entry War Room",
    category: "Strategy",
    tagline:
      "Ranks 393 US metro areas for a business's next location, then tests whether the winner survives a change in priorities.",
    why: "Market-entry advice usually arrives as one answer. This shows which assumption is actually driving the pick.",
    stack: ["Python", "FastAPI", "React", "Census ACS", "Monte Carlo"],
    demoUrl: "https://warroom.ankitkapoor.me/ui/",
    repositoryUrl: "https://github.com/ankitkapooor/market-entry-war-room",
    casePath: "/work/market-entry-war-room",
  },
  {
    slug: "exception-engine",
    title: "The Exception Engine",
    category: "Applied AI",
    tagline:
      "A policy lab built on EU air-passenger rights. Code applies the rules, an AI model answers bounded factual questions, and a confidence threshold decides when a person steps in.",
    why: "Most automation decisions live in the grey area. This makes the trade-off between automating and asking a human explicit, case by case, across 600 recorded model assessments.",
    stack: ["TypeScript", "Vite", "Cloudflare Workers", "TypeSafe JEV", "EU 261/2004"],
    demoUrl: "https://exceptionengine.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/exception-engine",
    casePath: null,
  },
  {
    slug: "valuelens",
    title: "ValueLens",
    category: "Finance",
    tagline:
      "Rebuilds a company's cash flows from its SEC filings and reads the share price three ways: market-implied, consensus, and fundamental.",
    why: "Turns “is this stock cheap?” into “what growth is the price betting on?”, with value ranges calibrated on held-out data.",
    stack: ["JavaScript", "Cloudflare Workers", "SEC EDGAR / XBRL", "DCF", "Monte Carlo"],
    demoUrl: "https://valuelens.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/smart-invest",
    casePath: null,
  },
  {
    slug: "escalation-frontier",
    title: "The Escalation Frontier",
    category: "Applied AI",
    tagline:
      "Routes 1,270 recorded banking-support decisions between a fast classifier, a reasoning model, and human review. Move the confidence threshold and watch cost, accuracy, and latency shift.",
    why: "Not every decision deserves the same model. This puts a price on extra certainty, so the routing threshold becomes a business choice instead of a guess.",
    stack: ["TypeScript", "React", "Node.js", "TypeSafe JEV", "Claude Sonnet 4.5", "BANKING77"],
    demoUrl: "https://escalation.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/escalation-frontier",
    casePath: null,
  },
  {
    slug: "orthocode-ai",
    title: "OrthoCode AI",
    category: "Healthcare",
    tagline:
      "Medical coding for orthopedic surgery. Every proposed code links back to the chart page that justifies it, and CMS rules are checked in code.",
    why: "At Ascent, my team cut coding time per chart 10× by targeting surgical charts instead of radiology. OrthoCode rebuilds that bet so every code can survive an audit.",
    stack: ["Python", "FastAPI", "Next.js", "PostgreSQL", "OpenAI Structured Outputs"],
    demoUrl: "https://orthocode.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/autocode",
    casePath: null,
  },
  {
    slug: "tandem",
    title: "tandem",
    category: "Applied AI",
    tagline: "A Mac app that puts you, Claude Code, and Codex in one shared conversation, with Solo, Relay, Parallel, and Debate modes.",
    why: "A second perspective is useful only if it has the context. tandem lets the agents read each other’s replies, challenge assumptions, and work in an order you control.",
    stack: ["Electron", "Node.js", "Claude Code", "Codex CLI"],
    demoUrl: "https://tandem.ankitkapoor.me",
    delivery: "download",
    repositoryUrl: "https://github.com/ankitkapooor/tandem",
    casePath: null,
  },
  {
    slug: "narrative-vs-numbers",
    title: "Narrative vs. Numbers",
    category: "Strategy",
    tagline:
      "Reads the priorities management states in a 10-K, then checks whether the spending in its filings backs them up.",
    why: "Every strategy deck says the right things. The gap between what a company says and what it does is where execution shows.",
    stack: ["Python", "SEC XBRL", "OpenAI", "Deterministic scoring"],
    demoUrl: "https://narrative.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/narrative-vs-numbers",
    casePath: "/work/narrative-vs-numbers",
  },
  {
    slug: "catalog-underwriter",
    title: "Catalog Underwriter",
    category: "Finance",
    tagline:
      "Values a music catalog from public listening data, with an editable DCF, bear/base/bull cases, and a “break the deal” stress test.",
    why: "Catalog deals are priced on decay assumptions. This shows exactly which ones break the return.",
    stack: ["React", "TypeScript", "Recharts", "MusicBrainz", "Last.fm", "YouTube API"],
    demoUrl: "https://catalog.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/catalog-underwriter",
    casePath: null,
  },
  {
    slug: "bill-buster",
    title: "Bill Buster",
    category: "Healthcare",
    tagline:
      "Turns a hospital bill into a cited inquiry letter and a phone checklist. Everything runs in the browser, so the bill never leaves the device.",
    why: "Hospital prices are now published, but patients still can't use them. This turns the data into specific questions to ask.",
    stack: ["JavaScript", "PDF.js", "pdf-lib", "CMS NCCI & MUE", "Cloudflare Workers"],
    demoUrl: "https://billbuster.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/bill-buster",
    casePath: null,
  },
  {
    slug: "the-moat-test",
    title: "The Moat Test",
    category: "Strategy",
    tagline:
      "Builds a cheap challenger to a paid AI product (meeting assistants) and measures what the subscription is really buying.",
    why: "If a model can do the feature, the moat has to be somewhere else. This is an experiment to find where.",
    stack: ["Next.js", "TypeScript", "LLM extraction", "Baseline benchmarks"],
    demoUrl: "https://moat.ankitkapoor.me",
    repositoryUrl: null,
    casePath: "/work/the-moat-test",
  },
  {
    slug: "priced-in",
    title: "Priced In",
    category: "Finance",
    tagline:
      "Runs a valuation backwards: what growth, margin, and customer count would justify the price, and what an AI bet must contribute.",
    why: "Reframes an AI investment from “will it pay off?” to “what must it deliver for the valuation to hold?”",
    stack: ["Next.js", "TypeScript", "SEC filings", "decimal.js"],
    demoUrl: "https://priced.ankitkapoor.me",
    repositoryUrl: null,
    casePath: "/work/priced-in",
  },
  {
    slug: "disrupt-this-business",
    title: "Disrupt This Business",
    category: "Strategy",
    tagline:
      "A four-quarter strategy game: defend a software incumbent against an AI-native challenger, then switch sides and attack your own plan.",
    why: "Incumbents rarely lose for lack of technology. They lose defending the wrong part of the business, and this makes that trade-off playable.",
    stack: ["Next.js", "TypeScript", "Economic engine", "Playwright"],
    demoUrl: "https://disrupt.ankitkapoor.me",
    repositoryUrl: null,
    casePath: "/work/disrupt-this-business",
  },
  {
    slug: "flycast",
    title: "FlyCast",
    category: "Research",
    tagline:
      "Uses the fruit-fly connectome (166,691 real neurons) as a fixed recurrent network and tests whether it can forecast time series.",
    why: "Asks whether evolved wiring computes better than random wiring, using shuffled-weight controls and no data leakage.",
    stack: ["Python", "NumPy", "SciPy sparse", "scikit-learn", "Next.js"],
    demoUrl: "https://flycast.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/Flycast",
    casePath: null,
  },
  {
    slug: "ideology-inventory",
    title: "Ideology Inventory",
    category: "Research",
    tagline:
      "A political-orientation survey with separate economic, social, and authority scales, moral-foundation profiles, and response-quality grading.",
    why: "Most online quizzes squash views onto one axis. This measures them the way survey researchers do, benchmarked against ANES and CES.",
    stack: ["TypeScript", "Vite", "Cloudflare D1", "R (IRT)"],
    demoUrl: "https://polskew.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/pol-skew",
    casePath: null,
  },
  {
    slug: "wordle-solver",
    title: "Wordle Solver",
    category: "Just for fun",
    tagline:
      "Type the word you played and the colors Wordle gave back. It narrows 5,757 possible answers and suggests the best next guesses.",
    why: "A small one, built for fun: elimination plus letter-frequency scoring, ported from Python to run entirely in the browser.",
    stack: ["JavaScript", "Python", "Cloudflare Workers"],
    demoUrl: "https://wordle.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/WordleSolver",
    casePath: null,
  },
];

export const workImage = (slug: string) => `/work/${slug}.jpg`;
export const workVideo = (slug: string) => `/work/${slug}.webm`;
