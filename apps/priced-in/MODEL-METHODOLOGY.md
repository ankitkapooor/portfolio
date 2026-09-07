# Model methodology and formula dictionary

Every formula this app evaluates is listed here, along with the accounting policy it assumes and the limits of what it can honestly claim. Nothing in the app computes anything that is not in this document.

Notation: `t` is a forecast year from 1 to `N`, and `N = 5` in this release. Rates are decimals (0.08, not 8%). Amounts are unrounded USD base units. `g` is terminal growth.

Source files: `domain/finance/forecast.ts`, `terminal.ts`, `valuation.ts`, `reverse.ts`, `grid.ts`, `initiative.ts`, `operating.ts`, `challenge.ts`.

---

## 1. Scope of the model

- Unlevered free cash flow to the firm, discounted at a single constant WACC.
- Five annual periods, then a terminal value. No quarters, no stub periods, no mid-year convention.
- **End-of-year discounting.** Year `t` cash flow is discounted by `(1 + WACC)^t`. The terminal value, stated as at the end of year `N`, is discounted by `(1 + WACC)^N`.
- USD only. There is no FX translation anywhere in the engine; a non-USD filing has to be converted before import, and the conversion is the importer's responsibility.
- One constant forward cash-tax rate. No deferred tax, no carryforwards, no jurisdiction mix.
- No debt schedule, no interest, no financing cash flows. Capital structure enters only through WACC and through the equity bridge.

These are simplifications, not neutral choices. Each one can move the answer materially.

---

## 2. Accounting policy (BRD section 6)

| Item | Policy | Consequence |
| --- | --- | --- |
| Stock-based compensation | Stays an operating expense inside normalized EBIT. It is **not** added back to FCFF. | Cash flow is lower than under the common add-back convention. If you want the other convention, adjust EBIT before import and say so. |
| Operating leases | Remain operating expenses in EBIT. Operating lease liabilities are **not** subtracted as debt in the equity bridge. | Choosing one treatment and not the other prevents the standard double-count. |
| Cash taxes | `CashTax[t] = max(EBIT[t], 0) x taxRate`. | A loss year pays zero tax and produces no tax benefit. Losses do not carry forward. |
| Cash in the bridge | Only **excess** cash is added back. Cash required to run the business stays inside the operating entity. | The required operating cash figure is an input you set; it is a judgement, not a reported fact. |
| Operating working capital | Cash, short-term investments and all debt are excluded from operating NWC. | Otherwise the bridge would count the same balance twice. |
| Capex sign | Stored as a positive outflow regardless of the sign convention in the source statement. Import flips and records the flip in the fact's conversion notes. | Prevents a sign error from silently inflating cash flow. |
| Shares | Stored in shares, never in millions. Never mixed with a currency field. | Import rejects a share-count row carrying a USD unit. |
| Missing values | Never assumed to be zero. A required baseline metric that is absent blocks the model until you explicitly confirm it as a true zero on the review screen. | The confirmation is recorded in the document and appears in the export. |

---

## 3. Annual forecast (`domain/finance/forecast.ts`)

```
Revenue[t]      = Revenue[t-1] x (1 + growth[t])
Margin[t]       = startingMargin + (targetMargin - startingMargin) x t / N
EBIT[t]         = Revenue[t] x Margin[t]
CashTax[t]      = max(EBIT[t], 0) x taxRate
NOPAT[t]        = EBIT[t] - CashTax[t]
DA[t]           = Revenue[t] x daRatio[t]
Capex[t]        = Revenue[t] x capexRatio[t]
OperatingNWC[t] = Revenue[t] x nwcRatio[t]
dNWC[t]         = OperatingNWC[t] - OperatingNWC[t-1]
FCFF[t]         = NOPAT[t] + DA[t] - Capex[t] - dNWC[t]
```

`OperatingNWC[0]` is the baseline operating NWC you enter, so year one's working-capital movement is measured against the real starting balance rather than assumed to be zero.

The margin path is linear by default. Growth, D&A, capex and NWC ratios are per-year arrays, so a non-flat path can be entered directly.

**Golden annual fixture** (BRD section 11, amounts in millions for readability): baseline revenue 100 and NWC 10; growth 10%, margin 20%, tax 25%, D&A 3%, capex 5%, NWC 10% gives revenue 110, EBIT 22, NOPAT 16.5, D&A 3.3, capex 5.5, dNWC 1.0, FCFF 13.3.

---

## 4. Terminal value (`domain/finance/terminal.ts`)

```
Revenue[N+1]     = Revenue[N] x (1 + g)
NOPAT[N+1]       = Revenue[N+1] x targetMargin x (1 - taxRate)
Reinvestment     = NOPAT[N+1] x g / terminalROIC
TerminalFCFF     = NOPAT[N+1] - Reinvestment
TerminalValue    = TerminalFCFF / (WACC - g)     # as at the end of year N
```

**Terminal reinvestment replaces the explicit capex, D&A and working-capital lines for period N+1.** It is not added on top of them. This is the single most common error in reverse-DCF implementations and it is tested directly in `engine.test.ts`.

The terminal period is rejected, with a message rather than a number, unless all four of these hold:

1. Terminal NOPAT is positive.
2. `g >= 0`.
3. `WACC > g`.
4. `terminalROIC > g`.

A rejected terminal period makes the whole valuation unsupported. The app says so; it does not fall back to a smaller model or an approximation.

**Golden terminal fixture**: terminal NOPAT 12, g 2%, ROIC 10%, WACC 8% gives reinvestment 2.4, terminal FCFF 9.6 and terminal value 160 before discounting.

### The terminal discontinuity

`TerminalFCFF - FCFF[N]` is computed and displayed on the challenge screen, along with the terminal share of enterprise value. A large jump means the model's answer mostly rests on a period nobody forecast in detail. The app surfaces this rather than smoothing it away.

---

## 5. Enterprise value and the equity bridge (`domain/finance/valuation.ts`)

```
EV = sum over t of FCFF[t] / (1 + WACC)^t  +  TerminalValue / (1 + WACC)^N

EquityValue   = EV + excessCash + nonOperatingAssets
                   - financialDebt - preferredEquity - minorityInterest
ValuePerShare = EquityValue / dilutedShares
```

Rules the bridge enforces:

- Excess cash only, never the full cash balance.
- Financial debt only. Operating lease liabilities are excluded, because leases were already expensed in EBIT.
- If equity value is not positive, the case is reported as distressed or unsupported. **No negative per-share price is ever shown.**
- If the diluted share count is missing, zero or negative, no per-share value is shown and the reason is stated.
- Changing debt or excess cash moves equity value and leaves operating enterprise value untouched. This is acceptance criterion **P-F02** and is a test.

**Golden bridge fixture**: EV 200 + excess cash 20 + other assets 5 - debt 40 - preferred 3 - minority 2 = equity 180; over 10m shares that is $18.00 per share.

### The target enterprise value

When you supply a dated market price per share, the target is derived by running the bridge in reverse:

```
TargetEV = price x dilutedShares + financialDebt + preferredEquity + minorityInterest
                 - excessCash - nonOperatingAssets
```

You can also enter a target enterprise value directly. Either way it is a number you supply. **This app has no market data feed.** Nothing here is live, and the app never claims a target represents "the market's view" beyond the arithmetic of the number you typed in.

`ValueGap = EV(model) - TargetEV`, and the percentage gap uses the target as the denominator.

**Golden integration fixture**: baseline revenue $100m, growth 0%, starting and target margin 10%, tax 0%, D&A 3%, capex 3%, NWC ratio 0%, WACC 10%, terminal growth 0%, terminal ROIC 10%, no net debt. Each year's FCFF is $10m, terminal FCFF is $10m, terminal value is $100m, and enterprise value is exactly $100m. Both the direct DCF and the reverse solve for growth must recover this.

---

## 6. Reverse solve for growth (`domain/finance/reverse.ts`)

Finds the constant annual growth rate at which modeled EV equals the target EV, holding everything else fixed.

The range is scanned at a fixed number of steps. A bisection is run **only** inside an interval where the value gap changes sign. Outcomes are reported as one of:

- **solved** — one crossing, with the growth rate and the list of inputs held fixed.
- **no_solution_in_bounds** — no sign change inside the stated range. The bounds are never silently widened.
- **multiple_crossings** — more than one crossing. All of them are listed rather than one being picked quietly.
- **unsupported** — the model rejects the endpoints, so no gap can be evaluated.

---

## 7. Expectations map (`domain/finance/grid.ts`, run in `workers/grid.worker.ts`)

A 41x41 grid over constant growth (x) and year-N operating margin (y). Every cell is a full independent valuation at that pair, with all other assumptions held at their current values.

Each cell reports the value gap in USD. A cell whose model is rejected — usually a terminal guard — is marked **unsupported** and drawn with a hatched pattern. It is never coloured as if it were a valid low or high value.

Cells within a stated tolerance of zero gap form the near-target band. The correct reading of that band is:

> Combinations consistent with this target under the other assumptions shown.

Not "the market's forecast". No single cell is ever labelled as anyone's expectation, because a two-dimensional slice through a many-dimensional assumption space cannot identify one.

Selecting a cell writes that growth and margin pair into the active scenario, and the standalone DCF from those assumptions matches the cell's own figure. That match is acceptance criterion **P-F03** and is a test.

---

## 8. Operating bridge (`domain/finance/operating.ts`)

Translates forecast revenue into the operations that would have to occur.

```
Customers template: requiredCustomers = Revenue[t] / annualRevenuePerCustomer[t]
Units template:     requiredUnits     = Revenue[t] / averageRealizedPrice[t]
Implied share:      Revenue[t] / marketRevenue[t]
```

- A missing, zero or negative driver produces an explicit **unavailable** state for that year. It is never filled in with an interpolation, an average or a guess.
- An implied share above 100% is flagged rather than displayed as a normal figure.
- The market size is a number you enter with a definition and an as-of date. If the market date does not line up with the forecast year, that mismatch is shown next to the share.

Explicit unavailable states are acceptance criterion **P-F04**.

---

## 9. AI initiative overlay (`domain/finance/initiative.ts`)

The overlay is incremental to the baseline run. Per year:

```
GrossCapacity  = eligibleLaborCost x adoption x grossEffortReduction
NetCapacity    = GrossCapacity - reviewAndReworkCost
RealizedBenefit = NetCapacity x realizationFraction

IncrementalEBIT = RealizedBenefit
                + incrementalRevenue x contributionMargin
                - cannibalizedRevenue x cannibalizedContributionMargin
                - aiOperatingExpense
                - implementationOperatingExpense
                - aiDA

IncrementalTax  = max(BaselineEBIT + IncrementalEBIT, 0) x taxRate
                - max(BaselineEBIT, 0) x taxRate

IncrementalFCFF = IncrementalEBIT - IncrementalTax + aiDA - aiCapex - dIncrementalNWC
```

Rules that matter:

- **Capacity is not saving.** Gross capacity, net capacity after review and rework, and the realized fraction are three separate numbers and stay separate on screen.
- **A negative net benefit is never clamped to zero.** If review and rework cost more than the capacity released, the model says so.
- **Tax is computed at the whole-company level as the difference between scenario and baseline cash tax**, so a loss-making baseline cannot manufacture a tax shield out of an initiative.
- **Time-zero implementation cash and capex are subtracted once, undiscounted, at t=0, and never repeated in year one.** Double-counting these is a test.
- Incremental operating NWC is entered as an end-of-year level; the model uses the year-on-year change.
- The overlay refuses to run until you confirm the baseline forecast does not already embed these savings.

### Persistence policy

The default is **none**: no benefit is valued after year N. The alternative, **perpetuity**, grows year-N incremental NOPAT at the model terminal growth rate, applies the same reinvestment rule, and is only available once you confirm that ongoing AI operating cost and reinvestment are already inside the year-N figures. The chosen policy is stated in every export.

### "What must AI deliver?"

Solves for the flat annual realized labour benefit that would close a stated enterprise-value gap, bounded above by the largest eligible labour cost base in the plan. If the required benefit exceeds that base, the app says a labour-only route cannot get there rather than returning an impossible number. The flat-ramp assumption is stated with the answer.

---

## 10. Break my thesis (`domain/finance/challenge.ts`)

The thesis under test is: modeled enterprise value is at least the target enterprise value, with all inputs frozen.

Single-variable thresholds walk one assumption in the direction that hurts and report the nearest crossing, with the inputs held fixed listed alongside. The four possible outcomes are:

- **already_broken** — the thesis fails before any stress is applied. The existing shortfall is shown first, before any threshold.
- **threshold_found** — the crossing value, the change from baseline, and any further crossings if the relationship is not monotonic.
- **no_break_in_range** — reported with the exact words **"No break within tested range"**. Never "safe". No crossing inside a tested range is not evidence of robustness outside it.
- **unsupported** — the model rejects the baseline or the bound sits on the wrong side of it.

Two-variable stress evaluates an explicit grid of combinations. Sensitivity ranking measures the enterprise-value swing across a disclosed perturbation range and is presented as exactly that: a swing over ranges chosen here, not a causal importance measure.

**There is no probability, no confidence interval and no Monte Carlo anywhere in this release**, because none was specified and inventing a distribution would be inventing information.

Correct no-root and already-broken reporting is acceptance criterion **P-F06**.

---

## 11. Reconciliation and materiality (`domain/intake/reconcile.ts`)

The default materiality tolerance for every check is **the greater of $1 and 0.1% of the larger absolute amount being compared**. It is adjustable on the review screen and the value in force is shown there and in every export.

Checks run on import and on every review:

| Check | Test |
| --- | --- |
| Balance sheet | assets = liabilities + equity |
| Cash flow roll-forward | closing cash - opening cash = operating + investing + financing + FX and other |
| Fiscal date coherence | period end dates increase year on year; period start before period end; annual periods span roughly twelve months; no future period end |
| Required baseline metrics | present, or explicitly confirmed as a true zero |
| Scope constraints | baseline revenue and baseline EBIT are positive |

A check outside tolerance blocks the affected model and names the difference and the tolerance. It can be overridden, but the override is recorded with your reason and appears in the export.

---

## 12. Provenance (`domain/intake/facts.ts`)

Every imported number keeps its raw value, unit, scale, multiplier, normalized USD value, statement type, period start and end, filing date, source URL, source locator, review status, conversion notes, a content hash and its original row number. The review screen shows the original next to the normalized figure, and the provenance CSV exports all of it. That is acceptance criterion **P-F01**.

Where a restated figure supersedes an earlier one for the same company, metric and fiscal year, the later filing is selected and the earlier record is retained as superseded rather than deleted.

Every assumption in the rail carries a basis badge: **reported** (from an imported fact), **derived** (computed from imported facts) or **assumed** (entered by you). The badge appears in the Markdown export too.

---

## 13. Precision and rounding

`decimal.js` is configured with 40 significant digits and half-even rounding in `domain/finance/decimal.ts`. All engine arithmetic uses it. Numbers are converted to JavaScript floats only at the display boundary and in the grid, where the output is a colour and a label rather than an accounting figure. The cash-flow CSV exports full-precision decimal strings, not rounded display values.

---

## 14. What this model cannot tell you

- What the market actually expects. It can only tell you which assumption combinations are arithmetically consistent with a price you supplied.
- Whether an assumption is reasonable. Every judgement in the model is yours.
- Anything about capital structure dynamics, dilution over time, option exercise, acquisitions, or segment mix.
- Anything at all with a probability attached to it.

This is an educational strategy-analysis tool. It is not investment advice, it does not execute trades, and no professional finance review has taken place.
