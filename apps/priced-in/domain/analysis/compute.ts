import type { Outcome } from "../finance/errors";
import { computeInitiative, type InitiativePolicy, type InitiativeResult } from "../finance/initiative";
import { computeOperatingBridge, type OperatingYearResult } from "../finance/operating";
import type { EquityBridgeResult, ValuationRun } from "../finance/types";
import { computeValuation, equityBridge } from "../finance/valuation";
import { factsByYear } from "../intake/facts";
import { reconcile, type ReconciliationReport } from "../intake/reconcile";
import { activeAssumptions, targetEnterpriseValueUsd } from "./document";
import type { AnalysisDocument, AssumptionSet } from "./schema";

export interface AnalysisComputation {
  assumptions: AssumptionSet;
  valuation: Outcome<ValuationRun>;
  target: Outcome<number>;
  bridge: EquityBridgeResult | null;
  gapUsd: number | null;
  percentGap: number | null;
  initiative: Outcome<InitiativeResult> | null;
  operating: OperatingYearResult[] | null;
  reconciliation: ReconciliationReport;
  forecastYearEnds: string[];
  baselinePeriodEnd: string | null;
}

function shiftYear(isoDate: string, years: number): string {
  const [y, m, d] = isoDate.split("-");
  return `${Number(y) + years}-${m}-${d}`;
}

export function computeAnalysis(document: AnalysisDocument): AnalysisComputation {
  const assumptions = activeAssumptions(document);
  const valuation = computeValuation({
    baseline: assumptions.baseline,
    forecast: assumptions.forecast,
    terminal: assumptions.terminal,
  });
  const target = targetEnterpriseValueUsd(assumptions);

  const bridge = valuation.ok ? equityBridge(valuation.value.enterpriseValue, assumptions.bridge) : null;
  const gapUsd =
    valuation.ok && target.ok ? valuation.value.enterpriseValue.toNumber() - target.value : null;
  const percentGap = gapUsd !== null && target.ok && target.value > 0 ? gapUsd / target.value : null;

  let initiative: Outcome<InitiativeResult> | null = null;
  if (document.initiative.enabled && valuation.ok) {
    const policy: InitiativePolicy = {
      taxRate: assumptions.forecast.taxRate,
      wacc: assumptions.terminal.wacc,
      terminalGrowth: assumptions.terminal.terminalGrowth,
      terminalRoic: assumptions.terminal.terminalRoic,
    };
    initiative = computeInitiative(document.initiative, valuation.value, policy);
  }

  const baselinePeriodEnd =
    document.baselineFiscalYear === null
      ? null
      : (factsByYear(document.facts).get(document.baselineFiscalYear)?.get("revenue")?.periodEnd ?? null);

  const anchor = baselinePeriodEnd ?? assumptions.asOfDate;
  const forecastYearEnds = Array.from({ length: assumptions.forecast.years }, (_, index) => shiftYear(anchor, index + 1));

  const operating = valuation.ok
    ? computeOperatingBridge(
        valuation.value.years.map((row) => row.revenue.toNumber()),
        document.operating,
        forecastYearEnds,
      )
    : null;

  const reconciliation = reconcile({
    facts: document.facts,
    baselineFiscalYear: document.baselineFiscalYear,
    materialityPercent: document.materialityPercent,
    confirmedZeros: document.confirmedZeros,
  });

  return {
    assumptions,
    valuation,
    target,
    bridge,
    gapUsd,
    percentGap,
    initiative,
    operating,
    reconciliation,
    forecastYearEnds,
    baselinePeriodEnd,
  };
}
