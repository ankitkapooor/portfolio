import { afterEach, describe, expect, it, vi } from "vitest";
import type { TranscriptCase } from "@/domain/schemas/corpus";

/**
 * `validate-content` must fail loudly (BRD section 11 and requirement M-F06).
 *
 * The script is executed here rather than reimplemented: each case swaps one
 * module in its import graph for a deliberately broken version, runs the real
 * script with `--json`, and reads the problems it reported and the exit code it
 * asked for. A broken evidence id has to fail validation, not publish quietly.
 */

type ValidationReport = {
  corpusVersion: string;
  corpusHash: string;
  checksRun: number;
  problems: { check: string; message: string }[];
};

type Run = { report: ValidationReport; exitCode: number | undefined };

async function runValidateContent(): Promise<Run> {
  const written: string[] = [];
  const stdout = vi
    .spyOn(process.stdout, "write")
    .mockImplementation((chunk: string | Uint8Array) => {
      written.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString());
      return true;
    });
  let exitCode: number | undefined;
  const exit = vi
    .spyOn(process, "exit")
    .mockImplementation(((code?: number) => {
      exitCode = code;
    }) as never);
  const argv = process.argv;
  process.argv = ["node", "validate-content", "--json"];

  try {
    await import("@/scripts/validate-content");
    // `runCli` starts the check in a promise, so yield until it has settled.
    await new Promise((resolve) => setTimeout(resolve, 0));
  } finally {
    process.argv = argv;
    stdout.mockRestore();
    exit.mockRestore();
  }

  return { report: JSON.parse(written.join("")) as ValidationReport, exitCode };
}

/** Replaces the corpus module with one the caller has damaged. */
function mockCorpus(damage: (cases: TranscriptCase[]) => TranscriptCase[]) {
  vi.doMock("@/experiments/corpus", async () => {
    const actual =
      await vi.importActual<typeof import("@/experiments/corpus")>(
        "@/experiments/corpus",
      );
    const cases = damage([...actual.CORPUS]);
    return {
      ...actual,
      CORPUS: cases,
      caseById: (id: string) => cases.find((item) => item.id === id),
    };
  });
}

function messagesFor(report: ValidationReport, check: string): string[] {
  return report.problems
    .filter((problem) => problem.check === check)
    .map((problem) => problem.message);
}

afterEach(() => {
  vi.doUnmock("@/experiments/corpus");
  vi.doUnmock("@/content/evidence");
  vi.resetModules();
});

describe("the published content as it stands", () => {
  it("passes every check and asks for no non-zero exit", async () => {
    vi.resetModules();
    const { report, exitCode } = await runValidateContent();
    expect(report.problems).toEqual([]);
    expect(report.checksRun).toBeGreaterThan(5);
    expect(exitCode).toBeUndefined();
  });
});

describe("split leakage", () => {
  it("fails when a held-out transcript repeats a development transcript", async () => {
    vi.resetModules();
    mockCorpus((cases) => {
      const development = cases.find((item) => item.split === "development");
      const heldOut = cases.find((item) => item.split === "held-out");
      if (!development || !heldOut) throw new Error("corpus is missing a split");
      return cases.map((item) =>
        item.id === heldOut.id
          ? { ...item, transcript: development.transcript }
          : item,
      );
    });

    const { report, exitCode } = await runValidateContent();
    expect(messagesFor(report, "split leakage")).toEqual([
      "case-013 repeats development case case-001",
    ]);
    expect(exitCode).toBe(1);
  });

  it("fails when the same gold item id appears in two cases", async () => {
    vi.resetModules();
    mockCorpus((cases) => {
      const development = cases.find(
        (item) => item.split === "development" && item.goldActions.length > 0,
      );
      const heldOut = cases.find(
        (item) => item.split === "held-out" && item.goldActions.length > 0,
      );
      if (!development || !heldOut) throw new Error("corpus is missing gold actions");
      const stolenId = development.goldActions[0].id;
      return cases.map((item) =>
        item.id === heldOut.id
          ? {
              ...item,
              goldActions: item.goldActions.map((action, index) =>
                index === 0 ? { ...action, id: stolenId } : action,
              ),
            }
          : item,
      );
    });

    const { report, exitCode } = await runValidateContent();
    expect(messagesFor(report, "split leakage")).toEqual([
      "gold id case-001-a1 appears in more than one case",
    ]);
    expect(exitCode).toBe(1);
  });
});

describe("invalid evidence ids", () => {
  it("fails when a gold item cites a transcript line that does not exist", async () => {
    vi.resetModules();
    mockCorpus((cases) =>
      cases.map((item) =>
        item.id === "case-001"
          ? {
              ...item,
              goldActions: item.goldActions.map((action, index) =>
                index === 0 ? { ...action, evidenceLineIds: ["L999"] } : action,
              ),
            }
          : item,
      ),
    );

    const { report, exitCode } = await runValidateContent();
    expect(messagesFor(report, "gold evidence references")).toEqual([
      "case-001: gold item case-001-a1 cites unknown line L999",
    ]);
    expect(messagesFor(report, "corpus schema")[0]).toMatch(
      /cites unknown line L999/,
    );
    expect(exitCode).toBe(1);
  });

  it("fails when a published claim cites an evidence record that is not in the ledger", async () => {
    vi.resetModules();
    vi.doMock("@/content/evidence", async () => {
      const actual =
        await vi.importActual<typeof import("@/content/evidence")>(
          "@/content/evidence",
        );
      return {
        ...actual,
        EVIDENCE: [],
        evidenceIds: () => [],
        evidenceById: () => undefined,
      };
    });

    const { report, exitCode } = await runValidateContent();
    const claims = messagesFor(report, "published claims");
    expect(claims.length).toBeGreaterThan(0);
    expect(claims.every((message) => /is not in the ledger$/.test(message))).toBe(
      true,
    );
    expect(claims.some((message) => /^article cites /.test(message))).toBe(true);
    expect(claims.some((message) => /^thesis cites /.test(message))).toBe(true);
    expect(messagesFor(report, "lens evidence").length).toBeGreaterThan(0);
    expect(exitCode).toBe(1);
  });
});
