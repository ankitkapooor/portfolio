import { SCALE_MULTIPLIERS, type Scale } from "./intake/metrics";

export const SCALE_SUFFIX: Record<Scale, string> = {
  units: "",
  thousands: "k",
  millions: "m",
  billions: "bn",
};

export const SCALE_LABEL: Record<Scale, string> = {
  units: "USD",
  thousands: "USD thousands",
  millions: "USD millions",
  billions: "USD billions",
};

/** Currency for display only. All arithmetic stays in unrounded base USD. */
export function formatUsd(valueUsd: number | null | undefined, scale: Scale = "millions", digits = 1): string {
  if (valueUsd === null || valueUsd === undefined || !Number.isFinite(valueUsd)) return "—";
  const scaled = valueUsd / SCALE_MULTIPLIERS[scale];
  const sign = scaled < 0 ? "-" : "";
  return `${sign}$${Math.abs(scaled).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}${SCALE_SUFFIX[scale]}`;
}

export function formatPerShare(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(rate: number | null | undefined, digits = 1): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return "—";
  return `${(rate * 100).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function formatCount(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatShares(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${(value / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}m shares`;
}
