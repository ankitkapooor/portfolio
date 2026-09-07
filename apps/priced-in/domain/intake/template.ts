import { toCsv } from "./csv";
import { TEMPLATE_COLUMNS } from "./facts";
import { CANONICAL_METRICS, METRIC_DEFINITIONS } from "./metrics";

/**
 * Blank long-form template: one skeleton row per canonical metric with the
 * unit, scale and statement prefilled. Values are left empty on purpose — an
 * empty value is rejected at import rather than read as zero.
 */
export function blankTemplateCsv(fiscalYear: number, periodStart: string, periodEnd: string): string {
  const rows: Array<Array<string | number>> = [[...TEMPLATE_COLUMNS]];
  for (const metric of CANONICAL_METRICS) {
    const definition = METRIC_DEFINITIONS[metric];
    rows.push([
      "",
      fiscalYear,
      definition.timing === "flow" ? periodStart : "",
      periodEnd,
      definition.statement,
      metric,
      "",
      definition.unit,
      "units",
      "",
      "",
      "",
    ]);
  }
  return toCsv(rows);
}
