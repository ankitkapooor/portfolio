export const CANONICAL_METRICS = [
  "revenue",
  "ebit",
  "netIncome",
  "taxExpense",
  "pretaxIncome",
  "depreciationAmortization",
  "capex",
  "currentOperatingAssets",
  "currentOperatingLiabilities",
  "cash",
  "totalDebt",
  "preferredEquity",
  "minorityInterest",
  "nonOperatingAssets",
  "sharesOutstanding",
  "totalAssets",
  "totalLiabilities",
  "totalEquity",
  "operatingCashFlow",
  "investingCashFlow",
  "financingCashFlow",
  "fxCashEffect",
] as const;

export type CanonicalMetric = (typeof CANONICAL_METRICS)[number];

export type MetricTiming = "flow" | "instant";
export type MetricUnit = "USD" | "shares";
export type StatementType = "income" | "balance" | "cashflow" | "other";

export interface MetricDefinition {
  metric: CanonicalMetric;
  label: string;
  timing: MetricTiming;
  unit: MetricUnit;
  statement: StatementType;
  /** True when the model cannot proceed without it and it must never default to zero. */
  requiredForValuation: boolean;
  note?: string;
}

export const METRIC_DEFINITIONS: Record<CanonicalMetric, MetricDefinition> = {
  revenue: { metric: "revenue", label: "Revenue", timing: "flow", unit: "USD", statement: "income", requiredForValuation: true },
  ebit: {
    metric: "ebit",
    label: "Operating profit (EBIT)",
    timing: "flow",
    unit: "USD",
    statement: "income",
    requiredForValuation: true,
    note: "Stock-based compensation stays inside EBIT as an operating expense.",
  },
  netIncome: { metric: "netIncome", label: "Net income", timing: "flow", unit: "USD", statement: "income", requiredForValuation: false },
  taxExpense: { metric: "taxExpense", label: "Income tax expense", timing: "flow", unit: "USD", statement: "income", requiredForValuation: false },
  pretaxIncome: { metric: "pretaxIncome", label: "Pre-tax income", timing: "flow", unit: "USD", statement: "income", requiredForValuation: false },
  depreciationAmortization: {
    metric: "depreciationAmortization",
    label: "Depreciation and amortisation",
    timing: "flow",
    unit: "USD",
    statement: "cashflow",
    requiredForValuation: true,
  },
  capex: {
    metric: "capex",
    label: "Capital expenditure",
    timing: "flow",
    unit: "USD",
    statement: "cashflow",
    requiredForValuation: true,
    note: "Model notation: positive means a cash investment outflow.",
  },
  currentOperatingAssets: {
    metric: "currentOperatingAssets",
    label: "Current operating assets (excluding cash)",
    timing: "instant",
    unit: "USD",
    statement: "balance",
    requiredForValuation: true,
  },
  currentOperatingLiabilities: {
    metric: "currentOperatingLiabilities",
    label: "Current operating liabilities (excluding debt)",
    timing: "instant",
    unit: "USD",
    statement: "balance",
    requiredForValuation: true,
  },
  cash: { metric: "cash", label: "Cash and equivalents", timing: "instant", unit: "USD", statement: "balance", requiredForValuation: false },
  totalDebt: { metric: "totalDebt", label: "Financial debt", timing: "instant", unit: "USD", statement: "balance", requiredForValuation: false },
  preferredEquity: { metric: "preferredEquity", label: "Preferred equity", timing: "instant", unit: "USD", statement: "balance", requiredForValuation: false },
  minorityInterest: { metric: "minorityInterest", label: "Minority interest", timing: "instant", unit: "USD", statement: "balance", requiredForValuation: false },
  nonOperatingAssets: { metric: "nonOperatingAssets", label: "Non-operating assets", timing: "instant", unit: "USD", statement: "balance", requiredForValuation: false },
  sharesOutstanding: {
    metric: "sharesOutstanding",
    label: "Shares outstanding",
    timing: "instant",
    unit: "shares",
    statement: "other",
    requiredForValuation: false,
    note: "Share units are never USD. The per-share bridge uses a reviewed current diluted count.",
  },
  totalAssets: { metric: "totalAssets", label: "Total assets", timing: "instant", unit: "USD", statement: "balance", requiredForValuation: false },
  totalLiabilities: { metric: "totalLiabilities", label: "Total liabilities", timing: "instant", unit: "USD", statement: "balance", requiredForValuation: false },
  totalEquity: { metric: "totalEquity", label: "Total equity", timing: "instant", unit: "USD", statement: "balance", requiredForValuation: false },
  operatingCashFlow: { metric: "operatingCashFlow", label: "Operating cash flow", timing: "flow", unit: "USD", statement: "cashflow", requiredForValuation: false },
  investingCashFlow: { metric: "investingCashFlow", label: "Investing cash flow", timing: "flow", unit: "USD", statement: "cashflow", requiredForValuation: false },
  financingCashFlow: { metric: "financingCashFlow", label: "Financing cash flow", timing: "flow", unit: "USD", statement: "cashflow", requiredForValuation: false },
  fxCashEffect: { metric: "fxCashEffect", label: "FX and other cash reconciliation", timing: "flow", unit: "USD", statement: "cashflow", requiredForValuation: false },
};

export const SCALES = ["units", "thousands", "millions", "billions"] as const;
export type Scale = (typeof SCALES)[number];

export const SCALE_MULTIPLIERS: Record<Scale, number> = {
  units: 1,
  thousands: 1_000,
  millions: 1_000_000,
  billions: 1_000_000_000,
};

export function isCanonicalMetric(value: string): value is CanonicalMetric {
  return (CANONICAL_METRICS as readonly string[]).includes(value);
}

export function isScale(value: string): value is Scale {
  return (SCALES as readonly string[]).includes(value);
}
