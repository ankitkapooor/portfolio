import { z } from "zod";
import { CANONICAL_METRICS, SCALES } from "../intake/metrics";

export const ANALYSIS_SCHEMA_VERSION = 1;

const metricEnum = z.enum(CANONICAL_METRICS);
const scaleEnum = z.enum(SCALES);
const finite = z.number().finite();

export const reportedFactSchema = z.object({
  id: z.string(),
  company: z.string(),
  fiscalYear: z.number().int(),
  periodStart: z.string().nullable(),
  periodEnd: z.string(),
  statementType: z.enum(["income", "balance", "cashflow", "other"]),
  metric: metricEnum,
  rawValue: finite,
  unit: z.enum(["USD", "shares"]),
  scale: scaleEnum,
  multiplier: finite,
  normalizedValue: finite,
  sourceUrl: z.string(),
  sourceLocator: z.string(),
  filedAt: z.string(),
  reviewStatus: z.enum(["unreviewed", "accepted", "flagged"]),
  conversionNotes: z.array(z.string()),
  sourceHash: z.string(),
  rowNumber: z.number().int(),
});

export const normalizationAdjustmentSchema = z.object({
  id: z.string(),
  fiscalYear: z.number().int(),
  metric: metricEnum,
  amountUsd: finite,
  reason: z.string(),
  source: z.string(),
  createdAt: z.string(),
});

export const fieldProvenanceSchema = z.object({
  basis: z.enum(["reported", "assumed", "derived"]),
  asOf: z.string().optional(),
  sourceLocator: z.string().optional(),
  note: z.string().optional(),
});

export const forecastAssumptionsSchema = z.object({
  years: z.number().int().min(1).max(10),
  growthRates: z.array(finite),
  startingMargin: finite,
  targetMargin: finite,
  taxRate: finite.min(0).max(1),
  daRatios: z.array(finite),
  capexRatios: z.array(finite),
  nwcRatios: z.array(finite),
});

export const terminalAssumptionsSchema = z.object({
  wacc: finite,
  terminalGrowth: finite,
  terminalRoic: finite,
});

export const bridgeInputsSchema = z.object({
  excessCashUsd: finite,
  nonOperatingAssetsUsd: finite,
  financialDebtUsd: finite,
  preferredEquityUsd: finite,
  minorityInterestUsd: finite,
  dilutedShares: finite,
});

export const targetSchema = z.object({
  mode: z.enum(["price", "enterpriseValue"]),
  marketPricePerShare: finite.nullable(),
  priceAsOf: z.string().nullable(),
  enterpriseValueUsd: finite.nullable(),
});

export const assumptionSetSchema = z.object({
  asOfDate: z.string(),
  displayScale: scaleEnum,
  baseline: z.object({ revenueUsd: finite, operatingNwcUsd: finite }),
  forecast: forecastAssumptionsSchema,
  terminal: terminalAssumptionsSchema,
  bridge: bridgeInputsSchema,
  bridgeAsOf: z.string(),
  sharesAsOf: z.string(),
  sharesBasis: z.string(),
  requiredOperatingCashUsd: finite,
  target: targetSchema,
  mapBounds: z.object({
    growthMin: finite,
    growthMax: finite,
    marginMin: finite,
    marginMax: finite,
  }),
});

export const scenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  assumptions: assumptionSetSchema,
});

export const initiativeYearSchema = z.object({
  eligibleLaborCostUsd: finite,
  adoption: finite,
  grossEffortReduction: finite,
  reviewReworkCostUsd: finite,
  realizationFraction: finite,
  incrementalRevenueUsd: finite,
  contributionMargin: finite,
  cannibalizedRevenueUsd: finite,
  cannibalizedContributionMargin: finite,
  aiOperatingExpenseUsd: finite,
  implementationOperatingExpenseUsd: finite,
  aiCapexUsd: finite,
  aiDaUsd: finite,
  incrementalOperatingNwcUsd: finite,
});

export const initiativeSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  timeZeroImplementationCashUsd: finite,
  timeZeroCapexUsd: finite,
  years: z.array(initiativeYearSchema),
  persistence: z.enum(["none", "perpetuity"]),
  ongoingCostsConfirmed: z.boolean(),
  baselineOverlapResolved: z.boolean(),
});

export const operatingInputsSchema = z.object({
  template: z.enum(["customers", "units"]),
  annualRevenuePerCustomerUsd: z.array(finite.nullable()),
  averageRealizedPriceUsd: z.array(finite.nullable()),
  marketRevenueUsd: z.array(finite.nullable()),
  marketDefinition: z.string(),
  marketAsOf: z.array(z.string().nullable()),
});

export const analysisDocumentSchema = z.object({
  schemaVersion: z.literal(ANALYSIS_SCHEMA_VERSION),
  engineVersion: z.string(),
  formulaVersion: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  company: z.object({
    name: z.string(),
    ticker: z.string().nullable(),
    fictional: z.boolean(),
    currency: z.literal("USD"),
    note: z.string(),
  }),
  facts: z.array(reportedFactSchema),
  supersededFacts: z.array(reportedFactSchema),
  adjustments: z.array(normalizationAdjustmentSchema),
  confirmedZeros: z.array(metricEnum),
  materialityPercent: finite.min(0).max(1),
  overrides: z.array(z.object({ code: z.string(), reason: z.string(), at: z.string() })),
  baselineFiscalYear: z.number().int().nullable(),
  provenance: z.record(z.string(), fieldProvenanceSchema),
  scenarios: z.array(scenarioSchema).min(1),
  activeScenarioId: z.string(),
  initiative: initiativeSchema,
  operating: operatingInputsSchema,
  brief: z.object({ thesis: z.string(), position: z.string(), notes: z.string() }),
});

export type AnalysisDocument = z.infer<typeof analysisDocumentSchema>;
export type AssumptionSet = z.infer<typeof assumptionSetSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type StoredInitiative = z.infer<typeof initiativeSchema>;
export type NormalizationAdjustment = z.infer<typeof normalizationAdjustmentSchema>;
export type FieldProvenance = z.infer<typeof fieldProvenanceSchema>;
