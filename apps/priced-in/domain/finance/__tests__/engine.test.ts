import { describe, expect, it } from "vitest";
import { num } from "../decimal";
import { projectYears } from "../forecast";
import { computeInitiative, type InitiativeInputs, type InitiativeYearInputs } from "../initiative";
import { solveForGrowth } from "../reverse";
import { terminalValue } from "../terminal";
import { computeValuation, equityBridge, marketEnterpriseValue } from "../valuation";
import type { Baseline, ForecastAssumptions, TerminalAssumptions } from "../types";
import {
  expectNumberWithin,
  expectUsdWithin,
  integrationBaseline,
  integrationForecast,
  integrationTerminal,
} from "./helpers";

const M = 1_000_000;

function flatForecast(overrides: Partial<ForecastAssumptions> = {}): ForecastAssumptions {
  return {
    years: 5,
    growthRates: [0, 0, 0, 0, 0],
    startingMargin: 0.1,
    targetMargin: 0.1,
    taxRate: 0,
    daRatios: [0.03, 0.03, 0.03, 0.03, 0.03],
    capexRatios: [0.03, 0.03, 0.03, 0.03, 0.03],
    nwcRatios: [0, 0, 0, 0, 0],
    ...overrides,
  };
}

const flatBaseline: Baseline = { revenueUsd: 100 * M, operatingNwcUsd: 0 };

describe("terminal guards", () => {
  const supported: TerminalAssumptions = { wacc: 0.1, terminalGrowth: 0.02, terminalRoic: 0.1 };

  it("rejects WACC equal to terminal growth", () => {
    const outcome = computeValuation({
      baseline: flatBaseline,
      forecast: flatForecast(),
      terminal: { ...supported, wacc: 0.02 },
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.map((issue) => issue.code)).toContain("wacc_not_above_growth");
  });

  it("rejects WACC below terminal growth", () => {
    const outcome = terminalValue({ terminalNopatUsd: num(10 * M), growth: 0.03, terminalRoic: 0.1, wacc: 0.01 });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.map((issue) => issue.code)).toContain("wacc_not_above_growth");
  });

  it("rejects negative terminal growth", () => {
    const outcome = terminalValue({ terminalNopatUsd: num(10 * M), growth: -0.01, terminalRoic: 0.1, wacc: 0.08 });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.map((issue) => issue.code)).toContain("terminal_growth_negative");
  });

  it("rejects terminal ROIC at or below terminal growth", () => {
    const outcome = terminalValue({ terminalNopatUsd: num(10 * M), growth: 0.03, terminalRoic: 0.03, wacc: 0.08 });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.map((issue) => issue.code)).toContain("roic_not_above_growth");
  });

  it("rejects a non-positive terminal NOPAT", () => {
    const outcome = computeValuation({
      baseline: flatBaseline,
      forecast: flatForecast({ startingMargin: 0, targetMargin: 0 }),
      terminal: supported,
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.map((issue) => issue.code)).toContain("terminal_nopat_not_positive");
  });
});

describe("cash tax on a negative EBIT", () => {
  // Revenue 100m at a -10% margin gives EBIT -10m.
  // CashTax = max(-10m, 0) * 0.25 = 0, so NOPAT stays at -10m and FCFF at -10m.
  const rows = projectYears(flatBaseline, {
    years: 1,
    growthRates: [0],
    startingMargin: -0.1,
    targetMargin: -0.1,
    taxRate: 0.25,
    daRatios: [0],
    capexRatios: [0],
    nwcRatios: [0],
  });

  it("charges no tax and grants no tax benefit", () => {
    expectUsdWithin(rows[0].ebit, -10 * M);
    expectUsdWithin(rows[0].cashTax, 0);
    expectUsdWithin(rows[0].nopat, -10 * M);
    expectUsdWithin(rows[0].fcff, -10 * M);
  });
});

describe("terminal reinvestment is not double counted", () => {
  // Revenue[5] = 100m (0% growth), Revenue[6] = 102m at g = 2%.
  // NOPAT[6] = 102m * 10% * (1 - 0) = 10.2m.
  // Reinvestment = 10.2m * 0.02 / 0.10 = 2.04m, so terminal FCFF = 8.16m.
  // Capex[6] - D&A[6] would be 102m * (5% - 3%) = 2.04m. Subtracting that too
  // would wrongly give 6.12m.
  const outcome = computeValuation({
    baseline: flatBaseline,
    forecast: flatForecast({ capexRatios: [0.05, 0.05, 0.05, 0.05, 0.05] }),
    terminal: { wacc: 0.1, terminalGrowth: 0.02, terminalRoic: 0.1 },
  });

  it("subtracts reinvestment only", () => {
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expectUsdWithin(outcome.value.terminal.nopat, 10.2 * M);
    expectUsdWithin(outcome.value.terminal.reinvestment, 2.04 * M);
    expectUsdWithin(outcome.value.terminal.fcff, 8.16 * M);
    expect(outcome.value.terminal.fcff.toNumber()).not.toBeCloseTo(6.12 * M, 0);
  });

  it("values the terminal period at FCFF / (WACC - g)", () => {
    if (!outcome.ok) return;
    // 8,160,000 / (0.10 - 0.02) = 102,000,000
    expectUsdWithin(outcome.value.terminal.value, 102 * M, 0.01);
  });
});

describe("terminal discontinuity is surfaced", () => {
  // Explicit years carry a 20% capex ratio, so year-5 FCFF = 10m + 3m - 20m = -7m.
  // Terminal FCFF stays at 8.16m, a jump of 15.16m.
  const outcome = computeValuation({
    baseline: flatBaseline,
    forecast: flatForecast({ capexRatios: [0.2, 0.2, 0.2, 0.2, 0.2] }),
    terminal: { wacc: 0.1, terminalGrowth: 0.02, terminalRoic: 0.1 },
  });

  it("reports the jump from year five to the terminal period", () => {
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expectUsdWithin(outcome.value.years[4].fcff, -7 * M);
    expectUsdWithin(outcome.value.terminalJump, 15.16 * M);
    // 15,160,000 / 7,000,000
    expectNumberWithin(outcome.value.terminalJumpRatio?.toNumber() ?? 0, 2.1657142857, 1e-6);
  });
});

describe("equity bridge behaviour", () => {
  it("shows no per-share value when the share count is zero", () => {
    const bridge = equityBridge(num(100 * M), {
      excessCashUsd: 0,
      nonOperatingAssetsUsd: 0,
      financialDebtUsd: 0,
      preferredEquityUsd: 0,
      minorityInterestUsd: 0,
      dilutedShares: 0,
    });
    expectUsdWithin(bridge.equityValue, 100 * M);
    expect(bridge.valuePerShare).toBeNull();
    expect(bridge.notes.join(" ")).toContain("share count");
  });

  it("refuses to derive a market enterprise value without shares", () => {
    const outcome = marketEnterpriseValue(34, {
      excessCashUsd: 0,
      nonOperatingAssetsUsd: 0,
      financialDebtUsd: 0,
      preferredEquityUsd: 0,
      minorityInterestUsd: 0,
      dilutedShares: 0,
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.map((issue) => issue.code)).toContain("shares_not_positive");
  });

  it("reports negative equity as unsupported rather than a negative share price", () => {
    const bridge = equityBridge(num(50 * M), {
      excessCashUsd: 0,
      nonOperatingAssetsUsd: 0,
      financialDebtUsd: 120 * M,
      preferredEquityUsd: 0,
      minorityInterestUsd: 0,
      dilutedShares: 10 * M,
    });
    expectUsdWithin(bridge.equityValue, -70 * M);
    expect(bridge.distressed).toBe(true);
    expect(bridge.valuePerShare).toBeNull();
  });
});

describe("P-F02: cash and debt move equity only", () => {
  const outcome = computeValuation({
    baseline: integrationBaseline(),
    forecast: integrationForecast(),
    terminal: integrationTerminal(),
  });
  if (!outcome.ok) throw new Error("integration fixture unexpectedly rejected");
  const enterpriseValue = outcome.value.enterpriseValue;

  const plain = equityBridge(enterpriseValue, {
    excessCashUsd: 0,
    nonOperatingAssetsUsd: 0,
    financialDebtUsd: 0,
    preferredEquityUsd: 0,
    minorityInterestUsd: 0,
    dilutedShares: 10 * M,
  });
  const levered = equityBridge(enterpriseValue, {
    excessCashUsd: 20 * M,
    nonOperatingAssetsUsd: 0,
    financialDebtUsd: 40 * M,
    preferredEquityUsd: 0,
    minorityInterestUsd: 0,
    dilutedShares: 10 * M,
  });
  const debtFunded = equityBridge(enterpriseValue, {
    excessCashUsd: 30 * M,
    nonOperatingAssetsUsd: 0,
    financialDebtUsd: 30 * M,
    preferredEquityUsd: 0,
    minorityInterestUsd: 0,
    dilutedShares: 10 * M,
  });

  it("keeps operating enterprise value identical", () => {
    expect(plain.enterpriseValue.toString()).toBe(levered.enterpriseValue.toString());
    expect(plain.enterpriseValue.toString()).toBe(debtFunded.enterpriseValue.toString());
  });

  it("moves equity value by exactly the bridge change", () => {
    // 100m equity with no net debt; 100m + 20m - 40m = 80m once cash and debt appear.
    expectUsdWithin(plain.equityValue, 100 * M, 0.01);
    expectUsdWithin(levered.equityValue, 80 * M, 0.01);
    expect(plain.valuePerShare?.toFixed(2)).toBe("10.00");
    expect(levered.valuePerShare?.toFixed(2)).toBe("8.00");
  });

  it("shows that borrowing to hold cash creates no value", () => {
    expectUsdWithin(debtFunded.equityValue, 100 * M, 0.01);
  });
});

describe("solve for growth respects its bounds", () => {
  it("reports no solution instead of extending the bounds", () => {
    const result = solveForGrowth({
      baseline: integrationBaseline(),
      forecast: integrationForecast(),
      terminal: integrationTerminal(),
      // At 30% growth the model reaches roughly 315m, far below this target.
      targetEvUsd: 10_000 * M,
      bounds: { min: -0.05, max: 0.3 },
    });
    expect(result.status).toBe("no_solution_in_bounds");
    if (result.status !== "no_solution_in_bounds") return;
    expect(result.message).toContain("Bounds were not extended");
  });

  it("rejects a non-positive target", () => {
    const result = solveForGrowth({
      baseline: integrationBaseline(),
      forecast: integrationForecast(),
      terminal: integrationTerminal(),
      targetEvUsd: 0,
      bounds: { min: -0.05, max: 0.3 },
    });
    expect(result.status).toBe("invalid");
  });
});

function blankInitiativeYear(): InitiativeYearInputs {
  return {
    eligibleLaborCostUsd: 0,
    adoption: 0,
    grossEffortReduction: 0,
    reviewReworkCostUsd: 0,
    realizationFraction: 0,
    incrementalRevenueUsd: 0,
    contributionMargin: 0,
    cannibalizedRevenueUsd: 0,
    cannibalizedContributionMargin: 0,
    aiOperatingExpenseUsd: 0,
    implementationOperatingExpenseUsd: 0,
    aiCapexUsd: 0,
    aiDaUsd: 0,
    incrementalOperatingNwcUsd: 0,
  };
}

function baseInitiative(overrides: Partial<InitiativeInputs> = {}): InitiativeInputs {
  return {
    name: "Test initiative",
    timeZeroImplementationCashUsd: 0,
    timeZeroCapexUsd: 0,
    years: [0, 1, 2, 3, 4].map(blankInitiativeYear),
    persistence: "none",
    ongoingCostsConfirmed: false,
    baselineOverlapResolved: true,
    ...overrides,
  };
}

describe("P-F05: AI overlay keeps capacity, savings, cost and timing separate", () => {
  const run = computeValuation({
    baseline: integrationBaseline(),
    forecast: integrationForecast(),
    terminal: integrationTerminal(),
  });
  if (!run.ok) throw new Error("integration fixture unexpectedly rejected");
  const policy = { taxRate: 0, wacc: 0.1, terminalGrowth: 0, terminalRoic: 0.1 };

  it("does not clamp a negative net capacity to zero", () => {
    // Gross capacity = 100m * 0.5 * 0.2 = 10m.
    // Net capacity = 10m - 12m = -2m. Realized = -2m * 0.5 = -1m.
    const years = [0, 1, 2, 3, 4].map(() => ({
      ...blankInitiativeYear(),
      eligibleLaborCostUsd: 100 * M,
      adoption: 0.5,
      grossEffortReduction: 0.2,
      reviewReworkCostUsd: 12 * M,
      realizationFraction: 0.5,
    }));
    const outcome = computeInitiative(baseInitiative({ years }), run.value, policy);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expectUsdWithin(outcome.value.years[0].grossCapacityUsd, 10 * M);
    expectUsdWithin(outcome.value.years[0].netCapacityUsd, -2 * M);
    expectUsdWithin(outcome.value.years[0].realizedLaborBenefitUsd, -1 * M);
  });

  it("rejects fractions outside the zero-to-one range", () => {
    const years = [0, 1, 2, 3, 4].map(() => ({ ...blankInitiativeYear(), adoption: 1.4 }));
    const outcome = computeInitiative(baseInitiative({ years }), run.value, policy);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.map((issue) => issue.code)).toContain("fraction_out_of_range");
  });

  it("blocks an overlay until baseline overlap is resolved", () => {
    const outcome = computeInitiative(baseInitiative({ baselineOverlapResolved: false }), run.value, policy);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.map((issue) => issue.code)).toContain("baseline_overlap_unresolved");
  });

  it("requires confirmed ongoing costs before valuing a persistent benefit", () => {
    const outcome = computeInitiative(
      baseInitiative({ persistence: "perpetuity", ongoingCostsConfirmed: false }),
      run.value,
      policy,
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.map((issue) => issue.code)).toContain("persistence_costs_unconfirmed");
  });
});

describe("initiative costs are never double counted", () => {
  const run = computeValuation({
    baseline: integrationBaseline(),
    forecast: integrationForecast(),
    terminal: integrationTerminal(),
  });
  if (!run.ok) throw new Error("integration fixture unexpectedly rejected");
  const policy = { taxRate: 0, wacc: 0.1, terminalGrowth: 0, terminalRoic: 0.1 };

  it("subtracts time-zero implementation cash and capex once, at t = 0", () => {
    const outcome = computeInitiative(
      baseInitiative({ timeZeroImplementationCashUsd: 5 * M, timeZeroCapexUsd: 3 * M }),
      run.value,
      policy,
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expectUsdWithin(outcome.value.timeZeroOutflowUsd, 8 * M);
    // Year one must be untouched by the time-zero spend.
    expectUsdWithin(outcome.value.years[0].incrementalFcffUsd, 0);
    expectUsdWithin(outcome.value.finiteHorizonNpvUsd, -8 * M);
  });

  it("adds a separate year-one cost on top instead of reusing the time-zero amount", () => {
    const years = [0, 1, 2, 3, 4].map(blankInitiativeYear);
    years[0] = { ...years[0], implementationOperatingExpenseUsd: 5 * M };
    const outcome = computeInitiative(
      baseInitiative({ timeZeroImplementationCashUsd: 5 * M, timeZeroCapexUsd: 3 * M, years }),
      run.value,
      policy,
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    // -8m at t=0 plus -5m discounted one year at 10% = -8m - 4,545,454.55 = -12,545,454.55
    expectUsdWithin(outcome.value.years[0].incrementalFcffUsd, -5 * M);
    expectUsdWithin(outcome.value.finiteHorizonNpvUsd, -12_545_454.55, 0.01);
  });
});

describe("incremental tax is computed at the whole-company level", () => {
  // Baseline: revenue 100m at a 1% margin, tax 25%, so EBIT 1m and cash tax 250,000.
  const run = computeValuation({
    baseline: flatBaseline,
    forecast: flatForecast({ startingMargin: 0.01, targetMargin: 0.01, taxRate: 0.25 }),
    terminal: { wacc: 0.1, terminalGrowth: 0, terminalRoic: 0.1 },
  });
  if (!run.ok) throw new Error("low-margin fixture unexpectedly rejected");
  const policy = { taxRate: 0.25, wacc: 0.1, terminalGrowth: 0, terminalRoic: 0.1 };

  it("limits the tax saving to the tax the company actually pays", () => {
    const years = [0, 1, 2, 3, 4].map(blankInitiativeYear);
    years[0] = { ...years[0], aiOperatingExpenseUsd: 5 * M };
    const outcome = computeInitiative(baseInitiative({ years }), run.value, policy);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const first = outcome.value.years[0];
    expectUsdWithin(first.incrementalEbitUsd, -5 * M);
    expectUsdWithin(first.baselineCashTaxUsd, 250_000);
    // Scenario EBIT is 1m - 5m = -4m, so scenario cash tax is zero.
    expectUsdWithin(first.scenarioCashTaxUsd, 0);
    expectUsdWithin(first.incrementalTaxUsd, -250_000);
    expectUsdWithin(first.incrementalFcffUsd, -4_750_000);
  });

  it("charges the full marginal rate when the company remains profitable", () => {
    // Gross capacity 20m * 1 * 0.2 = 4m realized. Scenario EBIT 5m, tax 1.25m,
    // baseline tax 250,000, so incremental tax is 1.0m and incremental FCFF is 3.0m.
    const years = [0, 1, 2, 3, 4].map(() => ({
      ...blankInitiativeYear(),
      eligibleLaborCostUsd: 20 * M,
      adoption: 1,
      grossEffortReduction: 0.2,
      realizationFraction: 1,
    }));
    const outcome = computeInitiative(baseInitiative({ years }), run.value, policy);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const first = outcome.value.years[0];
    expectUsdWithin(first.realizedLaborBenefitUsd, 4 * M);
    expectUsdWithin(first.scenarioCashTaxUsd, 1.25 * M);
    expectUsdWithin(first.incrementalTaxUsd, 1 * M);
    expectUsdWithin(first.incrementalFcffUsd, 3 * M);
  });
});
