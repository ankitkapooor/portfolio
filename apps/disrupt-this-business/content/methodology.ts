/**
 * The documented formula and parameter catalog.
 *
 * Every `formulaIds` entry the engine attaches to a ledger line resolves to an
 * id here, which is how "every result links to a parameter or formula" is kept
 * true rather than aspirational.
 */
export interface FormulaEntry {
  id: string;
  title: string;
  statement: string;
  note?: string;
}

export const formulas: FormulaEntry[] = [
  {
    id: "F-UTIL",
    title: "Option utility",
    statement:
      "utility(j) = w_reliability x reliability(j) + w_automation x automation(j) + w_integration x integration(j) + w_reach x reach(j) - w_price x annualPrice(j) / referencePrice, plus the segment relationship bonus when j is the cohort's current supplier.",
    note: "The outside option uses a fixed utility value and never receives a relationship bonus.",
  },
  {
    id: "F-SOFTMAX",
    title: "Choice probability",
    statement:
      "share(j) = exp((utility(j) - maxUtility) / temperature) / sum over options of the same expression. The maximum logit is subtracted before exponentiating so the arithmetic stays stable.",
  },
  {
    id: "F-ALLOC",
    title: "Cohort reallocation",
    statement:
      "For each segment and each origin cohort (incumbent, challenger, outside): retain (1 - reconsiderationRate) x cohort, and distribute reconsiderationRate x cohort across all three options using F-SOFTMAX. Segment totals are conserved. No customers are added afterwards.",
  },
  {
    id: "F-REV",
    title: "Quarterly revenue",
    statement: "revenue = ending active customers x annual team price / 4.",
    note: "A disclosed simplifying convention. Contracts, ramp, churn timing and partial-quarter recognition are not modelled.",
  },
  {
    id: "F-VC",
    title: "Quarterly variable cost",
    statement:
      "variableCost = sum over segments of ending active customers x variable cost per customer per quarter.",
  },
  {
    id: "F-OCF",
    title: "Operating cash flow",
    statement: "operatingCashFlow = revenue - variableCost - fixedCost.",
    note: "This is not EBITDA and not audited profit. It is a simplified cash measure for the exercise.",
  },
  {
    id: "F-CASH",
    title: "Ending cash",
    statement:
      "endingCash = openingCash - investmentOutlays + operatingCashFlow. Investments are one-off cash outlays, never recurring expenses.",
  },
  {
    id: "P-SEGMENTS",
    title: "Segments and reconsideration",
    statement:
      "800 small teams and 200 enterprise teams. 20% of each small-team cohort and 8% of each enterprise cohort reconsider their supplier per quarter. Relationship bonus 0.08 for small teams and 0.18 for enterprise teams. Outside utility 0.20. Choice temperature 0.20.",
  },
  {
    id: "P-WEIGHTS",
    title: "Segment buying weights",
    statement:
      "Small teams: reliability 0.20, automation 0.40, integration 0.10, reach 0.10, price penalty 0.20, reference price $2,400. Enterprise teams: reliability 0.35, automation 0.15, integration 0.30, reach 0.05, price penalty 0.15, reference price $24,000.",
  },
  {
    id: "P-TRAITS",
    title: "Trait bounds",
    statement:
      "Reliability, automation, integration and reach are dimensionless scenario parameters clamped to [0,1]. They are preference proxies, not measurements.",
  },
  {
    id: "P-PRICEFLOOR",
    title: "Price floor",
    statement:
      "No price may fall below 50% of the role's original list price. A price cut that would breach the floor is held at the floor, and the cut becomes unavailable once both segments sit on it.",
  },
  {
    id: "P-VARCOST",
    title: "Variable cost changes",
    statement:
      "Autonomous delivery raises variable cost 15% at activation. The commodity-models event cuts both companies' variable costs 20%, once.",
  },
  {
    id: "P-TIMING",
    title: "Activation and effort",
    statement:
      "A commitment with a one-quarter delay reserves effort in the quarter it is made and activates at the start of the next quarter. A two-quarter project reserves effort in two consecutive quarters and activates in the third. Capacity does not carry over, and a commitment that cannot reserve future effort is rejected. Projects due after the final quarter stay in the ledger as committed work with no terminal benefit.",
  },
  {
    id: "P-EVENTS",
    title: "Environment events",
    statement:
      "Each preset schedules at most one event. It is revealed and applied exactly once, at the start of the quarter it fires, before either side chooses. The effect then persists and is never re-applied. Research bought in a quarter reveals the next quarter's scheduled change.",
  },
  {
    id: "P-INSOLVENCY",
    title: "Funding required",
    statement:
      "Negative ending cash is marked as funding required. There is no automatic financing. Paid commitments are then blocked; price changes and hold remain available.",
  },
];

export const formulaIndex: Record<string, FormulaEntry> = Object.fromEntries(
  formulas.map((f) => [f.id, f]),
);

export const modelLimitations: string[] = [
  "Every company, price, cost, trait and event in this exercise is a fictional design assumption. None of it is a measurement of a real market or a prediction about a real company.",
  "Demand is fixed. There are 1,000 teams for all four quarters, so nobody can win by growing the market.",
  "Revenue is recognised as ending customers times annual price divided by four. Contracts, ramp-up, billing terms and partial-quarter recognition do not exist here.",
  "Customer choice is a softmax over four trait terms and one price term. Real buying behaviour has switching costs, procurement cycles, brand and channel effects that this model does not represent.",
  "Traits are single numbers on a [0,1] scale. A reliability of 0.90 is a preference weight, not a claim that 90% of tasks succeed.",
  "There is no financing, no hiring, no acquisitions, no product portfolio and no free-text strategy. One commitment per quarter, from a fixed catalog of eight.",
  "The opponent is a two-quarter greedy cash maximiser that assumes you hold. It is deliberately simple and is easy to out-think; beating it is not evidence of a good strategy.",
  "Four quarters is far too short for most of these investments to compound. Read the ordering of outcomes, not the magnitudes.",
  "No playtest data, usage statistics or user research informs any number here.",
];
