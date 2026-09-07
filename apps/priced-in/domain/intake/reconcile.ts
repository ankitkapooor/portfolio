import { factsByYear, type IntakeIssue, type ReportedFact } from "./facts";
import { METRIC_DEFINITIONS, type CanonicalMetric } from "./metrics";

/** Default materiality: max($1, 0.1% of the larger absolute comparison amount). */
export const DEFAULT_MATERIALITY_PERCENT = 0.001;

export function materialityTolerance(left: number, right: number, percent = DEFAULT_MATERIALITY_PERCENT): number {
  return Math.max(1, percent * Math.max(Math.abs(left), Math.abs(right)));
}

export type CheckStatus = "pass" | "fail" | "unavailable";

export interface ReconciliationCheck {
  id: string;
  label: string;
  fiscalYear: number | null;
  status: CheckStatus;
  leftLabel: string;
  leftValue: number | null;
  rightLabel: string;
  rightValue: number | null;
  differenceUsd: number | null;
  toleranceUsd: number | null;
  detail: string;
}

/** Metrics the five-year model cannot start without. None may default to zero. */
export const BASELINE_REQUIRED_METRICS: CanonicalMetric[] = [
  "revenue",
  "ebit",
  "depreciationAmortization",
  "capex",
  "currentOperatingAssets",
  "currentOperatingLiabilities",
];

export interface ReconciliationInput {
  facts: ReportedFact[];
  baselineFiscalYear: number | null;
  materialityPercent?: number;
  /** Metrics the user has explicitly confirmed are genuinely zero. */
  confirmedZeros?: CanonicalMetric[];
}

export interface ReconciliationReport {
  checks: ReconciliationCheck[];
  issues: IntakeIssue[];
  /** True only when every applicable check passes and nothing blocking remains. */
  cleanData: boolean;
  materialityPercent: number;
}

export function reconcile(input: ReconciliationInput): ReconciliationReport {
  const percent = input.materialityPercent ?? DEFAULT_MATERIALITY_PERCENT;
  const confirmedZeros = new Set(input.confirmedZeros ?? []);
  const byYear = factsByYear(input.facts);
  const years = [...byYear.keys()].sort((a, b) => a - b);
  const checks: ReconciliationCheck[] = [];
  const issues: IntakeIssue[] = [];

  const valueOf = (year: number, metric: CanonicalMetric): number | null => {
    const fact = byYear.get(year)?.get(metric);
    if (fact) return fact.normalizedValue;
    return confirmedZeros.has(metric) ? 0 : null;
  };

  for (const year of years) {
    const assets = valueOf(year, "totalAssets");
    const liabilities = valueOf(year, "totalLiabilities");
    const equity = valueOf(year, "totalEquity");
    if (assets === null || liabilities === null || equity === null) {
      checks.push({
        id: `balance-${year}`,
        label: "Assets = liabilities + equity",
        fiscalYear: year,
        status: "unavailable",
        leftLabel: "Total assets",
        leftValue: assets,
        rightLabel: "Liabilities + equity",
        rightValue: liabilities === null || equity === null ? null : liabilities + equity,
        differenceUsd: null,
        toleranceUsd: null,
        detail: "Not all three balance-sheet totals were supplied for this year, so the check cannot run.",
      });
    } else {
      const right = liabilities + equity;
      const tolerance = materialityTolerance(assets, right, percent);
      const difference = assets - right;
      const status: CheckStatus = Math.abs(difference) <= tolerance ? "pass" : "fail";
      checks.push({
        id: `balance-${year}`,
        label: "Assets = liabilities + equity",
        fiscalYear: year,
        status,
        leftLabel: "Total assets",
        leftValue: assets,
        rightLabel: "Liabilities + equity",
        rightValue: right,
        differenceUsd: difference,
        toleranceUsd: tolerance,
        detail:
          status === "pass"
            ? "Within the materiality tolerance shown."
            : "Outside tolerance. Resolve the difference or record an explicit override before relying on a clean-data badge.",
      });
      if (status === "fail") {
        issues.push({
          severity: "blocking",
          code: "balance_sheet_mismatch",
          message: `FY${year} balance sheet does not balance by ${difference.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD.`,
          fiscalYear: year,
        });
      }
    }

    const previousYear = year - 1;
    const closingCash = valueOf(year, "cash");
    const openingCash = byYear.has(previousYear) ? valueOf(previousYear, "cash") : null;
    const ocf = valueOf(year, "operatingCashFlow");
    const icf = valueOf(year, "investingCashFlow");
    const fcf = valueOf(year, "financingCashFlow");
    const fx = valueOf(year, "fxCashEffect");

    if (closingCash === null || openingCash === null || ocf === null || icf === null || fcf === null || fx === null) {
      checks.push({
        id: `cash-${year}`,
        label: "Closing cash - opening cash = operating + investing + financing + FX",
        fiscalYear: year,
        status: "unavailable",
        leftLabel: "Change in cash",
        leftValue: closingCash === null || openingCash === null ? null : closingCash - openingCash,
        rightLabel: "Sum of cash-flow lines",
        rightValue: null,
        differenceUsd: null,
        toleranceUsd: null,
        detail:
          "This check needs the prior-year cash balance and all four cash-flow lines. A missing line is never treated as zero without explicit confirmation.",
      });
    } else {
      const left = closingCash - openingCash;
      const right = ocf + icf + fcf + fx;
      const tolerance = materialityTolerance(left, right, percent);
      const difference = left - right;
      const status: CheckStatus = Math.abs(difference) <= tolerance ? "pass" : "fail";
      checks.push({
        id: `cash-${year}`,
        label: "Closing cash - opening cash = operating + investing + financing + FX",
        fiscalYear: year,
        status,
        leftLabel: "Change in cash",
        leftValue: left,
        rightLabel: "Sum of cash-flow lines",
        rightValue: right,
        differenceUsd: difference,
        toleranceUsd: tolerance,
        detail: status === "pass" ? "Within the materiality tolerance shown." : "Outside tolerance. Resolve before relying on the cash-flow data.",
      });
      if (status === "fail") {
        issues.push({
          severity: "blocking",
          code: "cash_flow_mismatch",
          message: `FY${year} cash-flow roll-forward is off by ${difference.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD.`,
          fiscalYear: year,
        });
      }
    }
  }

  // Fiscal date coherence across supplied years.
  const periodEnds = years
    .map((year) => ({ year, end: byYear.get(year)?.get("revenue")?.periodEnd ?? null }))
    .filter((entry): entry is { year: number; end: string } => entry.end !== null);
  let datesCoherent = true;
  for (let i = 1; i < periodEnds.length; i += 1) {
    if (periodEnds[i].end <= periodEnds[i - 1].end) datesCoherent = false;
  }
  checks.push({
    id: "date-coherence",
    label: "Fiscal period end dates increase year on year",
    fiscalYear: null,
    status: periodEnds.length < 2 ? "unavailable" : datesCoherent ? "pass" : "fail",
    leftLabel: "Earliest period end",
    leftValue: null,
    rightLabel: "Latest period end",
    rightValue: null,
    differenceUsd: null,
    toleranceUsd: null,
    detail:
      periodEnds.length < 2
        ? "At least two annual periods are needed to check date ordering."
        : datesCoherent
          ? periodEnds.map((entry) => `FY${entry.year} ends ${entry.end}`).join("; ")
          : "Period end dates are out of order or duplicated across fiscal years.",
  });
  if (periodEnds.length >= 2 && !datesCoherent) {
    issues.push({ severity: "blocking", code: "incoherent_fiscal_dates", message: "Fiscal period end dates are out of order." });
  }

  // Scale-confusion heuristic: a hundredfold jump in one metric between adjacent years.
  for (const metric of ["revenue", "ebit", "totalAssets"] as CanonicalMetric[]) {
    for (let i = 1; i < years.length; i += 1) {
      const previous = valueOf(years[i - 1], metric);
      const current = valueOf(years[i], metric);
      if (previous === null || current === null || previous === 0) continue;
      const ratio = Math.abs(current / previous);
      if (ratio > 100 || ratio < 0.01) {
        issues.push({
          severity: "warning",
          code: "possible_scale_confusion",
          message: `${METRIC_DEFINITIONS[metric].label} changes by a factor of ${ratio.toFixed(0)} between FY${years[i - 1]} and FY${years[i]}. Check the scale column on both rows.`,
          metric,
          fiscalYear: years[i],
        });
      }
    }
  }

  // Scope constraints on the baseline year.
  if (input.baselineFiscalYear !== null) {
    const baseYear = input.baselineFiscalYear;
    for (const metric of BASELINE_REQUIRED_METRICS) {
      if (valueOf(baseYear, metric) === null) {
        issues.push({
          severity: "blocking",
          code: "missing_required_metric",
          message: `${METRIC_DEFINITIONS[metric].label} is missing for the FY${baseYear} baseline. Supply it or explicitly confirm that it is zero.`,
          metric,
          fiscalYear: baseYear,
        });
      }
    }
    const revenue = valueOf(baseYear, "revenue");
    const ebit = valueOf(baseYear, "ebit");
    checks.push({
      id: "scope-revenue",
      label: "Baseline revenue is positive",
      fiscalYear: baseYear,
      status: revenue === null ? "unavailable" : revenue > 0 ? "pass" : "fail",
      leftLabel: "Baseline revenue",
      leftValue: revenue,
      rightLabel: "Required",
      rightValue: 0,
      differenceUsd: null,
      toleranceUsd: null,
      detail: "P0 supports operating businesses with positive baseline revenue.",
    });
    checks.push({
      id: "scope-ebit",
      label: "Baseline normalized EBIT is positive",
      fiscalYear: baseYear,
      status: ebit === null ? "unavailable" : ebit > 0 ? "pass" : "fail",
      leftLabel: "Normalized EBIT",
      leftValue: ebit,
      rightLabel: "Required",
      rightValue: 0,
      differenceUsd: null,
      toleranceUsd: null,
      detail: "P0 excludes pre-revenue and loss-making operating businesses; uploaded data is preserved for correction.",
    });
    if (revenue !== null && revenue <= 0) {
      issues.push({ severity: "blocking", code: "out_of_scope_revenue", message: "Baseline revenue must be positive for this model.", fiscalYear: baseYear });
    }
    if (ebit !== null && ebit <= 0) {
      issues.push({ severity: "blocking", code: "out_of_scope_ebit", message: "Baseline normalized EBIT must be positive for this model.", fiscalYear: baseYear });
    }
  }

  const cleanData = checks.every((check) => check.status !== "fail") && !issues.some((issue) => issue.severity === "blocking");
  return { checks, issues, cleanData, materialityPercent: percent };
}
