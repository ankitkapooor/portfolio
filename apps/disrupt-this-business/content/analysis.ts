/**
 * The illustrative draft analysis.
 *
 * Honesty rules that govern this file:
 *  - it is labelled a DRAFT written by the implementation agent, not by Ankit;
 *  - it invents no playtest, no user research and no real-company prediction;
 *  - every number it quotes is computed here, at render time, by running the
 *    real engine over a fixed action script, so it can never drift from the
 *    model and anyone can reproduce it by playing the same sequence.
 */
import type { ActionId, GameRun } from "@/domain/schema";
import { commitRound, createRun } from "@/domain/run";
import { defaultScenario } from "@/content/scenarios";

export const ANALYSIS_STATUS = "draft" as const;

export interface ReferenceRun {
  id: string;
  title: string;
  premise: string;
  script: ActionId[];
  run: GameRun;
}

function buildRun(id: string, script: ActionId[]): GameRun {
  let run = createRun({
    id,
    createdAt: "2026-01-01T00:00:00.000Z",
    role: "incumbent",
    environmentId: "reliability-shock",
    scenarioId: defaultScenario.id,
    label: id,
  });
  for (const action of script) {
    run = commitRound(run, action, "");
  }
  return run;
}

/**
 * Two complete runs of the incumbent under the reliability-shock preset,
 * identical except for the opening commitment.
 */
export function referenceRuns(): ReferenceRun[] {
  const integrationFirst: ActionId[] = [
    "enterprise-integrations",
    "improve-reliability",
    "hold",
    "hold",
  ];
  const priceFirst: ActionId[] = ["reduce-price", "reduce-price", "hold", "hold"];

  return [
    {
      id: "ref-defend-the-enterprise",
      title: "Defend the enterprise base",
      premise:
        "Spend the first two quarters on integration and reliability, the two traits enterprise buyers weight most heavily, and hold cash afterwards.",
      script: integrationFirst,
      run: buildRun("ref-defend-the-enterprise", integrationFirst),
    },
    {
      id: "ref-cut-price-twice",
      title: "Cut price twice",
      premise:
        "Answer the challenger on price in both opening quarters, spending no cash and reserving no delivery capacity.",
      script: priceFirst,
      run: buildRun("ref-cut-price-twice", priceFirst),
    },
  ];
}

export interface AnalysisSection {
  heading: string;
  paragraphs: string[];
}

export function analysisSections(runs: ReferenceRun[]): AnalysisSection[] {
  const [defend, cut] = runs;
  const defendEnd = defend.run.state.companies.incumbent;
  const cutEnd = cut.run.state.companies.incumbent;
  const defendCash = defendEnd.cash;
  const cutCash = cutEnd.cash;
  const defendEnterprise = defend.run.state.customers.enterprise.incumbent;
  const cutEnterprise = cut.run.state.customers.enterprise.incumbent;
  const defendSmall = defend.run.state.customers.small.incumbent;
  const cutSmall = cut.run.state.customers.small.incumbent;

  const usd = (value: number) =>
    `${value < 0 ? "-" : ""}$${Math.abs(Math.round(value)).toLocaleString("en-US")}`;

  return [
    {
      heading: "Thesis",
      paragraphs: [
        "Inside this scenario, the incumbent's defensible asset is the enterprise relationship, not the price point. Enterprise teams reconsider at 8% a quarter against 20% for small teams, and their relationship bonus is 0.18 against 0.08. That combination means an enterprise position erodes slowly and, once lost, returns slowly. Price is the opposite: it is free to change, immediately visible to every cohort, and permanently reduces revenue per retained customer.",
        "So the interesting question this scenario poses is not \"can the incumbent survive?\" but \"which of the incumbent's two clocks runs out first: the cash clock or the differentiation clock?\"",
      ],
    },
    {
      heading: "What the two reference runs show",
      paragraphs: [
        `Both runs play the incumbent through the reliability-shock preset for four quarters, with the rules-based opponent recomputing its policy each quarter. They differ only in the opening two commitments. Run ${defend.id} ends on ${usd(
          defendCash,
        )} of cash with ${defendEnterprise.toFixed(1)} enterprise teams and ${defendSmall.toFixed(
          1,
        )} small teams. Run ${cut.id} ends on ${usd(cutCash)} with ${cutEnterprise.toFixed(
          1,
        )} enterprise teams and ${cutSmall.toFixed(1)} small teams.`,
        `The gap of ${usd(
          Math.abs(defendCash - cutCash),
        )} is not the interesting part, because four quarters is far too short for either strategy to compound. The interesting part is the shape: the price cut is free at the moment of commitment and expensive in every subsequent quarter's revenue line, while the integration build is expensive at the moment of commitment and does nothing at all until it activates the following quarter.`,
      ],
    },
    {
      heading: "The alternative I rejected, and why",
      paragraphs: [
        "The obvious third option for the incumbent is to answer the challenger on its own ground: buy autonomous delivery, close the automation gap, and compete on the trait small teams weight at 0.40. I rejected it as an opening move in this scenario, and the reason is timing rather than merit.",
        "Autonomous delivery costs $300,000, reserves both of a two-quarter build, and activates in quarter three. In a four-quarter game that leaves one quarter of benefit. It also carries a reliability penalty of 0.05 and a 15% variable cost increase, which land at the same moment as the automation gain. Under the reliability-shock preset, where buying weight moves toward reliability, those two effects partly cancel. That is a judgement about this parameter set and this horizon, not a general claim that incumbents should not automate.",
      ],
    },
    {
      heading: "Where this reasoning is weakest",
      paragraphs: [
        "The conclusion is downstream of three modelling choices that were made for legibility rather than realism. Demand is fixed, so no strategy can grow the market. Four quarters is short enough that any two-quarter build is structurally disadvantaged. And the opponent is a greedy two-quarter cash maximiser that assumes you hold, which makes aggressive incumbent moves look safer than they would against a responsive competitor.",
        "Change the horizon to twelve quarters and the ranking of these two strategies could plausibly invert, because the integration build keeps paying and the price cut keeps costing. I have not run that comparison, and the current build cannot: the round count is a scenario parameter, but nothing in this analysis has been tested at other values.",
      ],
    },
    {
      heading: "What would change my mind",
      paragraphs: [
        "Three specific results would overturn the thesis above. First, if the price-cut run beat the integration run on ending cash and enterprise retention across all three environment presets, then the relationship bonus is not doing the work I claim it is. Second, if raising the enterprise reconsideration rate from 8% to something nearer the small-team rate left the ordering unchanged, then my argument is really about weights, not about switching speed. Third, if lengthening the game made no difference to the ranking, then the timing argument against autonomous delivery is wrong.",
        "Each of those is a parameter edit and a re-run, not an opinion. That is the point of writing the analysis against a deterministic engine.",
      ],
    },
  ];
}
