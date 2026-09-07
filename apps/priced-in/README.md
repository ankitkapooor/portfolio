# Priced In

A reverse-DCF workbench for reasoning about what a valuation has to assume. You enter reported financials, state your assumptions explicitly, and the app shows the enterprise value those assumptions imply, the gap to a target you supply, and what would have to change for the conclusion to flip.

**This is an educational strategy-analysis tool. It is not investment advice, it does not execute trades, and no professional finance review has taken place on the model or on any figure it produces.**

## What this release contains

This is the **P0A** scope of the BRD (`docs/03_Priced_In_BRD.md`), which is the part that works with no credentials, no network calls and no AI:

- A deterministic FCFF valuation engine in `domain/finance`, with golden tests whose expected values are hand-computed literals.
- CSV import of reported financials, normalization to unrounded USD, and a review screen that keeps the original amount, unit, period, source locator and status next to every normalized value.
- Reconciliation checks with a materiality tolerance, and no silent zero-filling of missing figures.
- A 41x41 expectations map computed in a Web Worker, with a keyboard-accessible data-table alternative.
- An operating bridge from revenue to required customers or units and implied market share.
- An AI-initiative overlay that keeps capacity, realized saving, cost and timing separate.
- A "break my thesis" surface with honest no-root and already-failing states.
- Markdown, CSV and JSON export, with JSON reimport reproducing inputs and outputs.

### Not implemented in this release

These are visible in the UI as explicit "not implemented" states rather than being faked:

- **P0B**: SEC company-facts retrieval, native-text PDF extraction, `/api/sec/*`, `/api/extract`.
- **P1**: earnings-call claim extraction, `/api/claims`, live market quotes.
- **P2**: everything.

There are no API routes, no API keys, no LLM calls and no outbound network requests anywhere in this app.

## Running it

Node 24 is expected. From this directory:

```bash
npm run dev     # http://localhost:3003
npm test        # vitest, engine + intake + portability tests
npm run build   # production build and TypeScript check
npm run lint    # eslint
```

## How the app is laid out

| Path | What it is |
| --- | --- |
| `domain/finance` | The valuation engine. Pure TypeScript, no React and no storage. `decimal.js` for money. |
| `domain/intake` | CSV parsing, the long-form template, normalization to USD, reconciliation checks. |
| `domain/analysis` | The analysis document schema (zod), the fictional sample company, and the top-level compute pass. |
| `domain/export` | Markdown, cash-flow CSV and provenance CSV writers. |
| `workers/grid.worker.ts` | The expectations grid, off the main thread. |
| `components` | Client components: the analysis provider, the assumptions rail, the map, shared panels. |
| `app/workspace/*` | The seven workspace screens: import, review, expectations, operations, ai, challenge, brief. |
| `MODEL-METHODOLOGY.md` | The formula dictionary and the accounting policy. Read this before trusting a number. |

### Routes

`/` `/workspace/import` `/workspace/review` `/workspace/expectations` `/workspace/operations` `/workspace/ai` `/workspace/challenge` `/workspace/brief`

## Data, storage and privacy

Everything lives in your browser. The analysis document is written to IndexedDB (`lib/storage.ts`) and nothing is sent anywhere. "Forget everything" on the masthead deletes the stored analysis. Exported JSON is the portable copy; it carries the engine and formula versions along with every reported fact, so a reimport reproduces the same outputs.

The sample company, **Meridian Harbor Logistics (MHLX)**, is fictional. Its financial statements are synthetic calculation fixtures invented for this app. No real company data ships with this project.

## Numerical approach

- All arithmetic runs on `decimal.js` at 40 significant digits with half-even rounding, in unrounded base USD and decimal rates. Rounding happens only at the display and export boundary.
- Percentages are stored as decimals (0.08, not 8).
- Share counts are stored in shares, never in millions of shares, and are never mixed with currency.
- Scale conversion happens once at import, and the original raw value, unit, scale and multiplier are all preserved on the fact record.

## Tests

`npm test` runs 99 tests across five files:

| File | Covers |
| --- | --- |
| `domain/finance/__tests__/golden.test.ts` | The four golden fixtures from BRD section 11: annual period, terminal period, equity bridge, and the integration model where both the direct DCF and the reverse solve must recover exactly $100m. |
| `domain/finance/__tests__/engine.test.ts` | Terminal guards, tax on negative EBIT, no double-counted terminal reinvestment, terminal discontinuity, bridge signs, zero shares, P-F02 (debt and cash move equity but not EV), solve-for-growth bounds and multiple crossings, and the AI overlay's cost double-count and negative-net-capacity rules. |
| `domain/intake/__tests__/intake.test.ts` | CSV quoting and embedded newlines, scale and unit confusion, capex sign, annual vs YTD periods, future dates, blank values that are never treated as zero, restatement selection, and the reconciliation checks. |
| `domain/analysis/__tests__/portability.test.ts` | The fictional sample, JSON round-trip, JSON escaping of quotes and newlines, and corrupt-import handling. |
| `domain/finance/__tests__/surfaces.test.ts` | Expectations-grid cells matching a standalone DCF, unsupported cells, operating-bridge unavailable states, market share over 100%, and break-threshold statuses including "No break within tested range". |

Golden expected values are written as literals computed by hand. No test derives its expectation by calling the function under test.

## What was actually measured

The BRD states performance targets. Only these were observed, on one developer machine, and they are not a claim that the targets are met in general:

- `npm test`: 99 tests, roughly 0.6s total.
- `npm run build`: succeeds, roughly 9s, no TypeScript errors.
- The 41x41 grid (1,681 valuations) runs in a Web Worker. Its cost was not instrumented in the browser, so no grid latency figure is claimed.
- No accessibility audit tooling was run. The design follows WCAG 2.2 AA intent — keyboard paths for the map, a table alternative to every chart, no colour-only meaning, no hover-only inspection — but that intent has not been verified with an audit.

## Honest limitations

- Five annual periods, end-of-year discounting, unlevered FCFF, USD only.
- A single forward cash-tax rate. No carryforwards, no deferred tax, no interim periods.
- The terminal value is a Gordon growth on a reinvestment-adjusted NOPAT. It is a large share of the result in most models, and the app shows that share rather than hiding it.
- Excess cash, non-operating assets and the diluted share count are judgements you enter, not extracted facts.
- Nothing here tells you what "the market expects". A cell on the expectations map is one combination consistent with a target under the other assumptions shown, and nothing more.
