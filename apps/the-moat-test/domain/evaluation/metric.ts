/**
 * A metric that can legitimately have no value.
 *
 * BRD section 7 is explicit: precision with no predictions and recall with no gold
 * actions are N/A, not zero and not infinity. Modelling that as a union rather than
 * a nullable number means a caller cannot accidentally render 0 for "undefined".
 */
export type Metric =
  | {
      status: "ok";
      value: number;
      numerator: number;
      denominator: number;
    }
  | {
      status: "not-applicable";
      reason: string;
      numerator: number;
      denominator: number;
    };

export function ratio(
  numerator: number,
  denominator: number,
  notApplicableReason: string,
): Metric {
  if (denominator === 0) {
    return {
      status: "not-applicable",
      reason: notApplicableReason,
      numerator,
      denominator,
    };
  }
  return { status: "ok", value: numerator / denominator, numerator, denominator };
}

/** Harmonic mean, defined only when both inputs exist and are not both zero. */
export function harmonicMean(a: Metric, b: Metric): Metric {
  if (a.status !== "ok" || b.status !== "ok") {
    return {
      status: "not-applicable",
      reason: "F1 needs both precision and recall to be defined.",
      numerator: 0,
      denominator: 0,
    };
  }
  if (a.value + b.value === 0) {
    return {
      status: "not-applicable",
      reason: "F1 is undefined when precision and recall are both zero.",
      numerator: 0,
      denominator: 0,
    };
  }
  return {
    status: "ok",
    value: (2 * a.value * b.value) / (a.value + b.value),
    numerator: 2 * a.value * b.value,
    denominator: a.value + b.value,
  };
}

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Display form. Never renders a number for an N/A metric. */
export function formatMetric(metric: Metric, digits = 2): string {
  if (metric.status === "not-applicable") return "N/A";
  return metric.value.toFixed(digits);
}

export function metricDenominatorLabel(metric: Metric): string {
  if (metric.status === "not-applicable") return metric.reason;
  return `${metric.numerator} of ${metric.denominator}`;
}

/**
 * Nearest-rank percentile on a sorted copy. Documented rather than assumed, because
 * percentile conventions differ and a p95 over twelve samples is close to the max.
 */
export function percentile(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  const index = Math.min(Math.max(rank, 1), sorted.length) - 1;
  return sorted[index];
}
