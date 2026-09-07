import Decimal from "decimal.js";

/**
 * Cloned constructor so nothing outside the engine can change rounding or
 * precision behaviour by touching the global `Decimal` config.
 */
export const D = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -30,
  toExpPos: 40,
});

/** An unrounded amount. Currency amounts are USD; rates are decimals (0.1 = 10%). */
export type Num = Decimal;

export function num(value: Decimal.Value): Num {
  return new D(value);
}

export const ZERO: Num = num(0);
export const ONE: Num = num(1);

export function sum(values: Num[]): Num {
  return values.reduce<Num>((acc, value) => acc.plus(value), ZERO);
}

/** max(value, 0) — used for the cash-tax base, which has no loss benefit. */
export function positivePart(value: Num): Num {
  return value.isNegative() ? ZERO : value;
}

/** Discount factor for end-of-year discounting: 1 / (1 + rate)^year. */
export function discountFactor(rate: Num, year: number): Num {
  return ONE.div(ONE.plus(rate).pow(year));
}
