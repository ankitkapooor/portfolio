# Disrupt This Business

A four-quarter strategy exercise. You take one side of a fictional software market —
RelayWorks, the incumbent, or TaskPilot, the challenger — commit to one move per quarter,
and watch a deterministic engine resolve both sides' commitments into customers and cash.

The point is not to win. The point is that every number on screen can be traced back to a
parameter or a formula you can read.

Everything runs locally in the browser. There is no account, no server-side state, no API
key and no language model anywhere in the build.

## Running it

Node 24 is expected. If Node is installed through nvm and is not on your PATH:

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
```

```bash
npm install
npm run dev        # http://localhost:3001
npm run build      # production build
npm run start      # serve the production build on 3001
npm test           # vitest: engine, opponent and portability unit tests
npm run test:e2e   # playwright: full session, rewind, reversal, export/import, keyboard
npm run lint
```

`npm run test:e2e` builds nothing on its own — it starts `npm run start`, so run
`npm run build` first.

## Where things live

| Path | What it is |
| --- | --- |
| `content/scenarios/relayworks-taskpilot.ts` | **Every scenario parameter.** Companies, opening cash, fixed costs, segments, price sensitivity, reconsideration rates, the eight actions, and the three environment presets. |
| `content/methodology.ts` | The formula catalog. Each entry has an ID (`F-UTIL`, `F-ALLOC`, …) that the engine attaches to ledger events so the UI can link a result back to its rule. |
| `domain/schema.ts` | Zod schemas and types for state, actions, runs and the export format. |
| `domain/engine.ts` | `prepareRound` and `resolveRound`. Pure functions, no storage, no randomness, no UI. |
| `domain/opponent.ts` | The scripted opponent and the public snapshot it is restricted to. |
| `domain/run.ts` | Run lifecycle: commit, rewind into a branch, switch sides. |
| `domain/portability.ts` | JSON export/import with validation, and Markdown export. |
| `domain/explain.ts` | Rule-based explanation text. |
| `persistence/runStore.ts` | IndexedDB storage. The only place the browser is touched. |
| `app/` | Routes: `/`, `/play`, `/results`, `/methodology`, `/analysis`. |

### Editing scenario parameters

Change `content/scenarios/relayworks-taskpilot.ts` and the whole app follows: the decision
catalog, the ledger, `/methodology`, and the engine tests all read from it. Two things to
know before you do:

1. `domain/engine.test.ts` contains a fixed accounting fixture with hard-coded expected
   figures for quarter one. Changing prices, costs or segment sizes will fail it. That is
   the fixture doing its job — recompute the expected values by hand, do not relax the test.
2. Bump `version` on the scenario if you change its economics. Exported runs record the
   scenario ID and version, and import refuses a file whose recorded ledger no longer
   reproduces under the current rules.

## What the model does not do

This is a teaching toy with a deliberately narrow model. Its limitations are listed in
full at `/methodology` and in `content/methodology.ts`; the ones most likely to mislead:

- **Every company, price, cost, trait and event is a fictional design assumption.** None
  of it measures a real market or predicts anything about a real company. No playtest
  data, usage statistics or user research informs any number here.
- **Demand is fixed.** There are 1,000 teams across all four quarters. Nobody can win by
  growing the market; all customers are taken from somebody.
- **Revenue is ending customers × annual price ÷ 4.** No contracts, ramp-up, billing terms
  or partial-quarter recognition.
- **Customer choice is a softmax** over four trait terms and one price term, applied only
  to the reconsidering share of each origin cohort. Real buying has switching costs,
  procurement cycles, brand and channel effects that are absent here.
- **Traits are single numbers on [0,1].** Reliability 0.90 is a preference weight, not a
  claim that 90% of tasks succeed.
- **No financing, hiring, acquisitions, product portfolios or free-text strategy.** One
  commitment per quarter from a fixed catalog of eight.
- **The opponent is a two-quarter greedy cash maximiser that assumes you hold.** It is
  easy to out-think, and beating it is not evidence of a good strategy.
- **Four quarters is too short** for most of these investments to compound. Read the
  ordering of outcomes, not the magnitudes.

## Determinism and portability

The engine is deterministic: identical inputs produce identical outputs, with no clock or
random source. That is what makes the rest work — rewinding to quarter two forks an
immutable branch that replays the shared prefix exactly, switching sides replays your
recorded script against you, and an imported JSON file is re-resolved from its decisions
and rejected if the recomputed ledger disagrees with the one in the file.

When switch-sides replay hits a move that is no longer legal for the other side, it
substitutes hold and says so in the ledger. It never silently upgrades to a stronger move.

## Scope

This build is the P0 scope of the BRD in `docs/01_Disrupt_This_Business_BRD.md`.
Deliberately not built: AI narration and the `/api/narrate` route (P1), multiplayer (P2),
and the scenario-authoring UI. The rule-based explanations that P1 would have layered
narration on top of are the primary path here, not a fallback.
