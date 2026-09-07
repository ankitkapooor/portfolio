import type { Num } from "./decimal";

/** Bump when any formula in domain/finance changes. Recorded on every run. */
export const ENGINE_VERSION = "priced-in-engine/1.0.0";
export const FORMULA_VERSION = "fcff-linear-margin/1";

export type Basis = "reported" | "assumed" | "derived";

export interface FieldProvenance {
  basis: Basis;
  asOf?: string;
  sourceLocator?: string;
  note?: string;
}

/** Year-zero starting point for the forecast, in unrounded USD. */
export interface Baseline {
  revenueUsd: number;
  operatingNwcUsd: number;
}

export interface ForecastAssumptions {
  /** N. Five in P0. */
  years: number;
  /** Length N, decimal rates. */
  growthRates: number[];
  startingMargin: number;
  targetMargin: number;
  taxRate: number;
  /** Length N, share of that year's revenue. */
  daRatios: number[];
  capexRatios: number[];
  nwcRatios: number[];
}

export interface TerminalAssumptions {
  wacc: number;
  terminalGrowth: number;
  terminalRoic: number;
}

export interface YearProjection {
  year: number;
  revenue: Num;
  margin: Num;
  ebit: Num;
  cashTax: Num;
  nopat: Num;
  da: Num;
  capex: Num;
  operatingNwc: Num;
  deltaNwc: Num;
  fcff: Num;
}

export interface TerminalResult {
  /** NOPAT for period N+1. */
  nopat: Num;
  /** NOPAT[N+1] * g / terminalROIC. Replaces explicit capex - DA + dNWC for N+1. */
  reinvestment: Num;
  fcff: Num;
  /** Undiscounted terminal value as at the end of year N. */
  value: Num;
}

export interface ValuationRun {
  years: YearProjection[];
  terminal: TerminalResult;
  discountedFcff: Num[];
  pvExplicit: Num;
  pvTerminal: Num;
  enterpriseValue: Num;
  /** Discounted terminal value as a share of enterprise value. */
  terminalShare: Num;
  /** Terminal FCFF minus year-N FCFF, the "jump" the BRD asks us to surface. */
  terminalJump: Num;
  terminalJumpRatio: Num | null;
  engineVersion: string;
  formulaVersion: string;
}

export interface BridgeInputs {
  /** Excess cash only. Required operating cash stays out of the add-back. */
  excessCashUsd: number;
  nonOperatingAssetsUsd: number;
  /** Financial debt. Operating lease liabilities are excluded under the P0 policy. */
  financialDebtUsd: number;
  preferredEquityUsd: number;
  minorityInterestUsd: number;
  /** Current reviewed fully diluted share count. Shares, never USD. */
  dilutedShares: number;
}

export interface EquityBridgeResult {
  enterpriseValue: Num;
  excessCash: Num;
  nonOperatingAssets: Num;
  financialDebt: Num;
  preferredEquity: Num;
  minorityInterest: Num;
  equityValue: Num;
  valuePerShare: Num | null;
  /** Negative equity is an unsupported/distressed case, not a negative price. */
  distressed: boolean;
  notes: string[];
}
