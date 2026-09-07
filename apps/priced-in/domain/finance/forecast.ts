import { num, ONE, positivePart, type Num } from "./decimal";
import { assertFinite, EngineError } from "./errors";
import type { Baseline, ForecastAssumptions, YearProjection } from "./types";

function assertRatioArray(values: number[], years: number, field: string): void {
  if (!Array.isArray(values) || values.length !== years) {
    throw new EngineError(`${field} must contain exactly ${years} entries, received ${values?.length ?? 0}`);
  }
  values.forEach((value, index) => assertFinite(value, `${field}[${index}]`));
}

export function assertForecastShape(a: ForecastAssumptions): void {
  if (!Number.isInteger(a.years) || a.years < 1) {
    throw new EngineError(`Forecast horizon must be a positive whole number of years, received ${a.years}`);
  }
  assertRatioArray(a.growthRates, a.years, "growthRates");
  assertRatioArray(a.daRatios, a.years, "daRatios");
  assertRatioArray(a.capexRatios, a.years, "capexRatios");
  assertRatioArray(a.nwcRatios, a.years, "nwcRatios");
  assertFinite(a.startingMargin, "startingMargin");
  assertFinite(a.targetMargin, "targetMargin");
  assertFinite(a.taxRate, "taxRate");
  if (a.taxRate < 0 || a.taxRate > 1) {
    throw new EngineError(`taxRate must be a decimal rate between 0 and 1, received ${a.taxRate}`);
  }
}

/** Default linear path: startingMargin + (targetMargin - startingMargin) * t/N. */
export function marginForYear(a: ForecastAssumptions, year: number): Num {
  const start = num(a.startingMargin);
  const target = num(a.targetMargin);
  return start.plus(target.minus(start).times(year).div(a.years));
}

export function projectYears(baseline: Baseline, a: ForecastAssumptions): YearProjection[] {
  assertForecastShape(a);
  assertFinite(baseline.revenueUsd, "baseline.revenueUsd");
  assertFinite(baseline.operatingNwcUsd, "baseline.operatingNwcUsd");

  const taxRate = num(a.taxRate);
  const rows: YearProjection[] = [];
  let revenue = num(baseline.revenueUsd);
  let openingNwc = num(baseline.operatingNwcUsd);

  for (let t = 1; t <= a.years; t += 1) {
    revenue = revenue.times(ONE.plus(num(a.growthRates[t - 1])));
    const margin = marginForYear(a, t);
    const ebit = revenue.times(margin);
    // No immediate tax benefit on losses and no carryforward modelling.
    const cashTax = positivePart(ebit).times(taxRate);
    const nopat = ebit.minus(cashTax);
    const da = revenue.times(num(a.daRatios[t - 1]));
    const capex = revenue.times(num(a.capexRatios[t - 1]));
    const operatingNwc = revenue.times(num(a.nwcRatios[t - 1]));
    const deltaNwc = operatingNwc.minus(openingNwc);
    const fcff = nopat.plus(da).minus(capex).minus(deltaNwc);

    rows.push({ year: t, revenue, margin, ebit, cashTax, nopat, da, capex, operatingNwc, deltaNwc, fcff });
    openingNwc = operatingNwc;
  }

  return rows;
}
