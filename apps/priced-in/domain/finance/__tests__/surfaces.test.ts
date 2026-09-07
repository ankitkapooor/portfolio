import { describe, expect, it } from "vitest";
import {
  computeSensitivity,
  computeStressGrid,
  findBreakThreshold,
  type ThesisContext,
} from "../challenge";
import { computeGrid } from "../grid";
import { computeOperatingBridge } from "../operating";
import { withConstantGrowth, withTargetMargin } from "../scenario";
import { computeValuation } from "../valuation";
import { expectNumberWithin, expectUsdWithin, integrationBaseline, integrationForecast, integrationTerminal } from "./helpers";
import { num } from "../decimal";

const M = 1_000_000;

function thesis(targetEvUsd: number): ThesisContext {
  return {
    baseline: integrationBaseline(),
    forecast: integrationForecast(),
    terminal: integrationTerminal(),
    targetEvUsd,
    initiative: null,
    includeInitiative: false,
    initiativeDelayYears: 0,
  };
}

describe("P-F03: expectations map", () => {
  const request = {
    baseline: integrationBaseline(),
    forecast: integrationForecast(),
    terminal: integrationTerminal(),
    targetEvUsd: 100 * M,
    growthMin: -0.05,
    growthMax: 0.3,
    marginMin: 0.05,
    marginMax: 0.4,
    steps: 41,
  };
  const grid = computeGrid(request);

  it("evaluates a 41 by 41 grid", () => {
    expect(grid.cells).toHaveLength(41 * 41);
    expect(grid.growthAxis[0]).toBeCloseTo(-0.05, 12);
    expect(grid.growthAxis[40]).toBeCloseTo(0.3, 12);
    expect(grid.marginAxis[0]).toBeCloseTo(0.05, 12);
    expect(grid.marginAxis[40]).toBeCloseTo(0.4, 12);
  });

  it("matches a standalone DCF for a selected cell", () => {
    const marginIndex = 20;
    const growthIndex = 13;
    const cell = grid.cells[marginIndex * 41 + growthIndex];
    const standalone = computeValuation({
      baseline: request.baseline,
      forecast: withConstantGrowth(withTargetMargin(request.forecast, cell.margin), cell.growth),
      terminal: request.terminal,
    });
    expect(standalone.ok).toBe(true);
    if (!standalone.ok) return;
    expectUsdWithin(num(cell.enterpriseValueUsd ?? 0), standalone.value.enterpriseValue.toNumber(), 0.01);
  });

  it("counts cells inside the plus or minus one percent near-target band", () => {
    const inBand = grid.cells.filter((cell) => cell.percentGap !== null && Math.abs(cell.percentGap) <= 0.01);
    expect(grid.nearTargetCount).toBe(inBand.length);
    expect(grid.nearTargetCount).toBeGreaterThan(0);
  });

  it("puts the exactly on-target combination at a zero gap", () => {
    // Growth 0% with a 10% year-five margin reproduces the 100m integration fixture.
    const small = computeGrid({ ...request, growthMin: -0.05, growthMax: 0.05, marginMin: 0.05, marginMax: 0.15, steps: 3 });
    const centre = small.cells[1 * 3 + 1];
    expect(centre.growth).toBeCloseTo(0, 12);
    expect(centre.margin).toBeCloseTo(0.1, 12);
    expectUsdWithin(num(centre.enterpriseValueUsd ?? 0), 100 * M, 0.01);
    expectNumberWithin(centre.percentGap ?? 1, 0, 1e-9);
  });

  it("labels unsupported cells instead of colouring an invalid number", () => {
    const withNegativeMargins = computeGrid({ ...request, marginMin: -0.05, steps: 21 });
    const unsupported = withNegativeMargins.cells.filter((cell) => cell.enterpriseValueUsd === null);
    expect(unsupported.length).toBeGreaterThan(0);
    expect(unsupported[0].unsupportedReason).toContain("Terminal NOPAT must be positive");
    expect(unsupported[0].gapUsd).toBeNull();
  });
});

describe("P-F04: operating bridge unavailable states", () => {
  const revenues = [100 * M, 100 * M];

  it("shows unavailable when the driver is not supplied", () => {
    const result = computeOperatingBridge(
      revenues,
      {
        template: "customers",
        annualRevenuePerCustomerUsd: [null, null],
        averageRealizedPriceUsd: [null, null],
        marketRevenueUsd: [null, null],
        marketDefinition: "",
        marketAsOf: [null, null],
      },
      ["2026-12-31", "2027-12-31"],
    );
    expect(result[0].requiredDriver.available).toBe(false);
    expect(result[0].requiredMarketShare.available).toBe(false);
  });

  it("divides forecast revenue by the supplied revenue per customer", () => {
    const result = computeOperatingBridge(
      revenues,
      {
        template: "customers",
        annualRevenuePerCustomerUsd: [1 * M, 1 * M],
        averageRealizedPriceUsd: [null, null],
        marketRevenueUsd: [null, null],
        marketDefinition: "",
        marketAsOf: [null, null],
      },
      ["2026-12-31", "2027-12-31"],
    );
    expect(result[0].requiredDriver).toEqual({ available: true, value: 100, label: "customers" });
  });

  it("flags a required share above the whole market instead of clipping it", () => {
    const result = computeOperatingBridge(
      revenues,
      {
        template: "customers",
        annualRevenuePerCustomerUsd: [1 * M, 1 * M],
        averageRealizedPriceUsd: [null, null],
        marketRevenueUsd: [50 * M, 50 * M],
        marketDefinition: "Regional freight brokerage",
        marketAsOf: ["2026-12-31", "2027-12-31"],
      },
      ["2026-12-31", "2027-12-31"],
    );
    expect(result[0].requiredMarketShare).toEqual({
      available: true,
      share: 2,
      exceedsMarket: true,
      marketAsOf: "2026-12-31",
    });
  });

  it("refuses to compare a market size dated in a different year", () => {
    const result = computeOperatingBridge(
      revenues,
      {
        template: "customers",
        annualRevenuePerCustomerUsd: [1 * M, 1 * M],
        averageRealizedPriceUsd: [null, null],
        marketRevenueUsd: [50 * M, 50 * M],
        marketDefinition: "Regional freight brokerage",
        marketAsOf: ["2024-12-31", "2024-12-31"],
      },
      ["2026-12-31", "2027-12-31"],
    );
    const share = result[0].requiredMarketShare;
    expect(share.available).toBe(false);
    if (share.available) return;
    expect(share.reason).toContain("Dates must match");
  });
});

describe("P-F06: break thresholds", () => {
  it("reports the existing shortfall when the thesis already fails", () => {
    const result = findBreakThreshold(thesis(200 * M), { variable: "growth", adverseBound: -0.05 });
    expect(result.status).toBe("already_broken");
    if (result.status !== "already_broken") return;
    // Modeled EV is 100m against a 200m target.
    expectNumberWithin(result.shortfallUsd, 100 * M, 1);
    expect(result.message).toContain("already fails");
  });

  it("says no break within tested range rather than safe", () => {
    const result = findBreakThreshold(thesis(10 * M), { variable: "growth", adverseBound: -0.05 });
    expect(result.status).toBe("no_break_in_range");
    if (result.status !== "no_break_in_range") return;
    expect(result.message).toBe("No break within tested range");
  });

  it("finds the growth threshold and lists the inputs held fixed", () => {
    const result = findBreakThreshold(thesis(100 * M), { variable: "growth", adverseBound: -0.05 });
    expect(result.status).toBe("threshold_found");
    if (result.status !== "threshold_found") return;
    // The fixture is exactly on target at 0% growth, so any reduction breaks it.
    expectNumberWithin(result.thresholdValue, 0, 1e-3);
    expect(result.unit).toBe("decimal rate");
    expect(Object.keys(result.heldFixed)).toContain("wacc");
    expect(Object.keys(result.heldFixed)).toContain("targetMargin");
  });

  it("finds the WACC at which a comfortable thesis breaks", () => {
    const result = findBreakThreshold(thesis(80 * M), { variable: "wacc", adverseBound: 0.25 });
    expect(result.status).toBe("threshold_found");
    if (result.status !== "threshold_found") return;
    expect(result.thresholdValue).toBeGreaterThan(0.1);
    expect(result.changeFromBaseline).toBeGreaterThan(0);
  });

  it("refuses a bound on the wrong side of the baseline", () => {
    const result = findBreakThreshold(thesis(100 * M), { variable: "growth", adverseBound: 0.2 });
    expect(result.status).toBe("unsupported");
  });
});

describe("two-variable stress and sensitivity", () => {
  it("marks each cell as holding or failing without any probability", () => {
    const result = computeStressGrid(thesis(100 * M), "growth", [-0.02, 0, 0.02], "targetMargin", [0.08, 0.1, 0.12]);
    expect(result.cells).toHaveLength(9);
    const centre = result.cells.find((cell) => cell.x === 0 && cell.y === 0.1);
    expect(centre?.holds).toBe(true);
    const weak = result.cells.find((cell) => cell.x === -0.02 && cell.y === 0.08);
    expect(weak?.holds).toBe(false);
  });

  it("ranks variables by the enterprise-value swing over the disclosed range", () => {
    const ranked = computeSensitivity(thesis(100 * M), [
      { variable: "targetMargin", low: 0.08, high: 0.12 },
      { variable: "wacc", low: 0.09, high: 0.11 },
    ]);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].swingUsd).not.toBeNull();
    expect((ranked[0].swingUsd ?? 0) >= (ranked[1].swingUsd ?? 0)).toBe(true);
  });
});
