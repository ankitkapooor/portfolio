import { describe, expect, it } from "vitest";
import {
  ImportError,
  buildLedger,
  exportRun,
  exportRunJson,
  exportRunMarkdown,
  importRun,
} from "@/domain/portability";
import { commitRound, createRun, switchSides } from "@/domain/run";
import { snapshotHash } from "@/domain/engine";
import { defaultScenario } from "@/content/scenarios";
import type { ActionId, GameRun } from "@/domain/schema";

const EXPORTED_AT = "2026-01-05T00:00:00.000Z";

function completedRun(): GameRun {
  let run = createRun({
    id: "run-export",
    createdAt: "2026-01-01T00:00:00.000Z",
    role: "incumbent",
    environmentId: "commodity-models",
    scenarioId: defaultScenario.id,
    label: "Exportable run",
  });
  const script: ActionId[] = [
    "improve-reliability",
    "enterprise-integrations",
    "reduce-price",
    "commission-research",
  ];
  script.forEach((action, index) => {
    run = commitRound(run, action, `Q${index + 1} rationale`);
  });
  return run;
}

describe("export", () => {
  it("writes a versioned envelope with the recorded script and ledger", () => {
    const exported = exportRun(completedRun(), EXPORTED_AT);
    expect(exported.format).toBe("disrupt-this-business/run");
    expect(exported.formatVersion).toBe(1);
    expect(exported.run.rounds).toHaveLength(4);
    expect(exported.run.ledger).toHaveLength(4);
    expect(exported.run.ledger[0].incumbent.quarter).toBe(1);
  });

  it("contains no API keys or personal telemetry fields", () => {
    const json = exportRunJson(completedRun(), EXPORTED_AT).toLowerCase();
    for (const forbidden of ["apikey", "api_key", "token", "secret", "telemetry"]) {
      expect(json).not.toContain(forbidden);
    }
  });

  it("produces a Markdown report with both ledgers and the assumption notice", () => {
    const markdown = exportRunMarkdown(completedRun(), EXPORTED_AT);
    expect(markdown).toContain("Fictional design assumptions");
    expect(markdown).toContain("RelayWorks ledger");
    expect(markdown).toContain("TaskPilot ledger");
    expect(markdown).toContain("| Q4 |");
  });
});

describe("import", () => {
  it("reproduces every ledger value from the recorded decisions", () => {
    const original = completedRun();
    const { run, notes } = importRun(exportRunJson(original, EXPORTED_AT));

    expect(snapshotHash(run.state)).toBe(snapshotHash(original.state));
    expect(buildLedger(run)).toEqual(buildLedger(original));
    expect(run.rounds.map((r) => r.rationale)).toEqual(
      original.rounds.map((r) => r.rationale),
    );
    expect(notes.join(" ")).toContain("reproduced exactly");
  });

  it("round-trips a switch-sides run including its fixed opponent script", () => {
    let reversed = switchSides(
      completedRun(),
      "run-reversed",
      "2026-01-06T00:00:00.000Z",
    );
    for (const action of ["hold", "reduce-price", "hold", "hold"] as ActionId[]) {
      reversed = commitRound(reversed, action, "");
    }
    const { run } = importRun(exportRunJson(reversed, EXPORTED_AT));
    expect(run.role).toBe("challenger");
    expect(run.fixedOpponent).toBe(true);
    expect(run.parentId).toBe("run-export");
    expect(buildLedger(run)).toEqual(buildLedger(reversed));
  });

  it("rejects a file that is not JSON", () => {
    expect(() => importRun("this is not json")).toThrow(ImportError);
    expect(() => importRun("this is not json")).toThrow(/not valid JSON/);
  });

  it("rejects a file from a different product", () => {
    expect(() => importRun(JSON.stringify({ format: "some-other-tool" }))).toThrow(
      /does not look like a Disrupt This Business run/,
    );
  });

  it("rejects an unknown export format version with a useful message", () => {
    const exported = exportRun(completedRun(), EXPORTED_AT);
    const corrupted = JSON.stringify({ ...exported, formatVersion: 99 });
    expect(() => importRun(corrupted)).toThrow(
      /export format version 99.*reads version 1/,
    );
  });

  it("rejects a run produced by a different engine version", () => {
    const exported = exportRun(completedRun(), EXPORTED_AT);
    const corrupted = JSON.stringify({ ...exported, engineVersion: "0.0.1" });
    expect(() => importRun(corrupted)).toThrow(/engine 0\.0\.1/);
  });

  it("rejects a run whose scenario version no longer matches", () => {
    const exported = exportRun(completedRun(), EXPORTED_AT);
    const corrupted = JSON.stringify({ ...exported, scenarioVersion: "0.9.0" });
    expect(() => importRun(corrupted)).toThrow(/Parameters have changed/);
  });

  it("rejects unknown fields rather than silently dropping them", () => {
    const exported = exportRun(completedRun(), EXPORTED_AT);
    const corrupted = JSON.stringify({ ...exported, injectedCash: 999_999 });
    expect(() => importRun(corrupted)).toThrow(/does not match the run schema/);
  });

  it("rejects a tampered ledger by replaying the decisions", () => {
    const exported = exportRun(completedRun(), EXPORTED_AT);
    exported.run.ledger[0].incumbent.endingCash = 99_000_000;
    expect(() => importRun(JSON.stringify(exported))).toThrow(
      /does not match what the engine reproduces/,
    );
  });

  it("rejects a tampered action script that is no longer legal", () => {
    const exported = exportRun(completedRun(), EXPORTED_AT);
    exported.run.rounds[0].playerAction = "outcome-bundles";
    exported.run.rounds[1].playerAction = "outcome-bundles";
    expect(() => importRun(JSON.stringify(exported))).toThrow(
      /could not be replayed|does not match what the engine reproduces/,
    );
  });

  it("rejects an oversized upload", () => {
    const padded = `${" ".repeat(1_000_001)}{}`;
    expect(() => importRun(padded)).toThrow(/capped at 1000 kB/);
  });
});
