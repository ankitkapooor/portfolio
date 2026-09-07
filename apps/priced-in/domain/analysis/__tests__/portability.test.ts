import { describe, expect, it } from "vitest";
import { computeAnalysis } from "../compute";
import { parseAnalysis, serializeAnalysis } from "../document";
import { createSampleDocument } from "../sample";
import { toCashFlowCsv, toMarkdown, toProvenanceCsv } from "../../export/reports";
import { parseCsv } from "../../intake/csv";

describe("fictional sample company", () => {
  const document = createSampleDocument();

  it("is labelled as fictional", () => {
    expect(document.company.fictional).toBe(true);
    expect(document.company.note.toLowerCase()).toContain("fictional");
  });

  it("imports its own CSV without blocking problems", () => {
    // 22 canonical metrics across four fiscal years.
    expect(document.facts).toHaveLength(88);
    expect(document.supersededFacts).toHaveLength(0);
  });

  it("reconciles cleanly", () => {
    const computation = computeAnalysis(document);
    const failures = computation.reconciliation.checks.filter((check) => check.status === "fail");
    expect(failures.map((check) => check.id)).toEqual([]);
    expect(computation.reconciliation.cleanData).toBe(true);
  });

  it("produces a supported valuation with a target and a gap", () => {
    const computation = computeAnalysis(document);
    expect(computation.valuation.ok).toBe(true);
    expect(computation.target.ok).toBe(true);
    expect(computation.gapUsd).not.toBeNull();
  });
});

describe("P-F07: JSON export and reimport", () => {
  const original = createSampleDocument();
  const before = computeAnalysis(original);
  const json = serializeAnalysis(original);
  const parsed = parseAnalysis(json);

  it("reimports successfully", () => {
    expect(parsed.ok).toBe(true);
  });

  it("reproduces every input", () => {
    if (!parsed.ok) return;
    expect(parsed.document).toEqual(original);
    expect(parsed.document.engineVersion).toBe(original.engineVersion);
    expect(parsed.document.formulaVersion).toBe(original.formulaVersion);
    expect(parsed.document.facts.map((fact) => fact.sourceHash)).toEqual(
      original.facts.map((fact) => fact.sourceHash),
    );
  });

  it("reproduces every output", () => {
    if (!parsed.ok) return;
    const after = computeAnalysis(parsed.document);
    expect(after.valuation.ok && before.valuation.ok).toBe(true);
    if (!after.valuation.ok || !before.valuation.ok) return;
    expect(after.valuation.value.enterpriseValue.toString()).toBe(before.valuation.value.enterpriseValue.toString());
    expect(after.bridge?.equityValue.toString()).toBe(before.bridge?.equityValue.toString());
    expect(after.bridge?.valuePerShare?.toString()).toBe(before.bridge?.valuePerShare?.toString());
    expect(after.gapUsd).toBe(before.gapUsd);
  });
});

describe("JSON export escaping", () => {
  const nasty = 'Acme "Quoted" \\ Corp\nSecond line\t</script> \u2014 caf\u00e9 \u00a5';
  const document = {
    ...createSampleDocument(),
    company: { ...createSampleDocument().company, name: nasty },
    brief: { thesis: nasty, position: nasty, notes: nasty },
  };

  it("escapes control characters, quotes and backslashes", () => {
    const json = serializeAnalysis(document);
    expect(json).toContain('\\"Quoted\\"');
    expect(json).toContain("\\\\ Corp");
    expect(json).toContain("\\n");
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("round trips the exact string", () => {
    const parsed = parseAnalysis(serializeAnalysis(document));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.company.name).toBe(nasty);
    expect(parsed.document.brief.thesis).toBe(nasty);
  });

  it("keeps the same nasty string inside CSV exports as one field", () => {
    const csv = toProvenanceCsv({ ...document, facts: document.facts.slice(0, 1) });
    const parsedRows = parseCsv(csv);
    expect(parsedRows[1][0]).toBe(document.facts[0].company);
  });
});

describe("corrupt import", () => {
  it("rejects text that is not JSON", () => {
    const result = parseAnalysis("{ this is not json");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toContain("not valid JSON");
  });

  it("rejects a JSON file that is not an analysis", () => {
    const result = parseAnalysis(JSON.stringify({ hello: "world" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("rejects an analysis whose yearly arrays do not match the horizon", () => {
    const document = createSampleDocument();
    document.scenarios[0].assumptions.forecast.growthRates = [0.05, 0.05];
    const result = parseAnalysis(serializeAnalysis(document));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.join(" ")).toContain("5 values");
  });

  it("rejects an analysis pointing at a missing scenario", () => {
    const document = { ...createSampleDocument(), activeScenarioId: "does-not-exist" };
    const result = parseAnalysis(serializeAnalysis(document));
    expect(result.ok).toBe(false);
  });
});

describe("human-readable exports", () => {
  const document = createSampleDocument();
  const computation = computeAnalysis(document);

  it("marks the markdown brief as fictional and non-advisory", () => {
    const markdown = toMarkdown(document, computation);
    expect(markdown).toContain("Fictional company");
    expect(markdown).toContain("not investment advice");
    expect(markdown).toContain("Terminal reinvestment replaces");
  });

  it("writes unrounded USD into the cash-flow CSV", () => {
    const csv = toCashFlowCsv(document, computation);
    const parsedRows = parseCsv(csv);
    const header = parsedRows.find((row) => row[0] === "year");
    expect(header).toBeDefined();
    expect(csv).toContain("enterpriseValueUsd");
  });
});
