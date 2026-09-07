import { discountFactor, num, ONE, sum, ZERO, type Num } from "./decimal";
import { fail, ok, type EngineIssue, type Outcome } from "./errors";
import { projectYears } from "./forecast";
import { terminalValue } from "./terminal";
import {
  ENGINE_VERSION,
  FORMULA_VERSION,
  type Baseline,
  type BridgeInputs,
  type EquityBridgeResult,
  type ForecastAssumptions,
  type TerminalAssumptions,
  type ValuationRun,
} from "./types";

export interface ValuationInput {
  baseline: Baseline;
  forecast: ForecastAssumptions;
  terminal: TerminalAssumptions;
}

/**
 * Unlevered FCFF model, end-of-year discounting.
 * EV = sum FCFF[t]/(1+WACC)^t + terminalValue/(1+WACC)^N.
 */
export function computeValuation(input: ValuationInput): Outcome<ValuationRun> {
  const { baseline, forecast, terminal } = input;

  if (!Number.isFinite(terminal.wacc) || terminal.wacc <= 0) {
    return fail([
      { code: "wacc_not_positive", field: "wacc", message: "WACC must be a positive decimal rate." },
    ]);
  }

  const years = projectYears(baseline, forecast);
  const finalYear = years[years.length - 1];

  // Revenue[N+1] = Revenue[N] * (1+g); NOPAT[N+1] = Revenue[N+1] * targetMargin * (1 - taxRate).
  const terminalRevenue = finalYear.revenue.times(ONE.plus(num(terminal.terminalGrowth)));
  const terminalNopat = terminalRevenue
    .times(num(forecast.targetMargin))
    .times(ONE.minus(num(forecast.taxRate)));

  const terminalOutcome = terminalValue({
    terminalNopatUsd: terminalNopat,
    growth: terminal.terminalGrowth,
    terminalRoic: terminal.terminalRoic,
    wacc: terminal.wacc,
  });
  if (!terminalOutcome.ok) return terminalOutcome;

  const wacc = num(terminal.wacc);
  const discountedFcff = years.map((row) => row.fcff.times(discountFactor(wacc, row.year)));
  const pvExplicit = sum(discountedFcff);
  const pvTerminal = terminalOutcome.value.value.times(discountFactor(wacc, forecast.years));
  const enterpriseValue = pvExplicit.plus(pvTerminal);

  const terminalJump = terminalOutcome.value.fcff.minus(finalYear.fcff);
  const terminalJumpRatio = finalYear.fcff.isZero() ? null : terminalJump.div(finalYear.fcff.abs());

  return ok({
    years,
    terminal: terminalOutcome.value,
    discountedFcff,
    pvExplicit,
    pvTerminal,
    enterpriseValue,
    terminalShare: enterpriseValue.isZero() ? ZERO : pvTerminal.div(enterpriseValue),
    terminalJump,
    terminalJumpRatio,
    engineVersion: ENGINE_VERSION,
    formulaVersion: FORMULA_VERSION,
  });
}

/**
 * Equity value = EV + excess cash + non-operating assets - debt - preferred - minority.
 * Changing debt or excess cash moves equity value only; operating EV is untouched.
 */
export function equityBridge(enterpriseValue: Num, bridge: BridgeInputs): EquityBridgeResult {
  const excessCash = num(bridge.excessCashUsd);
  const nonOperatingAssets = num(bridge.nonOperatingAssetsUsd);
  const financialDebt = num(bridge.financialDebtUsd);
  const preferredEquity = num(bridge.preferredEquityUsd);
  const minorityInterest = num(bridge.minorityInterestUsd);

  const equityValue = enterpriseValue
    .plus(excessCash)
    .plus(nonOperatingAssets)
    .minus(financialDebt)
    .minus(preferredEquity)
    .minus(minorityInterest);

  const notes: string[] = [];
  let valuePerShare: Num | null = null;
  const distressed = !equityValue.greaterThan(0);

  if (distressed) {
    notes.push(
      "Equity value is not positive. This is reported as an unsupported or distressed case, not as a negative per-share value.",
    );
  }
  if (!Number.isFinite(bridge.dilutedShares) || bridge.dilutedShares <= 0) {
    notes.push("A positive reviewed diluted share count is required before a per-share value can be shown.");
  } else if (!distressed) {
    valuePerShare = equityValue.div(num(bridge.dilutedShares));
  }

  return {
    enterpriseValue,
    excessCash,
    nonOperatingAssets,
    financialDebt,
    preferredEquity,
    minorityInterest,
    equityValue,
    valuePerShare,
    distressed,
    notes,
  };
}

/**
 * Market EV target = price * shares + debt + preferred + minority - excess cash - non-operating assets.
 */
export function marketEnterpriseValue(
  marketPricePerShare: number,
  bridge: BridgeInputs,
): Outcome<Num> {
  const issues: EngineIssue[] = [];
  if (!Number.isFinite(marketPricePerShare) || marketPricePerShare <= 0) {
    issues.push({
      code: "price_not_positive",
      field: "marketPrice",
      message: "A positive, dated market price per share is required to derive an enterprise-value target.",
    });
  }
  if (!Number.isFinite(bridge.dilutedShares) || bridge.dilutedShares <= 0) {
    issues.push({
      code: "shares_not_positive",
      field: "dilutedShares",
      message: "A positive reviewed diluted share count is required to derive an enterprise-value target.",
    });
  }
  if (issues.length > 0) return fail(issues);

  const equityMarketValue = num(marketPricePerShare).times(num(bridge.dilutedShares));
  return ok(
    equityMarketValue
      .plus(num(bridge.financialDebtUsd))
      .plus(num(bridge.preferredEquityUsd))
      .plus(num(bridge.minorityInterestUsd))
      .minus(num(bridge.excessCashUsd))
      .minus(num(bridge.nonOperatingAssetsUsd)),
  );
}
