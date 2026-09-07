# AI Strategy Portfolio

Four independent applications built from the business requirements documents in
[`docs/`](docs): a personal editorial portfolio and the three projects it
describes.

Each app is a standalone npm project with its own `package.json`, lockfile, and
`node_modules`. There is no workspace tooling, no shared package, and no shared
backend — which is what the briefs specify, and what let the four be built in
parallel without touching each other's files.

| App | Port | Brief | What it is |
|---|---|---|---|
| [`apps/portfolio`](apps/portfolio) | 3000 | [04](docs/04_Portfolio_Website_BRD.md) | The editorial site and the three case studies |
| [`apps/disrupt-this-business`](apps/disrupt-this-business) | 3001 | [01](docs/01_Disrupt_This_Business_BRD.md) | Four-round competitive strategy game with a deterministic engine |
| [`apps/the-moat-test`](apps/the-moat-test) | 3002 | [02](docs/02_The_Moat_Test_BRD.md) | Meeting-extraction investigation with a real baseline and benchmark |
| [`apps/priced-in`](apps/priced-in) | 3003 | [03](docs/03_Priced_In_BRD.md) | Reverse-valuation workbench with a decimal FCFF engine |

## Requirements

Node 24. This repository was built against v24.20.0, installed via `nvm`. If
`node` is not on your `PATH`:

```sh
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
```

No API keys, credentials, or paid services are needed. Every brief requires its
first release to work without them, and it does.

## Running an app

```sh
cd apps/portfolio     # or any of the four
npm install
npm run dev           # each app has a fixed port, so all four can run at once
```

## Checks

```sh
npm test              # unit tests (all four apps)
npm run test:e2e      # Playwright (disrupt-this-business, the-moat-test)
npm run build
npm run lint
npm run validate:content   # portfolio only
```

The Moat Test also has four working command-line tools for its benchmark
pipeline: `validate-content`, `run-benchmark`, `evaluate-run`, and
`build-report`. See its README.

Two repo-wide QA scripts live in [`tools/`](tools). Build each app and start
all four servers first (`npm run start` serves the exported `out/` directory
via `tools/serve-static.mjs`), then run these from the repo root:

```sh
node tools/screenshots.mjs      # writes docs/screenshots at 360/768/1440
node tools/overflow-check.mjs   # fails loudly on horizontal overflow at 360px
```

## Current state

All four applications run, their test suites pass, and all four are configured
for deployment to Cloudflare Pages — see
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Every route in every app is
prerendered, so each builds to a static `out/` directory with nothing running
on a server. The portfolio renders a launch button for each project, pointing
at that project's own subdomain of `ankitkapoor.me`.

**The Pages projects have not been created yet**, so those subdomains do not
resolve. Deploy the three demos before the portfolio, or the portfolio ships
with three dead links.

| | Unit tests | End-to-end | Status | Evidence |
|---|---|---|---|---|
| portfolio | 101 | — | — | — |
| disrupt-this-business | 64 | 16 | Prototype | Illustrative |
| the-moat-test | 103 | 14 | Prototype | Measured, partial |
| priced-in | 99 | — | Prototype | Illustrative |

Status and evidence are separate claims, deliberately. "Prototype" means the
software genuinely runs. It says nothing about whether a finding exists — that
is what the evidence label is for, and only The Moat Test has recorded a
measured result. No project has an authored recommendation, and every case
Position still reads "Investigation in progress", because running software is
not a conclusion.

## What is deliberately not built

Scoped out of this pass, and stated plainly rather than implied as done:

- **Priced In**: P0B (SEC API retrieval, PDF statement extraction) and P1.
- **Disrupt This Business**: optional AI narration (P1) and multiplayer (P2).
- **The Moat Test**: live model trials, the paid `/api/extract` endpoint, and
  the recorded-experiment mode for a model-based challenger. The illustrative
  mode and the deterministic baseline benchmark are complete and real.
- **All research requiring a human**: playtests, user interviews, review of The
  Moat Test's gold annotations, and any reviewed real-company analysis. Gold
  annotations are drafts marked `humanReviewed: false`.
- **Owner-supplied assets**: verified contact links, LinkedIn, GitHub, résumé,
  and headshot. None have been invented; the contact section says details are
  pending, and `npm run validate:content` still warns about it.

## Requirement matrix

Requirement IDs are defined in each brief. Every row below is implemented
unless the note says otherwise.

### Portfolio, W-F01 to W-F08

| ID | Requirement | Where |
|---|---|---|
| W-F01 | Clear positioning and identity | `app/page.tsx` |
| W-F02 | Three distinct case pages | `app/work/[slug]/page.tsx`, `content/projects.ts` |
| W-F03 | Context before demo | `brief` field on each project record |
| W-F04 | Functional navigation | `components/layout/site-header.tsx` |
| W-F05 | Accurate assets and links | `lib/content-validation.ts`, `scripts/validate-content.ts` |
| W-F06 | Responsive art direction | `styles/tokens.css`, `docs/screenshots` |
| W-F07 | Maintainable content | `lib/content-validation.ts` |
| W-F08 | Accessible and performant | `lib/site-content.test.ts`, `tools/overflow-check.mjs` |

### Disrupt This Business, D-F01 to D-F08

| ID | Requirement | Where |
|---|---|---|
| D-F01 | Begin without registration | `app/page.tsx`, `e2e/session.spec.ts` |
| D-F02 | All four rounds functional | `domain/engine.ts`, `e2e/session.spec.ts` |
| D-F03 | Costs and legal moves transparent | `domain/engine.ts`, `e2e/session.spec.ts` |
| D-F04 | Model inspectable | `domain/explain.ts`, `ui/FormulaLinks.tsx` |
| D-F05 | Branch and role reversal | `domain/run.ts`, `e2e/rewind.spec.ts`, `e2e/reversal.spec.ts` |
| D-F06 | Runs persist locally | `persistence/runStore.ts` |
| D-F07 | Export portable | `domain/portability.ts`, `e2e/portability.spec.ts` |
| D-F08 | Narrative failure harmless | Not applicable this pass — AI narration is P1 and not built, so the rule-based explanations are the only path |

The brief's accounting fixture is tested in `domain/engine.test.ts`: quarter-one
incumbent revenue $960,000, variable cost $192,000, operating cash flow
$418,000, ending cash $3,418,000.

### The Moat Test, M-F01 to M-F08

| ID | Requirement | Where |
|---|---|---|
| M-F01 | Complete no-key demonstration | `ui/lab/Lab.tsx`, `e2e/journey.spec.ts` |
| M-F02 | Typed extraction contract | `domain/schemas/extraction.ts` |
| M-F03 | Explicit data modes | `ui/Badges.tsx`, `domain/methods.ts` |
| M-F04 | Reproducible benchmark report | `scripts/run-benchmark.ts`, `scripts/evaluate-run.ts` |
| M-F05 | Fair blind comparison | `ui/lab/Comparison.tsx`, `lib/panel-assignment.ts`, `e2e/blind-comparison.spec.ts` |
| M-F06 | Evidence-backed narrative | `scripts/validate-content.ts`, `scripts/validate-content.test.ts` |
| M-F07 | Private visitor inputs | `lib/local-store.ts`, `e2e/bundle-safety.spec.ts` |
| M-F08 | Portable record | `lib/export.ts` |

### Priced In, P-F01 to P-F08

| ID | Requirement | Where |
|---|---|---|
| P-F01 | Source-aware import and review | `domain/intake/`, `app/workspace/review/page.tsx` |
| P-F02 | Reliable valuation and bridge | `domain/finance/`, `domain/finance/__tests__/golden.test.ts` |
| P-F03 | Conditional expectations map | `domain/finance/grid.ts`, `workers/grid.worker.ts` |
| P-F04 | Feasible operating translation | `domain/finance/operating.ts` |
| P-F05 | Explicit AI economics | `domain/finance/initiative.ts` |
| P-F06 | Honest break thresholds | `domain/finance/challenge.ts` |
| P-F07 | Portable analysis | `domain/analysis/__tests__/portability.test.ts` |
| P-F08 | P0B ingestion | Deferred — P0B is out of scope this pass |

All four golden fixtures from the brief are hand-computed literals in
`domain/finance/__tests__/golden.test.ts`, never generated by the functions
under test.

## Honesty rules these apps are built to

Every brief repeats the same constraints, and they are enforced in content
validation and in tests rather than left to good intentions:

- Synthetic and illustrative material is labelled wherever it appears.
- No fabricated metrics, playtests, users, interviews, reviews, or vendor
  comparisons.
- No invented personal details, contact addresses, or employers.
- No dead buttons and no placeholder charts carrying invented numbers.
- No claim that anything is hosted, reviewed, or measured when it is not.
