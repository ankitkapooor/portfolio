import {
  isCanonicalMetric,
  isScale,
  METRIC_DEFINITIONS,
  SCALE_MULTIPLIERS,
  type CanonicalMetric,
  type MetricUnit,
  type Scale,
  type StatementType,
} from "./metrics";

export type ReviewStatus = "unreviewed" | "accepted" | "flagged";

export interface ReportedFact {
  id: string;
  company: string;
  fiscalYear: number;
  periodStart: string | null;
  periodEnd: string;
  statementType: StatementType;
  metric: CanonicalMetric;
  /** Exactly as supplied, before scale or sign conversion. */
  rawValue: number;
  unit: MetricUnit;
  scale: Scale;
  multiplier: number;
  /** Base USD (or base share count) after scale and sign conversion. */
  normalizedValue: number;
  sourceUrl: string;
  sourceLocator: string;
  filedAt: string;
  reviewStatus: ReviewStatus;
  conversionNotes: string[];
  sourceHash: string;
  rowNumber: number;
}

export type IssueSeverity = "blocking" | "warning" | "info";

export interface IntakeIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  rowNumber?: number;
  metric?: string;
  fiscalYear?: number;
}

export interface NormalizationResult {
  facts: ReportedFact[];
  /** Earlier filings replaced by a later one for the same company/year/metric. */
  superseded: ReportedFact[];
  issues: IntakeIssue[];
}

export const TEMPLATE_COLUMNS = [
  "company",
  "fiscalYear",
  "periodStart",
  "periodEnd",
  "statementType",
  "metric",
  "value",
  "unit",
  "scale",
  "sourceUrl",
  "sourceLocator",
  "filedAt",
] as const;

/** Deterministic content fingerprint for a source row. Not a security hash. */
export function hashRow(parts: string[]): string {
  let hash = 5381;
  const joined = parts.join("\u0001");
  for (let i = 0; i < joined.length; i += 1) {
    hash = ((hash << 5) + hash + joined.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export interface NormalizeOptions {
  /** Rows dated after this are rejected as future periods. */
  today: string;
  expectedCurrency?: string;
}

/**
 * Turns long-form template rows into canonical facts. Raw values are preserved
 * next to normalized base-USD values, and nothing is inferred or defaulted.
 */
export function normalizeRows(rows: string[][], options: NormalizeOptions): NormalizationResult {
  const issues: IntakeIssue[] = [];
  const facts: ReportedFact[] = [];

  if (rows.length === 0) {
    return { facts: [], superseded: [], issues: [{ severity: "blocking", code: "empty_file", message: "The file contains no rows." }] };
  }

  const header = rows[0].map((cell) => cell.trim());
  const missingColumns = TEMPLATE_COLUMNS.filter((column) => !header.includes(column));
  if (missingColumns.length > 0) {
    return {
      facts: [],
      superseded: [],
      issues: [
        {
          severity: "blocking",
          code: "missing_columns",
          message: `The file is missing required template columns: ${missingColumns.join(", ")}. Download the template and try again.`,
        },
      ],
    };
  }

  const columnIndex = Object.fromEntries(header.map((name, index) => [name, index])) as Record<string, number>;
  const todayDate = parseDate(options.today);
  const companies = new Set<string>();

  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r];
    const rowNumber = r + 1;
    const get = (column: string): string => (cells[columnIndex[column]] ?? "").trim();

    const company = get("company");
    const metricRaw = get("metric");
    const valueRaw = get("value");
    const unitRaw = get("unit");
    const scaleRaw = get("scale");
    const periodStartRaw = get("periodStart");
    const periodEndRaw = get("periodEnd");
    const fiscalYearRaw = get("fiscalYear");
    const statementRaw = get("statementType") || "other";

    if (company === "") {
      issues.push({ severity: "blocking", code: "missing_company", message: "Row is missing a company name.", rowNumber });
      continue;
    }
    companies.add(company);

    if (!isCanonicalMetric(metricRaw)) {
      issues.push({
        severity: "blocking",
        code: "unknown_metric",
        message: `"${metricRaw}" is not a supported canonical metric. Unmapped facts stay unresolved rather than being guessed.`,
        rowNumber,
        metric: metricRaw,
      });
      continue;
    }
    const definition = METRIC_DEFINITIONS[metricRaw];

    const rawValue = Number(valueRaw.replace(/,/g, ""));
    if (valueRaw === "" || !Number.isFinite(rawValue)) {
      issues.push({
        severity: "blocking",
        code: "non_numeric_value",
        message: `Value "${valueRaw}" is not a number. Blank values are never treated as zero.`,
        rowNumber,
        metric: metricRaw,
      });
      continue;
    }

    if (!isScale(scaleRaw)) {
      issues.push({
        severity: "blocking",
        code: "unknown_scale",
        message: `Scale "${scaleRaw}" is not recognised. Use units, thousands, millions or billions.`,
        rowNumber,
        metric: metricRaw,
      });
      continue;
    }

    if (unitRaw !== definition.unit) {
      issues.push({
        severity: "blocking",
        code: "unit_mismatch",
        message: `${definition.label} must be reported in ${definition.unit}, but this row says "${unitRaw}". Share counts and currency amounts are never interchangeable.`,
        rowNumber,
        metric: metricRaw,
      });
      continue;
    }
    if (options.expectedCurrency && definition.unit === "USD" && options.expectedCurrency !== "USD") {
      issues.push({
        severity: "blocking",
        code: "currency_not_supported",
        message: `This release supports USD reporting only; the file declares ${options.expectedCurrency}.`,
        rowNumber,
      });
      continue;
    }

    const periodEnd = parseDate(periodEndRaw);
    if (!periodEnd) {
      issues.push({
        severity: "blocking",
        code: "bad_period_end",
        message: `periodEnd "${periodEndRaw}" is not an ISO date (YYYY-MM-DD).`,
        rowNumber,
        metric: metricRaw,
      });
      continue;
    }
    if (todayDate && periodEnd.getTime() > todayDate.getTime()) {
      issues.push({
        severity: "blocking",
        code: "future_period",
        message: `periodEnd ${periodEndRaw} is in the future. Reported facts cannot be dated after today (${options.today}).`,
        rowNumber,
        metric: metricRaw,
      });
      continue;
    }

    let periodStart: string | null = null;
    if (definition.timing === "flow") {
      const start = parseDate(periodStartRaw);
      if (!start) {
        issues.push({
          severity: "blocking",
          code: "missing_period_start",
          message: `${definition.label} is a flow item and needs both periodStart and periodEnd.`,
          rowNumber,
          metric: metricRaw,
        });
        continue;
      }
      const length = daysBetween(start, periodEnd);
      if (length <= 0) {
        issues.push({
          severity: "blocking",
          code: "incoherent_period",
          message: `periodStart ${periodStartRaw} is not before periodEnd ${periodEndRaw}.`,
          rowNumber,
          metric: metricRaw,
        });
        continue;
      }
      if (length < 300) {
        issues.push({
          severity: "blocking",
          code: "not_annual_period",
          message: `${definition.label} covers ${length} days, which is not a full fiscal year. Annual and year-to-date periods are never combined.`,
          rowNumber,
          metric: metricRaw,
        });
        continue;
      }
      if (length > 400) {
        issues.push({
          severity: "warning",
          code: "long_period",
          message: `${definition.label} covers ${length} days, longer than a normal fiscal year. Check the dates.`,
          rowNumber,
          metric: metricRaw,
        });
      }
      periodStart = periodStartRaw;
    } else if (periodStartRaw !== "") {
      issues.push({
        severity: "info",
        code: "period_start_ignored",
        message: `${definition.label} is measured at an instant, so periodStart is recorded but not used.`,
        rowNumber,
        metric: metricRaw,
      });
    }

    const fiscalYear = Number(fiscalYearRaw);
    if (!Number.isInteger(fiscalYear)) {
      issues.push({
        severity: "blocking",
        code: "bad_fiscal_year",
        message: `fiscalYear "${fiscalYearRaw}" is not a whole number.`,
        rowNumber,
        metric: metricRaw,
      });
      continue;
    }

    const multiplier = SCALE_MULTIPLIERS[scaleRaw];
    const conversionNotes: string[] = [];
    if (multiplier !== 1) {
      conversionNotes.push(`Scaled from ${scaleRaw} to base units (x${multiplier.toLocaleString("en-US")}).`);
    }

    let normalizedValue = rawValue * multiplier;
    if (metricRaw === "capex" && normalizedValue < 0) {
      normalizedValue = -normalizedValue;
      conversionNotes.push(
        "Sign converted: the source reported capital expenditure as a negative cash flow; model notation uses a positive outflow.",
      );
    }

    facts.push({
      id: `${company}|${fiscalYear}|${metricRaw}|${rowNumber}`,
      company,
      fiscalYear,
      periodStart,
      periodEnd: periodEndRaw,
      statementType: (["income", "balance", "cashflow", "other"] as string[]).includes(statementRaw)
        ? (statementRaw as StatementType)
        : "other",
      metric: metricRaw,
      rawValue,
      unit: definition.unit,
      scale: scaleRaw,
      multiplier,
      normalizedValue,
      sourceUrl: get("sourceUrl"),
      sourceLocator: get("sourceLocator"),
      filedAt: get("filedAt"),
      reviewStatus: "unreviewed",
      conversionNotes,
      sourceHash: hashRow([company, fiscalYearRaw, metricRaw, valueRaw, unitRaw, scaleRaw, periodEndRaw, get("sourceLocator")]),
      rowNumber,
    });
  }

  if (companies.size > 1) {
    issues.push({
      severity: "blocking",
      code: "mixed_entities",
      message: `The file mixes ${companies.size} entities (${[...companies].join(", ")}). One model covers one entity.`,
    });
  }

  const { selected, superseded, restatementIssues } = selectLatestFilings(facts);
  issues.push(...restatementIssues);

  return { facts: selected, superseded, issues };
}

function selectLatestFilings(facts: ReportedFact[]): {
  selected: ReportedFact[];
  superseded: ReportedFact[];
  restatementIssues: IntakeIssue[];
} {
  const groups = new Map<string, ReportedFact[]>();
  for (const fact of facts) {
    const key = `${fact.company}|${fact.fiscalYear}|${fact.metric}`;
    const list = groups.get(key);
    if (list) list.push(fact);
    else groups.set(key, [fact]);
  }

  const selected: ReportedFact[] = [];
  const superseded: ReportedFact[] = [];
  const restatementIssues: IntakeIssue[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      selected.push(group[0]);
      continue;
    }
    const sorted = [...group].sort((a, b) => (a.filedAt < b.filedAt ? 1 : a.filedAt > b.filedAt ? -1 : b.rowNumber - a.rowNumber));
    const winner = sorted[0];
    selected.push(winner);
    superseded.push(...sorted.slice(1));
    restatementIssues.push({
      severity: "warning",
      code: "duplicate_filing",
      message: `${group.length} filings supply ${winner.metric} for FY${winner.fiscalYear}. The version filed ${winner.filedAt || "(no date)"} is used; the earlier figures are kept as superseded provenance.`,
      metric: winner.metric,
      fiscalYear: winner.fiscalYear,
    });
  }

  selected.sort((a, b) => a.fiscalYear - b.fiscalYear || a.metric.localeCompare(b.metric));
  return { selected, superseded, restatementIssues };
}

export function factsByYear(facts: ReportedFact[]): Map<number, Map<CanonicalMetric, ReportedFact>> {
  const byYear = new Map<number, Map<CanonicalMetric, ReportedFact>>();
  for (const fact of facts) {
    let inner = byYear.get(fact.fiscalYear);
    if (!inner) {
      inner = new Map();
      byYear.set(fact.fiscalYear, inner);
    }
    inner.set(fact.metric, fact);
  }
  return byYear;
}
