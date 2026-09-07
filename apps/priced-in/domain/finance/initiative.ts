import { discountFactor, num, ONE, positivePart, sum, ZERO, type Num } from "./decimal";
import { fail, ok, type EngineIssue, type Outcome } from "./errors";
import { terminalValue } from "./terminal";
import type { TerminalResult, ValuationRun } from "./types";

/** Inputs for one initiative year. Amounts are USD; fractions are decimals in [0,1]. */
export interface InitiativeYearInputs {
  eligibleLaborCostUsd: number;
  adoption: number;
  grossEffortReduction: number;
  reviewReworkCostUsd: number;
  realizationFraction: number;
  incrementalRevenueUsd: number;
  contributionMargin: number;
  cannibalizedRevenueUsd: number;
  cannibalizedContributionMargin: number;
  aiOperatingExpenseUsd: number;
  implementationOperatingExpenseUsd: number;
  aiCapexUsd: number;
  aiDaUsd: number;
  /** Level of incremental operating NWC at the end of the year, not the change. */
  incrementalOperatingNwcUsd: number;
}

export type PersistencePolicy = "none" | "perpetuity";

/** Model-level policy the overlay must share with the baseline run. */
export interface InitiativePolicy {
  taxRate: number;
  wacc: number;
  terminalGrowth: number;
  terminalRoic: number;
}

export interface InitiativeInputs {
  name: string;
  /** Cash spent before year one. Subtracted undiscounted at t=0 and never repeated in year one. */
  timeZeroImplementationCashUsd: number;
  timeZeroCapexUsd: number;
  years: InitiativeYearInputs[];
  persistence: PersistencePolicy;
  /**
   * The perpetuity policy is only available when the user confirms that ongoing
   * AI operating cost and reinvestment are already inside the year-N figures.
   */
  ongoingCostsConfirmed: boolean;
  /** Set when the baseline forecast already embeds AI savings that must be removed first. */
  baselineOverlapResolved: boolean;
}

export interface InitiativeYearResult {
  year: number;
  grossCapacityUsd: Num;
  netCapacityUsd: Num;
  realizedLaborBenefitUsd: Num;
  incrementalEbitUsd: Num;
  baselineCashTaxUsd: Num;
  scenarioCashTaxUsd: Num;
  incrementalTaxUsd: Num;
  deltaIncrementalNwcUsd: Num;
  incrementalFcffUsd: Num;
  discountedIncrementalFcffUsd: Num;
}

export interface InitiativeResult {
  timeZeroOutflowUsd: Num;
  years: InitiativeYearResult[];
  /** Finite-horizon incremental NPV: -t0 outflow + discounted incremental FCFF. */
  finiteHorizonNpvUsd: Num;
  terminal: TerminalResult | null;
  discountedTerminalUsd: Num;
  /** Incremental enterprise value under the chosen persistence policy. */
  incrementalEnterpriseValueUsd: Num;
  persistence: PersistencePolicy;
  notes: string[];
}

function fractionIssue(value: number, field: string, label: string): EngineIssue | null {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return {
      code: "fraction_out_of_range",
      field,
      message: `${label} must be a fraction between 0 and 1, received ${String(value)}.`,
    };
  }
  return null;
}

export function validateInitiative(inputs: InitiativeInputs, forecastYears: number): EngineIssue[] {
  const issues: EngineIssue[] = [];
  if (inputs.years.length !== forecastYears) {
    issues.push({
      code: "initiative_year_count",
      field: "years",
      message: `The initiative needs exactly ${forecastYears} yearly rows to line up with the forecast.`,
    });
    return issues;
  }
  inputs.years.forEach((y, index) => {
    const label = `Year ${index + 1}`;
    const checks: Array<[number, string, string]> = [
      [y.adoption, `years[${index}].adoption`, `${label} adoption`],
      [y.grossEffortReduction, `years[${index}].grossEffortReduction`, `${label} gross effort reduction`],
      [y.realizationFraction, `years[${index}].realizationFraction`, `${label} realizable fraction`],
      [y.contributionMargin, `years[${index}].contributionMargin`, `${label} contribution margin`],
      [
        y.cannibalizedContributionMargin,
        `years[${index}].cannibalizedContributionMargin`,
        `${label} cannibalized contribution margin`,
      ],
    ];
    for (const [value, field, text] of checks) {
      const issue = fractionIssue(value, field, text);
      if (issue) issues.push(issue);
    }
  });
  if (!inputs.baselineOverlapResolved) {
    issues.push({
      code: "baseline_overlap_unresolved",
      field: "baselineOverlapResolved",
      message:
        "Confirm that the baseline forecast does not already include these AI savings before applying an incremental overlay.",
    });
  }
  return issues;
}

/**
 * Incremental economics of one initiative, measured against the baseline run.
 * Tax is the whole-company difference, so a loss-making baseline cannot create
 * a phantom tax shield.
 */
export function computeInitiative(
  inputs: InitiativeInputs,
  baseline: ValuationRun,
  policy: InitiativePolicy,
): Outcome<InitiativeResult> {
  const issues = validateInitiative(inputs, baseline.years.length);
  if (issues.length > 0) return fail(issues);

  const tax = num(policy.taxRate);
  const waccNum = num(policy.wacc);
  const notes: string[] = [];
  const years: InitiativeYearResult[] = [];
  let openingNwc = ZERO;

  inputs.years.forEach((y, index) => {
    const year = index + 1;
    const grossCapacityUsd = num(y.eligibleLaborCostUsd)
      .times(num(y.adoption))
      .times(num(y.grossEffortReduction));
    const netCapacityUsd = grossCapacityUsd.minus(num(y.reviewReworkCostUsd));
    // Deliberately not clamped: a negative net benefit is a real result.
    const realizedLaborBenefitUsd = netCapacityUsd.times(num(y.realizationFraction));

    const incrementalEbitUsd = realizedLaborBenefitUsd
      .plus(num(y.incrementalRevenueUsd).times(num(y.contributionMargin)))
      .minus(num(y.cannibalizedRevenueUsd).times(num(y.cannibalizedContributionMargin)))
      .minus(num(y.aiOperatingExpenseUsd))
      .minus(num(y.implementationOperatingExpenseUsd))
      .minus(num(y.aiDaUsd));

    const baselineEbit = baseline.years[index].ebit;
    const baselineCashTaxUsd = positivePart(baselineEbit).times(tax);
    const scenarioCashTaxUsd = positivePart(baselineEbit.plus(incrementalEbitUsd)).times(tax);
    const incrementalTaxUsd = scenarioCashTaxUsd.minus(baselineCashTaxUsd);

    const closingNwc = num(y.incrementalOperatingNwcUsd);
    const deltaIncrementalNwcUsd = closingNwc.minus(openingNwc);
    openingNwc = closingNwc;

    const incrementalFcffUsd = incrementalEbitUsd
      .minus(incrementalTaxUsd)
      .plus(num(y.aiDaUsd))
      .minus(num(y.aiCapexUsd))
      .minus(deltaIncrementalNwcUsd);

    years.push({
      year,
      grossCapacityUsd,
      netCapacityUsd,
      realizedLaborBenefitUsd,
      incrementalEbitUsd,
      baselineCashTaxUsd,
      scenarioCashTaxUsd,
      incrementalTaxUsd,
      deltaIncrementalNwcUsd,
      incrementalFcffUsd,
      discountedIncrementalFcffUsd: incrementalFcffUsd.times(discountFactor(waccNum, year)),
    });
  });

  // Time-zero spend is subtracted once, undiscounted, and is not repeated in year one.
  const timeZeroOutflowUsd = num(inputs.timeZeroImplementationCashUsd).plus(num(inputs.timeZeroCapexUsd));
  const finiteHorizonNpvUsd = sum(years.map((y) => y.discountedIncrementalFcffUsd)).minus(timeZeroOutflowUsd);

  let terminal: TerminalResult | null = null;
  let discountedTerminalUsd = ZERO;

  if (inputs.persistence === "perpetuity") {
    if (!inputs.ongoingCostsConfirmed) {
      return fail([
        {
          code: "persistence_costs_unconfirmed",
          field: "ongoingCostsConfirmed",
          message:
            "A persistent AI benefit can only be valued once ongoing operating cost and reinvestment for that benefit are confirmed inside the year-N figures.",
        },
      ]);
    }
    const finalYear = years[years.length - 1];
    const terminalNopat = finalYear.incrementalEbitUsd
      .minus(finalYear.incrementalTaxUsd)
      .times(ONE.plus(num(policy.terminalGrowth)));
    const outcome = terminalValue({
      terminalNopatUsd: terminalNopat,
      growth: policy.terminalGrowth,
      terminalRoic: policy.terminalRoic,
      wacc: policy.wacc,
    });
    if (!outcome.ok) return fail(outcome.issues);
    terminal = outcome.value;
    discountedTerminalUsd = outcome.value.value.times(discountFactor(waccNum, years.length));
    notes.push(
      "Persistent-benefit policy: the year-five incremental NOPAT is grown at the model terminal growth rate and reinvested at the model terminal ROIC. This is a disclosed policy choice, not a management estimate.",
    );
  } else {
    notes.push("Default policy: no initiative benefit is valued after year five.");
  }

  return ok({
    timeZeroOutflowUsd,
    years,
    finiteHorizonNpvUsd,
    terminal,
    discountedTerminalUsd,
    incrementalEnterpriseValueUsd: finiteHorizonNpvUsd.plus(discountedTerminalUsd),
    persistence: inputs.persistence,
    notes,
  });
}

export interface RequiredBenefitInput {
  inputs: InitiativeInputs;
  baseline: ValuationRun;
  policy: InitiativePolicy;
  /** Enterprise-value shortfall the initiative would have to close. */
  gapToCloseUsd: number;
}

export type RequiredBenefitResult =
  | { status: "not_required"; message: string }
  | { status: "solved"; annualRealizedBenefitUsd: number; message: string }
  | { status: "exceeds_eligible_base"; largestEligibleBaseUsd: number; message: string }
  | { status: "invalid"; issues: EngineIssue[] };

/**
 * Solves for one declared unknown: the flat annual realized labour benefit needed
 * to close the value gap. Bounded above by the largest eligible labour cost base.
 */
export function solveRequiredLaborBenefit(input: RequiredBenefitInput): RequiredBenefitResult {
  const validation = validateInitiative(input.inputs, input.baseline.years.length);
  if (validation.length > 0) return { status: "invalid", issues: validation };

  const largestEligibleBaseUsd = Math.max(...input.inputs.years.map((y) => y.eligibleLaborCostUsd), 0);

  const npvAt = (benefitUsd: number): number | null => {
    const scenario: InitiativeInputs = {
      ...input.inputs,
      years: input.inputs.years.map((y) => ({
        ...y,
        // Express the unknown directly as realized benefit: capacity inputs are
        // replaced so the ramp assumption is explicit and flat.
        eligibleLaborCostUsd: benefitUsd,
        adoption: 1,
        grossEffortReduction: 1,
        reviewReworkCostUsd: 0,
        realizationFraction: 1,
      })),
    };
    const outcome = computeInitiative(scenario, input.baseline, input.policy);
    return outcome.ok ? outcome.value.incrementalEnterpriseValueUsd.toNumber() : null;
  };

  const atZero = npvAt(0);
  if (atZero === null) return { status: "invalid", issues: [{ code: "overlay_unsupported", message: "The overlay could not be evaluated." }] };
  if (atZero >= input.gapToCloseUsd) {
    return {
      status: "not_required",
      message: "The initiative already closes the stated gap without any additional labour benefit.",
    };
  }

  const atMax = npvAt(largestEligibleBaseUsd);
  if (atMax === null || atMax < input.gapToCloseUsd) {
    return {
      status: "exceeds_eligible_base",
      largestEligibleBaseUsd,
      message:
        "The required benefit exceeds the eligible labour cost base. A labour-only route cannot meet the target under these assumptions.",
    };
  }

  let lo = 0;
  let hi = largestEligibleBaseUsd;
  const tolerance = Math.max(1, Math.abs(input.gapToCloseUsd) * 0.0001);
  for (let i = 0; i < 200 && hi - lo > 1e-6; i += 1) {
    const mid = (lo + hi) / 2;
    const value = npvAt(mid);
    if (value === null) break;
    if (Math.abs(value - input.gapToCloseUsd) <= tolerance) {
      lo = mid;
      hi = mid;
      break;
    }
    if (value < input.gapToCloseUsd) lo = mid;
    else hi = mid;
  }

  const solved = (lo + hi) / 2;
  return {
    status: "solved",
    annualRealizedBenefitUsd: solved,
    message:
      "Assumed ramp: the same realized labour benefit in every forecast year. Change the yearly inputs to model a different ramp.",
  };
}
