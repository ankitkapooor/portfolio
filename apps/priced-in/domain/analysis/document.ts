import { fail, ok, type Outcome } from "../finance/errors";
import { ENGINE_VERSION, FORMULA_VERSION } from "../finance/types";
import { marketEnterpriseValue } from "../finance/valuation";
import { factsByYear, type ReportedFact } from "../intake/facts";
import {
  analysisDocumentSchema,
  ANALYSIS_SCHEMA_VERSION,
  type AnalysisDocument,
  type AssumptionSet,
  type Scenario,
} from "./schema";

export function activeScenario(document: AnalysisDocument): Scenario {
  return document.scenarios.find((scenario) => scenario.id === document.activeScenarioId) ?? document.scenarios[0];
}

export function activeAssumptions(document: AnalysisDocument): AssumptionSet {
  return activeScenario(document).assumptions;
}

export function withUpdatedAssumptions(
  document: AnalysisDocument,
  update: (current: AssumptionSet) => AssumptionSet,
): AnalysisDocument {
  const activeId = activeScenario(document).id;
  return {
    ...document,
    updatedAt: new Date().toISOString(),
    scenarios: document.scenarios.map((scenario) =>
      scenario.id === activeId ? { ...scenario, assumptions: update(scenario.assumptions) } : scenario,
    ),
  };
}

/**
 * Baseline revenue and operating NWC read straight from reviewed facts.
 * Operating NWC excludes cash and debt by construction.
 */
export function deriveBaselineFromFacts(
  facts: ReportedFact[],
  fiscalYear: number,
): { revenueUsd: number; operatingNwcUsd: number } | null {
  const year = factsByYear(facts).get(fiscalYear);
  const revenue = year?.get("revenue")?.normalizedValue;
  const assets = year?.get("currentOperatingAssets")?.normalizedValue;
  const liabilities = year?.get("currentOperatingLiabilities")?.normalizedValue;
  if (revenue === undefined || assets === undefined || liabilities === undefined) return null;
  return { revenueUsd: revenue, operatingNwcUsd: assets - liabilities };
}

/** The enterprise value the analysis is being tested against. */
export function targetEnterpriseValueUsd(assumptions: AssumptionSet): Outcome<number> {
  if (assumptions.target.mode === "enterpriseValue") {
    const value = assumptions.target.enterpriseValueUsd;
    if (value === null || value <= 0) {
      return fail([
        {
          code: "target_ev_missing",
          field: "target.enterpriseValueUsd",
          message: "Enter a positive enterprise-value target, or switch to a dated market price.",
        },
      ]);
    }
    return ok(value);
  }

  const price = assumptions.target.marketPricePerShare;
  if (price === null) {
    return fail([
      {
        code: "price_missing",
        field: "target.marketPricePerShare",
        message: "Enter a dated market price per share, or switch to a direct enterprise-value target.",
      },
    ]);
  }
  const outcome = marketEnterpriseValue(price, assumptions.bridge);
  if (!outcome.ok) return outcome;
  return ok(outcome.value.toNumber());
}

const DEFAULT_YEARS = 5;

function repeat(value: number): number[] {
  return new Array<number>(DEFAULT_YEARS).fill(value);
}

/**
 * Builds a working analysis from imported facts. Ratios default to the reviewed
 * baseline year and are recorded as derived, never accepted invisibly.
 */
export function createDocumentFromImport(params: {
  companyName: string;
  facts: ReportedFact[];
  superseded: ReportedFact[];
  baselineFiscalYear: number;
  now: string;
}): AnalysisDocument {
  const { companyName, facts, superseded, baselineFiscalYear, now } = params;
  const year = factsByYear(facts).get(baselineFiscalYear);
  const read = (metric: Parameters<NonNullable<typeof year>["get"]>[0]): number | null =>
    year?.get(metric)?.normalizedValue ?? null;

  const revenue = read("revenue") ?? 0;
  const ebit = read("ebit");
  const da = read("depreciationAmortization");
  const capex = read("capex");
  const operatingAssets = read("currentOperatingAssets");
  const operatingLiabilities = read("currentOperatingLiabilities");
  const operatingNwc =
    operatingAssets === null || operatingLiabilities === null ? 0 : operatingAssets - operatingLiabilities;
  const ratio = (value: number | null): number | null => (value === null || revenue <= 0 ? null : value / revenue);

  const startingMargin = ratio(ebit) ?? 0.1;
  const periodEnd = year?.get("revenue")?.periodEnd ?? now.slice(0, 10);
  const reportedCash = read("cash");

  const provenance: AnalysisDocument["provenance"] = {
    "baseline.revenueUsd": { basis: "reported", asOf: periodEnd, sourceLocator: year?.get("revenue")?.sourceLocator },
    "baseline.operatingNwcUsd": {
      basis: "derived",
      asOf: periodEnd,
      note: "Current operating assets less current operating liabilities. Cash and debt are excluded.",
    },
    "forecast.startingMargin": { basis: "derived", asOf: periodEnd, note: "Baseline-year EBIT divided by baseline-year revenue." },
    "forecast.daRatios": { basis: "derived", asOf: periodEnd, note: "Baseline-year depreciation and amortisation as a share of revenue." },
    "forecast.capexRatios": { basis: "derived", asOf: periodEnd, note: "Baseline-year capital expenditure as a share of revenue." },
    "forecast.nwcRatios": { basis: "derived", asOf: periodEnd, note: "Baseline-year operating working capital as a share of revenue." },
    "bridge.excessCashUsd": {
      basis: "assumed",
      asOf: periodEnd,
      note:
        reportedCash === null
          ? "No cash balance was supplied. Excess cash starts at zero and must be set explicitly."
          : `Reported cash is ${reportedCash.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD. Only the excess above required operating cash belongs in the bridge, so this starts at zero until you set it.`,
    },
    "terminal.wacc": { basis: "assumed", note: "User-entered weighted average cost of capital." },
  };

  const assumptions: AssumptionSet = {
    asOfDate: now.slice(0, 10),
    displayScale: "millions",
    baseline: { revenueUsd: revenue, operatingNwcUsd: operatingNwc },
    forecast: {
      years: DEFAULT_YEARS,
      growthRates: repeat(0.03),
      startingMargin,
      targetMargin: startingMargin,
      taxRate: 0.25,
      daRatios: repeat(ratio(da) ?? 0.03),
      capexRatios: repeat(ratio(capex) ?? 0.03),
      nwcRatios: repeat(revenue > 0 ? operatingNwc / revenue : 0),
    },
    terminal: { wacc: 0.09, terminalGrowth: 0.02, terminalRoic: 0.12 },
    bridge: {
      excessCashUsd: 0,
      nonOperatingAssetsUsd: read("nonOperatingAssets") ?? 0,
      financialDebtUsd: read("totalDebt") ?? 0,
      preferredEquityUsd: read("preferredEquity") ?? 0,
      minorityInterestUsd: read("minorityInterest") ?? 0,
      dilutedShares: read("sharesOutstanding") ?? 0,
    },
    bridgeAsOf: periodEnd,
    sharesAsOf: periodEnd,
    sharesBasis:
      "Imported shares outstanding. Replace this with a reviewed current fully diluted estimate before relying on a per-share value.",
    requiredOperatingCashUsd: 0,
    target: { mode: "enterpriseValue", marketPricePerShare: null, priceAsOf: null, enterpriseValueUsd: null },
    mapBounds: { growthMin: -0.05, growthMax: 0.3, marginMin: 0.05, marginMax: 0.4 },
  };

  return {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    formulaVersion: FORMULA_VERSION,
    createdAt: now,
    updatedAt: now,
    company: {
      name: companyName,
      ticker: null,
      fictional: false,
      currency: "USD",
      note: "Imported from a CSV supplied by the person using this tool. No professional finance review has taken place.",
    },
    facts,
    supersededFacts: superseded,
    adjustments: [],
    confirmedZeros: [],
    materialityPercent: 0.001,
    overrides: [],
    baselineFiscalYear,
    provenance,
    scenarios: [{ id: "base", name: "Base case", assumptions }],
    activeScenarioId: "base",
    initiative: {
      name: "Unnamed initiative",
      enabled: false,
      timeZeroImplementationCashUsd: 0,
      timeZeroCapexUsd: 0,
      years: new Array(DEFAULT_YEARS).fill(null).map(() => ({
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
      })),
      persistence: "none",
      ongoingCostsConfirmed: false,
      baselineOverlapResolved: false,
    },
    operating: {
      template: "customers",
      annualRevenuePerCustomerUsd: new Array<number | null>(DEFAULT_YEARS).fill(null),
      averageRealizedPriceUsd: new Array<number | null>(DEFAULT_YEARS).fill(null),
      marketRevenueUsd: new Array<number | null>(DEFAULT_YEARS).fill(null),
      marketDefinition: "",
      marketAsOf: new Array<string | null>(DEFAULT_YEARS).fill(null),
    },
    brief: { thesis: "", position: "", notes: "" },
  };
}

export function serializeAnalysis(document: AnalysisDocument): string {
  return JSON.stringify(document, null, 2);
}

export type ParseAnalysisResult =
  | { ok: true; document: AnalysisDocument }
  | { ok: false; issues: string[] };

/** Corrupt or foreign files are rejected with a readable list of problems. */
export function parseAnalysis(text: string): ParseAnalysisResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return { ok: false, issues: [`The file is not valid JSON: ${(error as Error).message}`] };
  }

  const parsed = analysisDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 12)
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
    if (parsed.error.issues.length > 12) issues.push(`...and ${parsed.error.issues.length - 12} more problems.`);
    return { ok: false, issues };
  }

  const document = parsed.data;
  const errors: string[] = [];
  for (const scenario of document.scenarios) {
    const { forecast } = scenario.assumptions;
    const lengths = [forecast.growthRates, forecast.daRatios, forecast.capexRatios, forecast.nwcRatios];
    if (lengths.some((list) => list.length !== forecast.years)) {
      errors.push(`Scenario "${scenario.name}": yearly ratio arrays must each hold ${forecast.years} values.`);
    }
  }
  if (!document.scenarios.some((scenario) => scenario.id === document.activeScenarioId)) {
    errors.push("activeScenarioId does not match any scenario in the file.");
  }
  if (document.initiative.years.length !== activeAssumptions(document).forecast.years) {
    errors.push("The initiative must hold one row per forecast year.");
  }
  if (errors.length > 0) return { ok: false, issues: errors };

  return { ok: true, document };
}
