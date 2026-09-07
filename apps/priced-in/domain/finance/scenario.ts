import type { ForecastAssumptions } from "./types";

/** Same forecast with one constant annual growth rate across all N years. */
export function withConstantGrowth(forecast: ForecastAssumptions, growth: number): ForecastAssumptions {
  return { ...forecast, growthRates: new Array<number>(forecast.years).fill(growth) };
}

/** Same forecast with a different year-N target margin. */
export function withTargetMargin(forecast: ForecastAssumptions, targetMargin: number): ForecastAssumptions {
  return { ...forecast, targetMargin };
}

/** Same forecast with one constant capex ratio across all N years. */
export function withConstantCapexRatio(forecast: ForecastAssumptions, ratio: number): ForecastAssumptions {
  return { ...forecast, capexRatios: new Array<number>(forecast.years).fill(ratio) };
}
