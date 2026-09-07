import { describe, expect, it } from "vitest";
import {
  createInitialState,
  prepareRound,
  publicSnapshot,
  resolveRound,
} from "@/domain/engine";
import { chooseOpponentAction } from "@/domain/opponent";
import { defaultScenario, getEnvironment } from "@/content/scenarios";
import type { Environment } from "@/domain/schema";

const foundation = getEnvironment(defaultScenario, "foundation");
const reliabilityShock = getEnvironment(defaultScenario, "reliability-shock");

function preparedQuarterOne(environment: Environment) {
  return prepareRound(
    createInitialState(defaultScenario, environment),
    environment,
  ).state;
}

describe("opponent policy", () => {
  it("returns a legal catalog action with a forecast for every legal option", () => {
    const decision = chooseOpponentAction(preparedQuarterOne(foundation), "challenger");

    expect(defaultScenario.actions.map((a) => a.id)).toContain(decision.actionId);
    expect(decision.candidates.map((c) => c.actionId)).toEqual(
      defaultScenario.actions.map((a) => a.id),
    );
    for (const candidate of decision.candidates) {
      if (candidate.legal) {
        expect(candidate.forecastCash).not.toBeNull();
      } else {
        expect(candidate.reason).toBeTruthy();
      }
    }
  });

  it("maximises forecast ending cash among the options it considered", () => {
    const decision = chooseOpponentAction(preparedQuarterOne(foundation), "incumbent");
    const chosen = decision.candidates.find((c) => c.actionId === decision.actionId);
    expect(chosen?.forecastCash).toBeTypeOf("number");
    for (const candidate of decision.candidates) {
      if (!candidate.legal || candidate.forecastCash === null) continue;
      expect(chosen!.forecastCash!).toBeGreaterThanOrEqual(
        candidate.forecastCash - 1e-6,
      );
    }
  });

  it("clips the look-ahead to the quarters that remain", () => {
    let state = createInitialState(defaultScenario, foundation);
    for (let q = 1; q <= 3; q += 1) {
      const prepared = prepareRound(state, foundation).state;
      state = resolveRound(
        prepared,
        { role: "incumbent", actionId: "hold" },
        { role: "challenger", actionId: "hold" },
      ).nextState;
    }
    const preparedQ4 = prepareRound(state, foundation).state;
    expect(chooseOpponentAction(preparedQ4, "challenger").quartersForecast).toBe(1);
    expect(chooseOpponentAction(preparedQuarterOne(foundation), "challenger")
      .quartersForecast).toBe(2);
  });

  it("cannot read the research preview or purchased research", () => {
    const prepared = preparedQuarterOne(reliabilityShock);
    prepared.researchNotes.challenger = [
      {
        purchasedInQuarter: 1,
        aboutQuarter: 2,
        headline: "secret-research-marker",
        detail: "secret-research-marker",
      },
    ];
    const snapshot = publicSnapshot(prepared);
    expect(JSON.stringify(snapshot)).not.toContain("secret-research-marker");
    expect(snapshot.nextQuarterPreview.headline).toBe("Not visible");
  });

  it("chooses the same move whether or not a hidden future event exists", () => {
    // Two presets that differ only in an event scheduled for the NEXT quarter.
    // Its description reaches the prepared state as the research preview, so a
    // leaky opponent would notice. This one must not.
    const withoutFutureEvent: Environment = { ...foundation, schedule: [] };
    const withFutureEvent: Environment = {
      ...foundation,
      schedule: [
        {
          id: "hidden-next-quarter-event",
          quarter: 2,
          headline: "Hidden shock",
          detail: "Hidden shock",
          effect: {
            kind: "commoditisation",
            variableCostMultiplier: 0.2,
            outsideUtility: 0.05,
          },
        },
      ],
    };

    const blind = preparedQuarterOne(withoutFutureEvent);
    const leaky = preparedQuarterOne(withFutureEvent);
    expect(blind.nextQuarterPreview.headline).not.toBe(
      leaky.nextQuarterPreview.headline,
    );

    expect(chooseOpponentAction(blind, "challenger").actionId).toBe(
      chooseOpponentAction(leaky, "challenger").actionId,
    );
    expect(chooseOpponentAction(blind, "incumbent").actionId).toBe(
      chooseOpponentAction(leaky, "incumbent").actionId,
    );
  });

  it("is deterministic", () => {
    const prepared = preparedQuarterOne(foundation);
    expect(chooseOpponentAction(prepared, "challenger")).toEqual(
      chooseOpponentAction(prepared, "challenger"),
    );
  });
});
