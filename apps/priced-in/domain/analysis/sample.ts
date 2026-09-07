import { parseCsv, toCsv } from "../intake/csv";
import { normalizeRows, TEMPLATE_COLUMNS } from "../intake/facts";
import { METRIC_DEFINITIONS, type CanonicalMetric } from "../intake/metrics";
import { ENGINE_VERSION, FORMULA_VERSION } from "../finance/types";
import { ANALYSIS_SCHEMA_VERSION, type AnalysisDocument, type AssumptionSet, type StoredInitiative } from "./schema";
import type { OperatingInputs } from "../finance/operating";

export const SAMPLE_COMPANY_NAME = "Meridian Harbor Logistics";
export const SAMPLE_TICKER = "MHLX";

export const SAMPLE_DISCLAIMER =
  "Meridian Harbor Logistics is a fictional company. Every figure below is a synthetic calculation fixture invented for this demonstration. It is not a real business, a real filing, or a real market price.";

interface SampleYear {
  fiscalYear: number;
  periodStart: string;
  periodEnd: string;
  filedAt: string;
}

const SAMPLE_YEARS: SampleYear[] = [
  { fiscalYear: 2022, periodStart: "2022-01-01", periodEnd: "2022-12-31", filedAt: "2023-02-17" },
  { fiscalYear: 2023, periodStart: "2023-01-01", periodEnd: "2023-12-31", filedAt: "2024-02-16" },
  { fiscalYear: 2024, periodStart: "2024-01-01", periodEnd: "2024-12-31", filedAt: "2025-02-14" },
  { fiscalYear: 2025, periodStart: "2025-01-01", periodEnd: "2025-12-31", filedAt: "2026-02-13" },
];

/** Values in millions, ordered FY2022, FY2023, FY2024, FY2025. Shares are millions of shares. */
const SAMPLE_VALUES: Record<CanonicalMetric, number[]> = {
  revenue: [820, 902, 985, 1060],
  ebit: [98.4, 117.3, 137.9, 153.7],
  netIncome: [64.0, 78.4, 94.1, 106.3],
  taxExpense: [21.4, 26.1, 31.4, 35.4],
  pretaxIncome: [85.4, 104.5, 125.5, 141.7],
  depreciationAmortization: [27.9, 30.7, 33.5, 36.0],
  // Reported the way a cash-flow statement would show it, so the sign conversion is visible on review.
  capex: [-37.7, -41.5, -45.3, -48.8],
  currentOperatingAssets: [180.4, 198.4, 216.7, 233.2],
  currentOperatingLiabilities: [98.4, 108.2, 118.2, 127.2],
  cash: [150, 168, 191, 214],
  totalDebt: [260, 255, 248, 240],
  preferredEquity: [0, 0, 0, 0],
  minorityInterest: [0, 0, 0, 0],
  nonOperatingAssets: [12, 12, 14, 14],
  sharesOutstanding: [62.0, 62.4, 62.9, 63.4],
  totalAssets: [1240, 1304, 1378, 1454],
  totalLiabilities: [690, 700, 706, 712],
  totalEquity: [550, 604, 672, 742],
  operatingCashFlow: [105.0, 118.5, 130.3, 140.8],
  investingCashFlow: [-37.7, -41.5, -45.3, -48.8],
  financingCashFlow: [-50.0, -59.0, -62.0, -69.0],
  fxCashEffect: [0, 0, 0, 0],
};

const STATEMENT_PAGE: Record<string, string> = {
  income: "Statements of operations",
  balance: "Balance sheets",
  cashflow: "Statements of cash flows",
  other: "Share data note",
};

export function sampleCompanyCsv(): string {
  const rows: Array<Array<string | number>> = [[...TEMPLATE_COLUMNS]];
  for (const [index, year] of SAMPLE_YEARS.entries()) {
    for (const metric of Object.keys(SAMPLE_VALUES) as CanonicalMetric[]) {
      const definition = METRIC_DEFINITIONS[metric];
      rows.push([
        SAMPLE_COMPANY_NAME,
        year.fiscalYear,
        definition.timing === "flow" ? year.periodStart : "",
        year.periodEnd,
        definition.statement,
        metric,
        SAMPLE_VALUES[metric][index],
        definition.unit,
        "millions",
        `synthetic://meridian-harbor/fy${year.fiscalYear}-annual-report`,
        `Synthetic FY${year.fiscalYear} annual report, ${STATEMENT_PAGE[definition.statement]}, ${definition.label}`,
        year.filedAt,
      ]);
    }
  }
  return toCsv(rows);
}

const MILLION = 1_000_000;

export function sampleAssumptions(): AssumptionSet {
  return {
    asOfDate: "2026-02-28",
    displayScale: "millions",
    // FY2025 revenue 1,060m; operating NWC = 233.2m - 127.2m = 106.0m.
    baseline: { revenueUsd: 1060 * MILLION, operatingNwcUsd: 106 * MILLION },
    forecast: {
      years: 5,
      growthRates: [0.05, 0.05, 0.05, 0.05, 0.05],
      startingMargin: 0.145,
      targetMargin: 0.17,
      taxRate: 0.25,
      daRatios: [0.034, 0.034, 0.034, 0.034, 0.034],
      capexRatios: [0.046, 0.046, 0.046, 0.046, 0.046],
      nwcRatios: [0.1, 0.1, 0.1, 0.1, 0.1],
    },
    terminal: { wacc: 0.085, terminalGrowth: 0.02, terminalRoic: 0.12 },
    bridge: {
      // Cash 214m less 21.2m required operating cash (2% of revenue).
      excessCashUsd: 192.8 * MILLION,
      nonOperatingAssetsUsd: 14 * MILLION,
      financialDebtUsd: 240 * MILLION,
      preferredEquityUsd: 0,
      minorityInterestUsd: 0,
      dilutedShares: 65 * MILLION,
    },
    bridgeAsOf: "2025-12-31",
    sharesAsOf: "2025-12-31",
    sharesBasis:
      "63.4m shares outstanding at FY2025 year end plus a 1.6m reviewed dilution estimate for unvested awards. Synthetic figure.",
    requiredOperatingCashUsd: 21.2 * MILLION,
    target: {
      mode: "price",
      marketPricePerShare: 34,
      priceAsOf: "2026-02-27",
      enterpriseValueUsd: null,
    },
    mapBounds: { growthMin: -0.05, growthMax: 0.3, marginMin: 0.05, marginMax: 0.4 },
  };
}

export function sampleInitiative(): StoredInitiative {
  const year = (
    eligibleLaborCostUsd: number,
    adoption: number,
    incrementalRevenueUsd: number,
    aiOperatingExpenseUsd: number,
    implementationOperatingExpenseUsd: number,
    aiCapexUsd: number,
    aiDaUsd: number,
  ) => ({
    eligibleLaborCostUsd,
    adoption,
    grossEffortReduction: 0.18,
    reviewReworkCostUsd: eligibleLaborCostUsd * 0.02,
    realizationFraction: 0.6,
    incrementalRevenueUsd,
    contributionMargin: 0.55,
    cannibalizedRevenueUsd: incrementalRevenueUsd * 0.1,
    cannibalizedContributionMargin: 0.4,
    aiOperatingExpenseUsd,
    implementationOperatingExpenseUsd,
    aiCapexUsd,
    aiDaUsd,
    incrementalOperatingNwcUsd: 0,
  });

  return {
    name: "Automated freight exception handling",
    enabled: true,
    timeZeroImplementationCashUsd: 6 * MILLION,
    timeZeroCapexUsd: 4 * MILLION,
    years: [
      year(140 * MILLION, 0.2, 0, 3 * MILLION, 4 * MILLION, 2 * MILLION, 1.2 * MILLION),
      year(147 * MILLION, 0.45, 6 * MILLION, 4.5 * MILLION, 3 * MILLION, 2 * MILLION, 2.0 * MILLION),
      year(154 * MILLION, 0.65, 12 * MILLION, 5.5 * MILLION, 1.5 * MILLION, 1.5 * MILLION, 2.4 * MILLION),
      year(162 * MILLION, 0.75, 16 * MILLION, 6 * MILLION, 0, 1.5 * MILLION, 2.6 * MILLION),
      year(170 * MILLION, 0.8, 18 * MILLION, 6.5 * MILLION, 0, 1.5 * MILLION, 2.8 * MILLION),
    ],
    persistence: "none",
    ongoingCostsConfirmed: false,
    baselineOverlapResolved: true,
  };
}

export function sampleOperating(): OperatingInputs {
  return {
    template: "customers",
    // Revenue per customer is a supplied assumption; unit price is deliberately left
    // empty so the unavailable state is visible in the demo.
    annualRevenuePerCustomerUsd: [1_180_000, 1_215_000, 1_252_000, 1_289_000, 1_328_000],
    averageRealizedPriceUsd: [null, null, null, null, null],
    marketRevenueUsd: [null, null, null, null, null],
    marketDefinition: "",
    marketAsOf: [null, null, null, null, null],
  };
}

export function sampleProvenance(): AnalysisDocument["provenance"] {
  return {
    "baseline.revenueUsd": {
      basis: "reported",
      asOf: "2025-12-31",
      sourceLocator: "Synthetic FY2025 annual report, Statements of operations, Revenue",
    },
    "baseline.operatingNwcUsd": {
      basis: "derived",
      asOf: "2025-12-31",
      note: "Current operating assets 233.2m less current operating liabilities 127.2m. Cash and debt are excluded.",
    },
    "bridge.excessCashUsd": {
      basis: "assumed",
      asOf: "2025-12-31",
      note: "Reported cash 214.0m less 21.2m assumed required operating cash (2% of revenue). Only the excess is added in the bridge.",
    },
    "bridge.financialDebtUsd": {
      basis: "reported",
      asOf: "2025-12-31",
      note: "Financial debt only. Operating lease liabilities stay in operating expense under the P0 convention.",
    },
    "bridge.dilutedShares": {
      basis: "assumed",
      asOf: "2025-12-31",
      note: "Reviewed current fully diluted estimate, not a historical weighted average.",
    },
    "terminal.wacc": { basis: "assumed", note: "User-entered weighted average cost of capital. Not derived from a beta or a bond yield." },
    "target.marketPricePerShare": {
      basis: "assumed",
      asOf: "2026-02-27",
      note: "Synthetic quote for a fictional company. There is no live market data in this release.",
    },
  };
}

export function createSampleDocument(now = "2026-02-28T00:00:00.000Z"): AnalysisDocument {
  const imported = normalizeRows(parseCsv(sampleCompanyCsv()), { today: now.slice(0, 10), expectedCurrency: "USD" });
  return {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    formulaVersion: FORMULA_VERSION,
    createdAt: now,
    updatedAt: now,
    company: {
      name: SAMPLE_COMPANY_NAME,
      ticker: SAMPLE_TICKER,
      fictional: true,
      currency: "USD",
      note: SAMPLE_DISCLAIMER,
    },
    facts: imported.facts.map((fact) => ({ ...fact, reviewStatus: "accepted" as const })),
    supersededFacts: imported.superseded,
    adjustments: [],
    confirmedZeros: [],
    materialityPercent: 0.001,
    overrides: [],
    baselineFiscalYear: 2025,
    provenance: sampleProvenance(),
    scenarios: [
      { id: "base", name: "Base case", assumptions: sampleAssumptions() },
      {
        id: "required",
        name: "What the price requires",
        assumptions: {
          ...sampleAssumptions(),
          forecast: {
            ...sampleAssumptions().forecast,
            growthRates: [0.09, 0.09, 0.09, 0.09, 0.09],
            targetMargin: 0.185,
          },
        },
      },
    ],
    activeScenarioId: "base",
    initiative: sampleInitiative(),
    operating: sampleOperating(),
    brief: {
      thesis: "",
      position: "",
      notes: "",
    },
  };
}
