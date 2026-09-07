import { num, type Num } from "./decimal";
import { fail, ok, type EngineIssue, type Outcome } from "./errors";
import type { TerminalResult } from "./types";

export interface TerminalInput {
  /** NOPAT for period N+1, unrounded USD. */
  terminalNopatUsd: Num;
  growth: number;
  terminalRoic: number;
  wacc: number;
}

/**
 * Terminal reinvestment = NOPAT[N+1] * g / terminalROIC and REPLACES the
 * explicit capex - DA + dNWC for period N+1. Never subtract both.
 */
export function terminalValue(input: TerminalInput): Outcome<TerminalResult> {
  const { growth, terminalRoic, wacc } = input;
  const issues: EngineIssue[] = [];

  if (!input.terminalNopatUsd.greaterThan(0)) {
    issues.push({
      code: "terminal_nopat_not_positive",
      field: "terminalNopat",
      message: "Terminal NOPAT must be positive. A perpetuity on non-positive profit is not supported.",
    });
  }
  if (!Number.isFinite(growth) || growth < 0) {
    issues.push({
      code: "terminal_growth_negative",
      field: "terminalGrowth",
      message: "Terminal growth must be zero or positive.",
    });
  }
  if (!Number.isFinite(wacc) || wacc <= growth) {
    issues.push({
      code: "wacc_not_above_growth",
      field: "wacc",
      message: "WACC must be greater than terminal growth. No terminal value is defined when WACC <= g.",
    });
  }
  if (!Number.isFinite(terminalRoic) || terminalRoic <= growth) {
    issues.push({
      code: "roic_not_above_growth",
      field: "terminalRoic",
      message: "Terminal ROIC must be greater than terminal growth, otherwise growth destroys value without limit.",
    });
  }

  if (issues.length > 0) return fail(issues);

  const nopat = input.terminalNopatUsd;
  const reinvestment = nopat.times(num(growth)).div(num(terminalRoic));
  const fcff = nopat.minus(reinvestment);
  const value = fcff.div(num(wacc).minus(num(growth)));

  return ok({ nopat, reinvestment, fcff, value });
}
