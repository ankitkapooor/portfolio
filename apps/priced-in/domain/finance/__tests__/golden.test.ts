import { describe, expect, it } from "vitest";
import { num } from "../decimal";
import { projectYears } from "../forecast";
import { solveForGrowth } from "../reverse";
import { terminalValue } from "../terminal";
import { computeValuation, equityBridge } from "../valuation";
import {
  expectNumberWithin,
  expectUsdWithin,
  integrationBaseline,
  integrationForecast,
  integrationTerminal,
  noNetDebtBridge,
} from "./helpers";

const M = 1_000_000;

describe("golden fixture 1: single annual period (BRD section 11)", () => {
  // Hand calculation, USD:
  //   revenue      = 100,000,000 * 1.10        = 110,000,000
  //   margin       = 20%                       (start = target)
  //   EBIT         = 110,000,000 * 0.20        =  22,000,000
  //   cash tax     = max(EBIT,0) * 0.25        =   5,500,000
  //   NOPAT        = 22,000,000 - 5,500,000    =  16,500,000
  //   D&A          = 110,000,000 * 0.03        =   3,300,000
  //   capex        = 110,000,000 * 0.05        =   5,500,000
  //   closing NWC  = 110,000,000 * 0.10        =  11,000,000
  //   delta NWC    = 11,000,000 - 10,000,000   =   1,000,000
  //   FCFF         = 16.5 + 3.3 - 5.5 - 1.0    =  13,300,000
  const rows = projectYears(
    { revenueUsd: 100 * M, operatingNwcUsd: 10 * M },
    {
      years: 1,
      growthRates: [0.1],
      startingMargin: 0.2,
      targetMargin: 0.2,
      taxRate: 0.25,
      daRatios: [0.03],
      capexRatios: [0.05],
      nwcRatios: [0.1],
    },
  );
  const y1 = rows[0];

  it("produces one forecast year", () => {
    expect(rows).toHaveLength(1);
    expect(y1.year).toBe(1);
  });

  it("revenue is 110", () => expectUsdWithin(y1.revenue, 110 * M));
  it("EBIT is 22", () => expectUsdWithin(y1.ebit, 22 * M));
  it("cash tax is 5.5", () => expectUsdWithin(y1.cashTax, 5.5 * M));
  it("NOPAT is 16.5", () => expectUsdWithin(y1.nopat, 16.5 * M));
  it("D&A is 3.3", () => expectUsdWithin(y1.da, 3.3 * M));
  it("capex is 5.5", () => expectUsdWithin(y1.capex, 5.5 * M));
  it("closing operating NWC is 11", () => expectUsdWithin(y1.operatingNwc, 11 * M));
  it("delta NWC is 1", () => expectUsdWithin(y1.deltaNwc, 1 * M));
  it("FCFF is 13.3", () => expectUsdWithin(y1.fcff, 13.3 * M));
});

describe("golden fixture 2: terminal period (BRD section 11)", () => {
  // Hand calculation, USD:
  //   reinvestment  = 12,000,000 * 0.02 / 0.10 =   2,400,000
  //   terminal FCFF = 12,000,000 - 2,400,000   =   9,600,000
  //   terminal value= 9,600,000 / (0.08 - 0.02)= 160,000,000
  const outcome = terminalValue({
    terminalNopatUsd: num(12 * M),
    growth: 0.02,
    terminalRoic: 0.1,
    wacc: 0.08,
  });

  it("is accepted by the terminal guards", () => {
    expect(outcome.ok).toBe(true);
  });

  it("reinvestment is 2.4, FCFF is 9.6, value is 160", () => {
    if (!outcome.ok) throw new Error("terminal fixture unexpectedly rejected");
    expectUsdWithin(outcome.value.reinvestment, 2.4 * M);
    expectUsdWithin(outcome.value.fcff, 9.6 * M);
    expectUsdWithin(outcome.value.value, 160 * M);
  });
});

describe("golden fixture 3: equity bridge (BRD section 11)", () => {
  // 200 + 20 + 5 - 40 - 3 - 2 = 180; 180 / 10 shares = 18.00
  const bridge = equityBridge(num(200 * M), {
    excessCashUsd: 20 * M,
    nonOperatingAssetsUsd: 5 * M,
    financialDebtUsd: 40 * M,
    preferredEquityUsd: 3 * M,
    minorityInterestUsd: 2 * M,
    dilutedShares: 10 * M,
  });

  it("equity value is 180", () => expectUsdWithin(bridge.equityValue, 180 * M));

  it("value per share is exactly 18.00", () => {
    expect(bridge.valuePerShare).not.toBeNull();
    expect(bridge.valuePerShare?.toFixed(2)).toBe("18.00");
  });

  it("is not flagged distressed", () => {
    expect(bridge.distressed).toBe(false);
  });
});

describe("golden fixture 4: integration model (BRD section 11)", () => {
  // Every year: revenue 100, EBIT 10, tax 0, NOPAT 10, D&A 3, capex 3, dNWC 0 -> FCFF 10.
  // Terminal: revenue 100, NOPAT 10, g 0 so reinvestment 0, terminal FCFF 10,
  // terminal value 10 / 0.10 = 100.
  // PV explicit = 10*(1 - 1.1^-5)/0.1 = 37,907,867.69
  // PV terminal = 100,000,000 / 1.61051 = 62,092,132.31
  // EV = 100,000,000 exactly.
  const outcome = computeValuation({
    baseline: integrationBaseline(),
    forecast: integrationForecast(),
    terminal: integrationTerminal(),
  });

  it("is a supported model", () => {
    expect(outcome.ok).toBe(true);
  });

  it("produces five flat FCFFs of 10", () => {
    if (!outcome.ok) throw new Error("integration fixture unexpectedly rejected");
    expect(outcome.value.years).toHaveLength(5);
    for (const row of outcome.value.years) {
      expectUsdWithin(row.revenue, 100 * M);
      expectUsdWithin(row.ebit, 10 * M);
      expectUsdWithin(row.cashTax, 0);
      expectUsdWithin(row.fcff, 10 * M);
    }
  });

  it("terminal FCFF is 10 and terminal value is 100", () => {
    if (!outcome.ok) throw new Error("integration fixture unexpectedly rejected");
    expectUsdWithin(outcome.value.terminal.reinvestment, 0);
    expectUsdWithin(outcome.value.terminal.fcff, 10 * M);
    expectUsdWithin(outcome.value.terminal.value, 100 * M);
  });

  it("splits present value 37,907,867.69 explicit / 62,092,132.31 terminal", () => {
    if (!outcome.ok) throw new Error("integration fixture unexpectedly rejected");
    expectUsdWithin(outcome.value.pvExplicit, 37_907_867.69, 0.01);
    expectUsdWithin(outcome.value.pvTerminal, 62_092_132.31, 0.01);
  });

  it("direct DCF returns an enterprise value of exactly 100", () => {
    if (!outcome.ok) throw new Error("integration fixture unexpectedly rejected");
    expectUsdWithin(outcome.value.enterpriseValue, 100 * M, 0.01);
  });

  it("reverse solve recovers the 0% growth that produces the 100 target", () => {
    const solved = solveForGrowth({
      baseline: integrationBaseline(),
      forecast: integrationForecast(),
      terminal: integrationTerminal(),
      targetEvUsd: 100 * M,
      bounds: { min: -0.05, max: 0.3 },
    });

    expect(solved.status).toBe("solved");
    if (solved.status !== "solved") return;
    expectNumberWithin(solved.growth, 0, 1e-4);
    expectUsdWithin(num(solved.enterpriseValueUsd), 100 * M, Math.max(1, 100 * M * 0.0001));
  });

  it("with no net debt, equity value equals enterprise value", () => {
    if (!outcome.ok) throw new Error("integration fixture unexpectedly rejected");
    const bridge = equityBridge(outcome.value.enterpriseValue, noNetDebtBridge());
    expectUsdWithin(bridge.equityValue, 100 * M, 0.01);
    expect(bridge.valuePerShare?.toFixed(2)).toBe("10.00");
  });
});
