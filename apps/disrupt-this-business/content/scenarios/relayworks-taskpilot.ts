/**
 * Seed scenario: "Seats versus outcomes".
 *
 * EVERY NUMBER IN THIS FILE IS A FICTIONAL DESIGN ASSUMPTION.
 * RelayWorks and TaskPilot are invented scenario labels, not real companies.
 * Traits are dimensionless parameters bounded to [0,1]; a reliability of 0.90 is
 * a preference proxy, not a claim that 90% of real tasks succeed.
 *
 * This file is the single place to edit scenario parameters. Bump `version`
 * whenever a parameter changes so exported runs stay traceable.
 */
import { ScenarioSchema, type Scenario } from "@/domain/schema";

const scenario: Scenario = {
  id: "seats-vs-outcomes",
  version: "1.0.0",
  title: "Seats versus outcomes",
  premise:
    "RelayWorks sells project-management seats to 1,000 teams. TaskPilot sells completed work bundles priced against the same annual budget. Four quarters decide who holds the customer relationship.",
  assumptionNotice:
    "Fictional design assumptions. These companies, prices, costs and events were invented for this exercise and are not measurements of any real market.",
  totalRounds: 4,
  priceFloorShare: 0.5,
  outsideUtility: 0.2,
  choiceTemperature: 0.2,

  segments: [
    {
      id: "small",
      label: "Small teams",
      size: 800,
      weights: {
        reliability: 0.2,
        automation: 0.4,
        integration: 0.1,
        reach: 0.1,
        price: 0.2,
      },
      referencePrice: 2400,
      relationshipBonus: 0.08,
      reconsiderationRate: 0.2,
    },
    {
      id: "enterprise",
      label: "Enterprise teams",
      size: 200,
      weights: {
        reliability: 0.35,
        automation: 0.15,
        integration: 0.3,
        reach: 0.05,
        price: 0.15,
      },
      referencePrice: 24000,
      relationshipBonus: 0.18,
      reconsiderationRate: 0.08,
    },
  ],

  companies: {
    incumbent: {
      role: "incumbent",
      name: "RelayWorks",
      proposition: "Project-management seats, sold per team per year.",
      cash: 3_000_000,
      prices: { small: 2400, enterprise: 24000 },
      variableCost: { small: 120, enterprise: 1200 },
      fixedCost: 350_000,
      traits: {
        reliability: 0.9,
        automation: 0.25,
        integration: 0.85,
        reach: 0.8,
      },
      capacityPerQuarter: 3,
      initialCustomers: { small: 400, enterprise: 120 },
      outcomeBundlesApplied: false,
    },
    challenger: {
      role: "challenger",
      name: "TaskPilot",
      proposition:
        "Completed work bundles, quoted as a fixed annual amount at the segment's assumed usage.",
      cash: 1_000_000,
      prices: { small: 1800, enterprise: 18000 },
      variableCost: { small: 150, enterprise: 1500 },
      fixedCost: 180_000,
      traits: {
        reliability: 0.7,
        automation: 0.8,
        integration: 0.3,
        reach: 0.25,
      },
      capacityPerQuarter: 2,
      initialCustomers: { small: 80, enterprise: 5 },
      outcomeBundlesApplied: true,
    },
  },

  // Catalog order is load-bearing: it is the opponent's final tie-break.
  actions: [
    {
      id: "improve-reliability",
      label: "Improve reliability",
      summary: "Reliability +0.08, capped at 1.",
      cash: 150_000,
      effort: 1,
      delay: 1,
      uncertainty:
        "The trait gain is a fixed scenario assumption, not an engineering estimate. It cannot push reliability above 1.",
      formulaIds: ["P-TRAITS", "F-UTIL"],
    },
    {
      id: "enterprise-integrations",
      label: "Build enterprise integrations",
      summary: "Integration +0.15, capped at 1.",
      cash: 200_000,
      effort: 2,
      delay: 1,
      uncertainty:
        "Integration weighs three times as much for enterprise teams as for small teams, so the payoff depends on where your customers are.",
      formulaIds: ["P-TRAITS", "P-WEIGHTS", "F-UTIL"],
    },
    {
      id: "autonomous-delivery",
      label: "Develop autonomous delivery",
      summary:
        "Automation +0.25, reliability -0.05, variable cost +15%. Two quarters of effort.",
      cash: 300_000,
      effort: 2,
      delay: 2,
      uncertainty:
        "Two quarters of capacity are locked before anything activates, and the reliability cost lands at the same time as the automation gain.",
      formulaIds: ["P-TRAITS", "P-VARCOST", "F-UTIL"],
    },
    {
      id: "expand-distribution",
      label: "Expand distribution",
      summary: "Reach +0.15, capped at 1.",
      cash: 150_000,
      effort: 1,
      delay: 1,
      uncertainty:
        "Reach carries a 0.10 weight for small teams and only 0.05 for enterprise teams.",
      formulaIds: ["P-TRAITS", "P-WEIGHTS", "F-UTIL"],
    },
    {
      id: "reduce-price",
      label: "Reduce price",
      summary: "Both segment prices fall 15% from their current values.",
      cash: 0,
      effort: 0,
      delay: 0,
      uncertainty:
        "Revenue per customer falls this quarter while the customer response only shows up in the allocation step.",
      formulaIds: ["P-PRICEFLOOR", "F-UTIL", "F-REV"],
    },
    {
      id: "outcome-bundles",
      label: "Change to outcome bundles",
      summary:
        "Prices reset to 80% of original, automation +0.10, enterprise integration -0.05.",
      cash: 100_000,
      effort: 1,
      delay: 1,
      uncertainty:
        "A one-way repricing. It resets prices to 80% of the original list, which can be an increase if you have already discounted below that.",
      formulaIds: ["P-PRICEFLOOR", "P-TRAITS", "F-UTIL"],
    },
    {
      id: "commission-research",
      label: "Commission customer research",
      summary: "Reveals next quarter's scheduled environment change.",
      cash: 50_000,
      effort: 0,
      delay: 0,
      uncertainty:
        "Research is the round's primary commitment, so it costs you the quarter's only build. It carries no financial bonus.",
      formulaIds: ["P-EVENTS"],
    },
    {
      id: "hold",
      label: "Hold and preserve cash",
      summary: "No change. Unspent cash stays cash.",
      cash: 0,
      effort: 0,
      delay: 0,
      uncertainty: "None. This is the reference case every other move is measured against.",
      formulaIds: [],
    },
  ],

  environments: [
    {
      id: "foundation",
      label: "Foundation",
      description:
        "Segment weights, costs and the outside option stay unchanged for all four quarters. Use this to read the economics without interference.",
      disclosedEvents: [],
      schedule: [],
    },
    {
      id: "reliability-shock",
      label: "Reliability shock",
      description:
        "At some point in the game, a publicised failure moves 0.10 of buying weight from automation to reliability in both segments. The quarter is hidden until it is revealed or researched.",
      disclosedEvents: [
        "Weight shift of 0.10 from automation to reliability in both segments.",
      ],
      schedule: [
        {
          id: "reliability-shock-q2",
          quarter: 2,
          headline: "Publicised automation failure",
          detail:
            "Both segments move 0.10 of buying weight from automation to reliability. The shift persists for the rest of the game and is never applied twice.",
          effect: {
            kind: "segment-weight-transfer",
            from: "automation",
            to: "reliability",
            amount: 0.1,
          },
        },
      ],
    },
    {
      id: "commodity-models",
      label: "Commodity models",
      description:
        "At some point in the game, cheap general models cut both companies' delivery costs by 20% and make the outside option more attractive. The quarter is hidden until it is revealed or researched.",
      disclosedEvents: [
        "Both companies' variable costs fall 20%.",
        "Outside-option utility rises from 0.20 to 0.30.",
      ],
      schedule: [
        {
          id: "commodity-models-q3",
          quarter: 3,
          headline: "Cheap general models arrive",
          detail:
            "Variable costs fall 20% for both companies and outside-option utility rises to 0.30. Applied once and then held.",
          effect: {
            kind: "commoditisation",
            variableCostMultiplier: 0.8,
            outsideUtility: 0.3,
          },
        },
      ],
    },
  ],
};

export const relayWorksTaskPilot: Scenario = ScenarioSchema.parse(scenario);
