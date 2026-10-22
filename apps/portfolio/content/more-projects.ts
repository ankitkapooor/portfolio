export type MoreProject = {
  slug: string;
  title: string;
  question: string;
  domain: string;
  demoUrl: string;
  repositoryUrl: string;
  statusLabel: string;
  summary: string;
  highlights: string[];
  technologies: string[];
};

export const moreProjects: readonly MoreProject[] = [
  {
    slug: "orthocode-ai",
    title: "OrthoCode AI",
    question: "How do we make clinical AI verifiable by auditors and clinicians?",
    domain: "Healthcare AI · Clinical Decision Systems",
    demoUrl: "https://orthocode.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/autocode",
    statusLabel: "Live Prototype · Open Source",
    summary:
      "An evidence-first orthopedic medical-coding platform. Operates on a normalized, versioned codebook release and preserves page-level chart evidence for every proposed coding line.",
    highlights: [
      "Normalized codebook releases: Ingestion and validation of 11,525+ licensed 2026 CPT codes and 4.49M directional NCCI PTP edits with cryptographic raw-file SHA-256 provenance.",
      "Evidence-linked fact extraction: De-identified operative PDF notes parsed via OpenAI Structured Outputs (store=false) to produce bounded, page-anchored clinical fact candidates.",
      "Calibrated decision graph: TypeSafe JEV decision engine with calibrated green/yellow/red confidence thresholds, failing closed to mandatory human review on uncertain cases.",
      "Deterministic rule verification: Python validation for active-code service dates, NCCI PTP unbundling, MUE units, add-on dependencies, and HCPCS administered unit arithmetic.",
    ],
    technologies: [
      "Python 3.12",
      "FastAPI",
      "Next.js",
      "PostgreSQL 16",
      "Redis",
      "Docker",
      "TypeSafe JEV",
      "OpenAI Structured Outputs",
    ],
  },
  {
    slug: "flycast",
    title: "FlyCast",
    question: "Can an evolved biological nervous system serve as a physical recurrent computer?",
    domain: "Computational Neuroscience · Reservoir Computing",
    demoUrl: "https://flycast.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/Flycast",
    statusLabel: "Live Prototype · Open Source",
    summary:
      "Turns the experimentally reconstructed MaleCNS v1.0 Drosophila melanogaster connectome into a fixed recurrent computational reservoir to test whether real biological wiring provides forecasting utility.",
    highlights: [
      "Biological substrate: 166,483 identified neurons and 25.58M directed synaptic edges modeled as a high-performance Compressed Sparse Row (CSR) matrix with presynaptic-to-postsynaptic orientation.",
      "Recurrent Echo State dynamics: Leaky rate dynamics running over frozen biological wiring with log-scaled synaptic contacts and incoming L1 normalization.",
      "Virtual state probes: 4,096 virtual electrodes sample internal network state trajectories to train a lightweight multi-horizon linear Ridge regression readout.",
      "Scientific honesty: Evaluated with zero data leakage against held-out test data and benchmarked against autoregressive baselines, persistence, and weight-shuffled controls.",
    ],
    technologies: [
      "Python",
      "NumPy",
      "SciPy (Sparse CSR)",
      "Scikit-Learn",
      "React",
      "Next.js",
      "MaleCNS v1.0 Connectome",
    ],
  },
  {
    slug: "catalog-underwriter",
    title: "Catalog Underwriter",
    question: "Underwrite a music catalog using only what the public can see.",
    domain: "Quantitative Finance · Asset Valuation",
    demoUrl: "https://catalog.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/catalog-underwriter",
    statusLabel: "Live Prototype · Open Source",
    summary:
      "An interactive public-data workbench for reconstructing music catalogs and stress-testing valuations—separating observed consumption, modeled decay, financial assumptions, and discounted cash flow.",
    highlights: [
      "Public evidence assembly: Live MusicBrainz artist identity resolution paired with optional Last.fm relative scrobble demand and YouTube view metrics.",
      "Demonstration underwrite: Stored snapshot for Kendrick Lamar allowing full catalog valuation and scenario exploration without external API dependencies.",
      "Interactive DCF modeling: User-editable rights shares, decay profiles, capital costs, bear/base/bull cases, and two-dimensional discount vs. growth sensitivity matrices.",
      "Break the Deal diagnostics: Deterministic stress testing pinpointing the exact combinations of decay acceleration, concentration risk, and discount rates that impair investment returns.",
    ],
    technologies: [
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Recharts",
      "MusicBrainz API",
      "Last.fm API",
      "YouTube Data API",
    ],
  },
  {
    slug: "valuelens",
    title: "ValueLens",
    question: "What is a stock price betting on?",
    domain: "Equity Research · Company Valuation",
    demoUrl: "https://valuelens.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/smart-invest",
    statusLabel: "Live Prototype · Open Source",
    summary:
      "A filing-based valuation workbench that rebuilds a company's cash flows from its SEC filings and reads today's share price three ways—the growth the price requires, what analysts expect, and what the fundamentals support.",
    highlights: [
      "Sourced filing extraction: Revenue, operating income, R&D, capex, cash, debt, and shares pulled from 10-K and 10-Q filings with provenance on every figure; lines a company does not report are labeled rather than estimated.",
      "Three readings of every price: Market-implied five-year revenue growth, an analyst-consensus case net of buybacks or dilution, and a fundamental FCFF DCF with R&D capitalized as investment.",
      "Measured value ranges: 1,000 scenarios drawn from measured forecast errors produce an 80% value range, calibrated on held-out data at 80.8% for revenue and 78.7% for margin.",
      "Backtested, not asserted: Default rules tested point-in-time on a 155-issuer SEC archive cut five-year revenue forecast error from 40% to 30%, while return backtests showing no demonstrated edge are reported openly.",
    ],
    technologies: [
      "JavaScript",
      "Cloudflare Workers",
      "SEC EDGAR / XBRL",
      "FCFF DCF",
      "Monte Carlo Simulation",
      "OpenAI API",
    ],
  },
  {
    slug: "bill-buster",
    title: "Bill Buster",
    question: "Which hospital charges are worth questioning, and how do you ask?",
    domain: "Healthcare Billing · Price Transparency",
    demoUrl: "https://billbuster.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/bill-buster",
    statusLabel: "Live Prototype · Open Source",
    summary:
      "Turns a coded outpatient facility bill into an evidence-backed inquiry letter and phone checklist. PDF reading, billing checks, and letter generation all run in the browser, and findings are framed as questions to ask rather than conclusions.",
    highlights: [
      "Deterministic billing checks: Possible duplicates, CMS outpatient MUE unit limits, and Q3 2026 hospital NCCI procedure-to-procedure edits, applied with indicator, modifier, provider, and effective-date logic.",
      "Hospital price context: Charges compared against Keck Hospital of USC's published price file, with a field-specific reason given whenever a price cannot be matched.",
      "Cited inquiry packet: A first-person letter and phone checklist exported as PDF, with every citation linked to its source record and a conditional reduced-bill scenario labeled as not approved.",
      "Private by design: Bills stay on the device; optional AI drafting via a Cloudflare Worker sends only confirmed findings, and figures and citations are always inserted by code.",
    ],
    technologies: [
      "JavaScript",
      "PDF.js (unpdf)",
      "pdf-lib",
      "Cloudflare Workers",
      "OpenAI Responses API",
      "CMS NCCI & MUE Data",
    ],
  },
  {
    slug: "ideology-inventory",
    title: "Ideology Inventory",
    question: "Where do your political views actually sit?",
    domain: "Political Psychology · Survey Measurement",
    demoUrl: "https://polskew.ankitkapoor.me",
    repositoryUrl: "https://github.com/ankitkapooor/pol-skew",
    statusLabel: "Live Prototype · Open Source",
    summary:
      "A research-informed political-orientation inventory that places respondents on separate economic, social, and state-authority scales, adds short climate, trade, and populism scales, profiles six moral foundations, and checks how far to trust the answers.",
    highlights: [
      "Multidimensional measurement: Three 12-item core scales grounded in the political-psychology literature, plus six MFQ-2 moral foundations scored relative to the respondent's own average.",
      "Noise controls: Every ideology statement is matched with an opposite-keyed partner so acquiescence cancels out, and \"no opinion\" widens the uncertainty band instead of pulling scores to zero.",
      "Response-quality grading: Seven checks—attention, implausible statement, contradictory pairs, agreement tendency, response variety, reading speed, and no-opinion count—combine into a High, Moderate, or Low grade.",
      "Honest benchmarking: Only questions copied word for word from ANES 2024 and CES 2024 are compared with weighted U.S. distributions; consented anonymous responses feed a reliability, IRT, and test–retest pipeline in R.",
    ],
    technologies: [
      "TypeScript",
      "Vite",
      "Cloudflare Workers",
      "Cloudflare D1",
      "Turnstile",
      "R (IRT / CFA)",
      "Python",
    ],
  },
];

export const githubProfile = {
  url: "https://github.com/ankitkapooor",
  label: "github.com/ankitkapooor",
  heading: "Explore further work on GitHub",
  intro:
    "Beyond the five core decision cases and the systems above, my GitHub profile hosts ongoing code, open-source tools, and research experiments across machine learning, system design, and quantitative strategy.",
};
