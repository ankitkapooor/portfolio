import { describe, expect, it } from "vitest";
import { escapeCsvField, parseCsv, toCsv } from "../csv";
import { normalizeRows, TEMPLATE_COLUMNS } from "../facts";
import { materialityTolerance, reconcile } from "../reconcile";

const TODAY = "2026-09-07";
const HEADER = [...TEMPLATE_COLUMNS];

function rows(...records: Array<Partial<Record<(typeof TEMPLATE_COLUMNS)[number], string>>>): string[][] {
  return [
    HEADER,
    ...records.map((record) => HEADER.map((column) => record[column] ?? "")),
  ];
}

const annualRevenue = {
  company: "Testco",
  fiscalYear: "2025",
  periodStart: "2025-01-01",
  periodEnd: "2025-12-31",
  statementType: "income",
  metric: "revenue",
  value: "1000",
  unit: "USD",
  scale: "millions",
  filedAt: "2026-02-10",
};

describe("CSV reader and writer", () => {
  it("round trips quotes, commas and newlines", () => {
    const value = 'Line one, with comma\nand "quotes"';
    const text = toCsv([["header"], [value]]);
    expect(escapeCsvField(value).startsWith('"')).toBe(true);
    expect(parseCsv(text)[1][0]).toBe(value);
  });

  it("keeps embedded commas inside one field", () => {
    expect(parseCsv('a,"b,c",d')[0]).toEqual(["a", "b,c", "d"]);
  });
});

describe("normalization of template rows", () => {
  it("scales millions to base USD and keeps the raw value", () => {
    const result = normalizeRows(rows(annualRevenue), { today: TODAY });
    expect(result.issues.filter((issue) => issue.severity === "blocking")).toHaveLength(0);
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0].rawValue).toBe(1000);
    expect(result.facts[0].multiplier).toBe(1_000_000);
    expect(result.facts[0].normalizedValue).toBe(1_000_000_000);
  });

  it("converts a negative reported capex to positive model notation and records it", () => {
    const result = normalizeRows(
      rows({ ...annualRevenue, metric: "capex", statementType: "cashflow", value: "-48.8" }),
      { today: TODAY },
    );
    expect(result.facts[0].rawValue).toBe(-48.8);
    expect(result.facts[0].normalizedValue).toBeCloseTo(48_800_000, 4);
    expect(result.facts[0].conversionNotes.join(" ")).toContain("Sign converted");
  });

  it("rejects a currency unit on a USD metric", () => {
    const result = normalizeRows(rows({ ...annualRevenue, unit: "EUR" }), { today: TODAY });
    expect(result.facts).toHaveLength(0);
    expect(result.issues.map((issue) => issue.code)).toContain("unit_mismatch");
  });

  it("rejects a share count reported in USD", () => {
    const result = normalizeRows(
      rows({
        company: "Testco",
        fiscalYear: "2025",
        periodEnd: "2025-12-31",
        statementType: "other",
        metric: "sharesOutstanding",
        value: "63.4",
        unit: "USD",
        scale: "millions",
      }),
      { today: TODAY },
    );
    expect(result.facts).toHaveLength(0);
    expect(result.issues.map((issue) => issue.code)).toContain("unit_mismatch");
  });

  it("rejects an unrecognised scale", () => {
    const result = normalizeRows(rows({ ...annualRevenue, scale: "crores" }), { today: TODAY });
    expect(result.issues.map((issue) => issue.code)).toContain("unknown_scale");
  });

  it("rejects a year-to-date period offered as an annual flow", () => {
    const result = normalizeRows(rows({ ...annualRevenue, periodEnd: "2025-06-30" }), { today: TODAY });
    expect(result.facts).toHaveLength(0);
    const issue = result.issues.find((entry) => entry.code === "not_annual_period");
    expect(issue?.message).toContain("not a full fiscal year");
  });

  it("requires a period start for a flow metric", () => {
    const result = normalizeRows(rows({ ...annualRevenue, periodStart: "" }), { today: TODAY });
    expect(result.issues.map((issue) => issue.code)).toContain("missing_period_start");
  });

  it("rejects a period that ends in the future", () => {
    const result = normalizeRows(
      rows({ ...annualRevenue, fiscalYear: "2027", periodStart: "2027-01-01", periodEnd: "2027-12-31" }),
      { today: TODAY },
    );
    expect(result.facts).toHaveLength(0);
    expect(result.issues.map((issue) => issue.code)).toContain("future_period");
  });

  it("never reads a blank value as zero", () => {
    const result = normalizeRows(rows({ ...annualRevenue, value: "" }), { today: TODAY });
    expect(result.facts).toHaveLength(0);
    const issue = result.issues.find((entry) => entry.code === "non_numeric_value");
    expect(issue?.message).toContain("never treated as zero");
  });

  it("refuses to mix two entities in one model", () => {
    const result = normalizeRows(
      rows(annualRevenue, { ...annualRevenue, company: "Othercorp" }),
      { today: TODAY },
    );
    expect(result.issues.map((issue) => issue.code)).toContain("mixed_entities");
  });

  it("selects the latest filing and keeps the earlier one as superseded", () => {
    const result = normalizeRows(
      rows(
        { ...annualRevenue, value: "985", filedAt: "2025-02-14" },
        { ...annualRevenue, value: "990", filedAt: "2026-02-13" },
      ),
      { today: TODAY },
    );
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0].rawValue).toBe(990);
    expect(result.superseded).toHaveLength(1);
    expect(result.superseded[0].rawValue).toBe(985);
    expect(result.issues.map((issue) => issue.code)).toContain("duplicate_filing");
  });

  it("rejects a file that is not the template", () => {
    const result = normalizeRows([["ticker", "value"], ["MHLX", "1"]], { today: TODAY });
    expect(result.issues[0].code).toBe("missing_columns");
  });
});

describe("materiality tolerance", () => {
  it("is the greater of one dollar and 0.1% of the larger amount", () => {
    expect(materialityTolerance(100, 90)).toBe(1);
    expect(materialityTolerance(10_000_000, 9_900_000)).toBe(10_000);
  });
});

describe("reconciliation checks", () => {
  const balanceRows = (assets: string, liabilities: string, equity: string) =>
    rows(
      annualRevenue,
      { ...annualRevenue, metric: "totalAssets", statementType: "balance", periodStart: "", value: assets },
      { ...annualRevenue, metric: "totalLiabilities", statementType: "balance", periodStart: "", value: liabilities },
      { ...annualRevenue, metric: "totalEquity", statementType: "balance", periodStart: "", value: equity },
    );

  it("passes a balanced balance sheet", () => {
    const facts = normalizeRows(balanceRows("1454", "712", "742"), { today: TODAY }).facts;
    const report = reconcile({ facts, baselineFiscalYear: null });
    const check = report.checks.find((entry) => entry.id === "balance-2025");
    expect(check?.status).toBe("pass");
  });

  it("fails a balance sheet that is out beyond tolerance", () => {
    const facts = normalizeRows(balanceRows("1454", "712", "700"), { today: TODAY }).facts;
    const report = reconcile({ facts, baselineFiscalYear: null });
    const check = report.checks.find((entry) => entry.id === "balance-2025");
    expect(check?.status).toBe("fail");
    expect(check?.differenceUsd).toBeCloseTo(42_000_000, 0);
    expect(report.cleanData).toBe(false);
  });

  it("marks the cash roll-forward unavailable when a line is missing", () => {
    const facts = normalizeRows(balanceRows("1454", "712", "742"), { today: TODAY }).facts;
    const report = reconcile({ facts, baselineFiscalYear: null });
    const check = report.checks.find((entry) => entry.id === "cash-2025");
    expect(check?.status).toBe("unavailable");
    expect(check?.detail).toContain("never treated as zero");
  });

  it("blocks a baseline year with no capex instead of assuming zero", () => {
    const facts = normalizeRows(balanceRows("1454", "712", "742"), { today: TODAY }).facts;
    const report = reconcile({ facts, baselineFiscalYear: 2025 });
    const missing = report.issues.filter((issue) => issue.code === "missing_required_metric").map((issue) => issue.metric);
    expect(missing).toContain("capex");
    expect(report.cleanData).toBe(false);
  });

  it("stops blocking once the user explicitly confirms the zero", () => {
    const facts = normalizeRows(balanceRows("1454", "712", "742"), { today: TODAY }).facts;
    const report = reconcile({
      facts,
      baselineFiscalYear: 2025,
      confirmedZeros: [
        "capex",
        "ebit",
        "depreciationAmortization",
        "currentOperatingAssets",
        "currentOperatingLiabilities",
      ],
    });
    expect(report.issues.filter((issue) => issue.code === "missing_required_metric")).toHaveLength(0);
    // EBIT confirmed as zero still fails the positive-EBIT scope constraint.
    expect(report.checks.find((entry) => entry.id === "scope-ebit")?.status).toBe("fail");
  });
});
