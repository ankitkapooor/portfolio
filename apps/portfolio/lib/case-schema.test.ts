import { describe, expect, it } from "vitest";
import { caseErrors, caseSchema, type StrategicCase } from "@/lib/case-schema";
import { orthocodeCase } from "@/content/cases/orthocode-ai";

function clone(): StrategicCase {
  return structuredClone(orthocodeCase);
}

describe("strategic case content", () => {
  it("parses the OrthoCode case with no cross-field errors", () => {
    expect(caseErrors(orthocodeCase)).toEqual([]);
  });

  it("covers all six PESTEL letters and marks exactly one player as self", () => {
    expect(orthocodeCase.whyNow.forces.map((force) => force.letter)).toEqual(["P", "E", "S", "T", "E2", "L"]);
    expect(orthocodeCase.landscape.players.filter((player) => player.self)).toHaveLength(1);
  });

  it("ties every kill criterion to a condition from the bet", () => {
    const ids = new Set(orthocodeCase.conditions.map((condition) => condition.id));
    for (const criterion of orthocodeCase.killCriteria) expect(ids.has(criterion.conditionRef)).toBe(true);
  });
});

describe("strategic case validation", () => {
  it("rejects a numeric claim with no citation", () => {
    const data = clone();
    data.whyNow.forces[1].claims[0].sourceRefs = [];
    expect(caseErrors(data).join("\n")).toMatch(/numeric claim must cite a source/);
  });

  it("rejects a citation to a source that does not exist", () => {
    const data = clone();
    data.conditions[0].sourceRefs = ["s-missing"];
    expect(caseErrors(data).join("\n")).toMatch(/unknown source "s-missing"/);
  });

  it("rejects a kill criterion pointing at an unknown condition", () => {
    const data = clone();
    data.killCriteria[0].conditionRef = "c-missing";
    expect(caseErrors(data).join("\n")).toMatch(/unknown condition "c-missing"/);
  });

  it("rejects a landscape with two self positions", () => {
    const data = clone();
    data.landscape.players[0].self = true;
    expect(caseErrors(data).join("\n")).toMatch(/exactly one player as self/);
  });

  it("rejects plain-http source links", () => {
    const data = clone();
    data.sources[0].url = "http://example.com/report";
    expect(caseSchema.safeParse(data).success).toBe(false);
  });
});
