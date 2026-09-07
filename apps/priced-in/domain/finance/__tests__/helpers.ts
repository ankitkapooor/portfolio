import { expect } from "vitest";
import type { Num } from "../decimal";
import type { Baseline, ForecastAssumptions, TerminalAssumptions, BridgeInputs } from "../types";

/**
 * Every expected value in these tests is calculated by hand and written as a
 * literal. Nothing here calls the production functions under test to produce
 * an expectation.
 */
export function expectUsdWithin(actual: Num, expectedUsd: number, toleranceUsd = 1): void {
  const difference = Math.abs(actual.toNumber() - expectedUsd);
  expect(
    difference,
    `expected ${actual.toString()} to be within ${toleranceUsd} of ${expectedUsd} (difference ${difference})`,
  ).toBeLessThanOrEqual(toleranceUsd);
}

export function expectNumberWithin(actual: number, expected: number, tolerance: number): void {
  const difference = Math.abs(actual - expected);
  expect(
    difference,
    `expected ${actual} to be within ${tolerance} of ${expected} (difference ${difference})`,
  ).toBeLessThanOrEqual(tolerance);
}

const MILLION = 1_000_000;

/** Integration golden model from BRD section 11. */
export function integrationBaseline(): Baseline {
  return { revenueUsd: 100 * MILLION, operatingNwcUsd: 0 };
}

export function integrationForecast(): ForecastAssumptions {
  return {
    years: 5,
    growthRates: [0, 0, 0, 0, 0],
    startingMargin: 0.1,
    targetMargin: 0.1,
    taxRate: 0,
    daRatios: [0.03, 0.03, 0.03, 0.03, 0.03],
    capexRatios: [0.03, 0.03, 0.03, 0.03, 0.03],
    nwcRatios: [0, 0, 0, 0, 0],
  };
}

export function integrationTerminal(): TerminalAssumptions {
  return { wacc: 0.1, terminalGrowth: 0, terminalRoic: 0.1 };
}

export function noNetDebtBridge(shares = 10 * MILLION): BridgeInputs {
  return {
    excessCashUsd: 0,
    nonOperatingAssetsUsd: 0,
    financialDebtUsd: 0,
    preferredEquityUsd: 0,
    minorityInterestUsd: 0,
    dilutedShares: shares,
  };
}
