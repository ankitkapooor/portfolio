import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runTaggedTranscriptBaseline } from "@/domain/baseline/tagged-transcript-baseline";
import { CORPUS_VERSION, casesInSplit } from "@/experiments/corpus";
import { readJson, readRunArtifact, writeJson } from "./lib/runs";

/**
 * The four CLIs, and the version-mismatch refusal (BRD section 10 and 11).
 *
 * Each command is executed as a real process. The archived runs the site
 * publishes are never written to: the mismatch cases work on throwaway copies
 * that are deleted afterwards.
 */

const PROJECT_ROOT = join(import.meta.dirname, "..");
const RUNS_DIR = join(PROJECT_ROOT, "experiments", "runs");
const ARCHIVED_RUN_ID = `tagged-transcript-baseline--development--${CORPUS_VERSION}`;
const CURRENT_FIXTURE = "cli-test-current";
const STALE_FIXTURE = "cli-test-stale";

/** tsx startup dominates; every CLI case needs a generous budget. */
const CLI_TIMEOUT_MS = 120_000;

const TSX = join(PROJECT_ROOT, "node_modules", ".bin", "tsx");

function runCli(script: string, args: string[]) {
  const result = spawnSync(TSX, [join("scripts", script), ...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    timeout: CLI_TIMEOUT_MS,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function copyArchivedRun(fixtureId: string, patch: (run: Record<string, unknown>) => void) {
  const target = join(RUNS_DIR, fixtureId);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const file of ["run.json", "outputs.json"]) {
    cpSync(join(RUNS_DIR, ARCHIVED_RUN_ID, file), join(target, file));
  }
  const run = readJson(join(target, "run.json")) as Record<string, unknown>;
  run.runId = fixtureId;
  patch(run);
  writeJson(join(target, "run.json"), run);
}

beforeAll(() => {
  copyArchivedRun(CURRENT_FIXTURE, () => {});
  copyArchivedRun(STALE_FIXTURE, (run) => {
    run.corpusHash = "0".repeat(64);
  });
});

afterAll(() => {
  rmSync(join(RUNS_DIR, CURRENT_FIXTURE), { recursive: true, force: true });
  rmSync(join(RUNS_DIR, STALE_FIXTURE), { recursive: true, force: true });
});

describe("version mismatch", () => {
  it(
    "refuses to score a run archived against a different corpus",
    () => {
      const result = runCli("evaluate-run.ts", ["--run", STALE_FIXTURE]);
      expect(result.status).toBe(4);
      expect(result.stderr).toMatch(/Corpus version mismatch/);
      expect(result.stderr).toMatch(/non-comparable/);
      expect(existsSync(join(RUNS_DIR, STALE_FIXTURE, "evaluation.json"))).toBe(false);
    },
    CLI_TIMEOUT_MS,
  );

  it(
    "scores it only on an explicit override, and labels the result non-comparable",
    () => {
      const result = runCli("evaluate-run.ts", [
        "--run",
        STALE_FIXTURE,
        "--allow-version-mismatch",
      ]);
      expect(result.status).toBe(0);
      expect(result.stderr).toMatch(/non-comparable/);
      const evaluation = readJson(
        join(RUNS_DIR, STALE_FIXTURE, "evaluation.json"),
      ) as { comparable: boolean; corpusHashInRun: string };
      expect(evaluation.comparable).toBe(false);
      expect(evaluation.corpusHashInRun).toBe("0".repeat(64));
    },
    CLI_TIMEOUT_MS,
  );

  it(
    "scores a run whose hash still matches without any override",
    () => {
      const result = runCli("evaluate-run.ts", ["--run", CURRENT_FIXTURE]);
      expect(result.status).toBe(0);
      expect(result.stderr).not.toMatch(/non-comparable/);
      const evaluation = readJson(
        join(RUNS_DIR, CURRENT_FIXTURE, "evaluation.json"),
      ) as { comparable: boolean; goldAnnotationsHumanReviewed: boolean };
      expect(evaluation.comparable).toBe(true);
      expect(evaluation.goldAnnotationsHumanReviewed).toBe(false);
    },
    CLI_TIMEOUT_MS,
  );
});

describe("the four CLIs still run", () => {
  it(
    "validate-content reports no problems",
    () => {
      const result = runCli("validate-content.ts", ["--json"]);
      expect(result.status).toBe(0);
      expect((JSON.parse(result.stdout) as { problems: unknown[] }).problems).toEqual(
        [],
      );
    },
    CLI_TIMEOUT_MS,
  );

  it(
    "run-benchmark answers --help",
    () => {
      const result = runCli("run-benchmark.ts", ["--help"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/run-benchmark --corpus-version/);
    },
    CLI_TIMEOUT_MS,
  );

  it(
    "run-benchmark writes nothing for the unconfigured AI method instead of inventing a run",
    () => {
      const result = runCli("run-benchmark.ts", [
        "--corpus-version",
        CORPUS_VERSION,
        "--split",
        "development",
        "--method",
        "ai-structured-extraction",
        "--max-cost",
        "0",
      ]);
      expect(result.status).toBe(3);
      expect(result.stderr).toMatch(/provider not configured/);
      expect(result.stderr).toMatch(/No run was written/);
      expect(
        existsSync(
          join(RUNS_DIR, `ai-structured-extraction--development--${CORPUS_VERSION}`),
        ),
      ).toBe(false);
    },
    CLI_TIMEOUT_MS,
  );

  it(
    "evaluate-run and build-report produce a report from an archived run",
    () => {
      const report = runCli("build-report.ts", ["--run", CURRENT_FIXTURE]);
      expect(report.status).toBe(0);
      expect(report.stdout).toMatch(/human review queue/);
      const written = readJson(join(RUNS_DIR, CURRENT_FIXTURE, "report.json")) as {
        corpusIsSynthetic: boolean;
        goldAnnotationsHumanReviewed: boolean;
        reviewQueueLength: number;
      };
      expect(written.corpusIsSynthetic).toBe(true);
      expect(written.goldAnnotationsHumanReviewed).toBe(false);
      expect(written.reviewQueueLength).toBeGreaterThan(0);
    },
    CLI_TIMEOUT_MS,
  );
});

describe("the archived run the site publishes", () => {
  it("was produced by the corpus in this working tree", () => {
    const artifact = readRunArtifact(ARCHIVED_RUN_ID);
    expect(artifact.run.corpusVersion).toBe(CORPUS_VERSION);
    expect(artifact.outputs).toHaveLength(casesInSplit("development").length);
  });

  it("still reproduces byte for byte when the baseline is re-run over the split", () => {
    const artifact = readRunArtifact(ARCHIVED_RUN_ID);
    for (const transcriptCase of casesInSplit("development")) {
      const archived = artifact.outputs.find(
        (item) => item.caseId === transcriptCase.id,
      );
      expect(archived).toBeDefined();
      expect(archived?.output).toEqual(
        runTaggedTranscriptBaseline(transcriptCase.transcript).output,
      );
    }
  });
});
