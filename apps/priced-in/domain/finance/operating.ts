export type OperatingTemplate = "customers" | "units";

export interface OperatingInputs {
  template: OperatingTemplate;
  /** Per forecast year. null means "not supplied" and produces an unavailable state. */
  annualRevenuePerCustomerUsd: Array<number | null>;
  averageRealizedPriceUsd: Array<number | null>;
  marketRevenueUsd: Array<number | null>;
  marketDefinition: string;
  /** Period end date of each market-size figure, so it can be matched to the forecast year. */
  marketAsOf: Array<string | null>;
}

export type DriverOutcome =
  | { available: true; value: number; label: string }
  | { available: false; reason: string };

export type ShareOutcome =
  | { available: true; share: number; exceedsMarket: boolean; marketAsOf: string | null }
  | { available: false; reason: string };

export interface OperatingYearResult {
  year: number;
  forecastRevenueUsd: number;
  requiredDriver: DriverOutcome;
  requiredMarketShare: ShareOutcome;
}

/**
 * Financial statements alone do not reveal customer counts, unit volumes, or
 * total market size. Anything not supplied is reported as unavailable rather
 * than assumed.
 */
export function computeOperatingBridge(
  forecastRevenueUsd: number[],
  inputs: OperatingInputs,
  forecastYearEnds: Array<string | null>,
): OperatingYearResult[] {
  return forecastRevenueUsd.map((revenue, index) => {
    const year = index + 1;
    const perUnit =
      inputs.template === "customers"
        ? inputs.annualRevenuePerCustomerUsd[index]
        : inputs.averageRealizedPriceUsd[index];
    const driverLabel = inputs.template === "customers" ? "customers" : "units";
    const missingLabel =
      inputs.template === "customers"
        ? "Annual revenue per customer is not supplied for this year."
        : "Average realized price is not supplied for this year.";

    const requiredDriver: DriverOutcome =
      perUnit === null || !Number.isFinite(perUnit) || perUnit <= 0
        ? { available: false, reason: missingLabel }
        : { available: true, value: revenue / perUnit, label: driverLabel };

    const marketRevenue = inputs.marketRevenueUsd[index];
    const marketAsOf = inputs.marketAsOf[index] ?? null;
    const forecastYearEnd = forecastYearEnds[index] ?? null;

    let requiredMarketShare: ShareOutcome;
    if (marketRevenue === null || !Number.isFinite(marketRevenue) || marketRevenue <= 0) {
      requiredMarketShare = {
        available: false,
        reason: "Same-year market revenue is not supplied, so a required share cannot be shown.",
      };
    } else if (marketAsOf === null || forecastYearEnd === null) {
      requiredMarketShare = {
        available: false,
        reason: "Both the forecast year end and the market-size date are needed before a share can be compared.",
      };
    } else if (marketAsOf.slice(0, 4) !== forecastYearEnd.slice(0, 4)) {
      requiredMarketShare = {
        available: false,
        reason: `Market size is dated ${marketAsOf} but the forecast year ends ${forecastYearEnd}. Dates must match.`,
      };
    } else {
      const share = revenue / marketRevenue;
      requiredMarketShare = { available: true, share, exceedsMarket: share > 1, marketAsOf };
    }

    return { year, forecastRevenueUsd: revenue, requiredDriver, requiredMarketShare };
  });
}
