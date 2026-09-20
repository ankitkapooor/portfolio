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
];

export const githubProfile = {
  url: "https://github.com/ankitkapooor",
  label: "github.com/ankitkapooor",
  heading: "Explore further work on GitHub",
  intro:
    "Beyond the five core decision cases and the systems above, my GitHub profile hosts ongoing code, open-source tools, and research experiments across machine learning, system design, and quantitative strategy.",
};
