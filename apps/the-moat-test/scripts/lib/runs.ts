import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CORPUS, CORPUS_VERSION } from "@/experiments/corpus";
import {
  ExperimentRunSchema,
  RunArtifactSchema,
  type RunArtifact,
} from "@/domain/schemas/experiment";
import { CliError, hashOf } from "./cli";

/** Run artifacts are written once and then treated as read-only evidence. */
export const RUNS_DIR = join(process.cwd(), "experiments", "runs");

export function runDir(runId: string): string {
  return join(RUNS_DIR, runId);
}

export function runIdFor(method: string, split: string, corpusVersion: string): string {
  return `${method}--${split}--${corpusVersion}`;
}

/**
 * Hash of the whole corpus, including gold annotations. Any edit to a transcript or
 * an annotation changes this, which is what makes `evaluate-run` able to refuse a
 * stale comparison.
 */
export function corpusHash(): string {
  return hashOf({ version: CORPUS_VERSION, cases: CORPUS });
}

export function writeRunArtifact(artifact: RunArtifact, force: boolean): string {
  const parsed = RunArtifactSchema.parse(artifact);
  const directory = runDir(parsed.run.runId);
  if (existsSync(join(directory, "run.json")) && !force) {
    throw new CliError(
      `Run ${parsed.run.runId} already exists. Run outputs are immutable; delete the directory deliberately or pass --force.`,
    );
  }
  mkdirSync(directory, { recursive: true });
  writeJson(join(directory, "run.json"), parsed.run);
  writeJson(join(directory, "outputs.json"), parsed.outputs);
  return directory;
}

export function readRunArtifact(runId: string): RunArtifact {
  const directory = runDir(runId);
  const runPath = join(directory, "run.json");
  const outputsPath = join(directory, "outputs.json");
  if (!existsSync(runPath) || !existsSync(outputsPath)) {
    throw new CliError(`No archived run found at experiments/runs/${runId}`);
  }
  return RunArtifactSchema.parse({
    run: ExperimentRunSchema.parse(readJson(runPath)),
    outputs: readJson(outputsPath),
  });
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}
