import { performance } from "node:perf_hooks";
import { casesInSplit, CORPUS, CORPUS_VERSION } from "@/experiments/corpus";
import { SplitSchema } from "@/domain/schemas/primitives";
import {
  MethodIdSchema,
  type CaseOutput,
  type ExperimentRun,
} from "@/domain/schemas/experiment";
import { invalidLineReferences } from "@/domain/schemas/extraction";
import {
  runTaggedTranscriptBaseline,
  TAGGED_BASELINE_SPEC,
  TAGGED_BASELINE_VERSION,
} from "@/domain/baseline/tagged-transcript-baseline";
import { getProviderStatus, PROVIDER_NOT_CONFIGURED_REASON } from "@/server/providers";
import { CliError, hashOf, parseFlags, requireString, runCli, sha256 } from "./lib/cli";
import { corpusHash, runIdFor, writeRunArtifact } from "./lib/runs";

/**
 * run-benchmark: executes a method over a corpus split and writes an immutable run
 * artifact (BRD section 11).
 *
 *   npm run benchmark -- --corpus-version 2026-09-07.1 --split held-out \
 *     --method tagged-transcript-baseline --max-cost 0
 *
 * The deterministic baseline runs for real. The AI method reports that no provider
 * is configured and writes nothing; it never fabricates a run.
 */

const USAGE = `
run-benchmark --corpus-version <version> --split <development|held-out>
              --method <tagged-transcript-baseline|ai-structured-extraction>
              --max-cost <usd> [--force]
`.trim();

runCli(() => {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const corpusVersion = requireString(flags, "corpus-version");
  if (corpusVersion !== CORPUS_VERSION) {
    throw new CliError(
      `Corpus version mismatch: this working tree holds ${CORPUS_VERSION}, you asked for ${corpusVersion}.`,
    );
  }

  const split = SplitSchema.parse(requireString(flags, "split"));
  const method = MethodIdSchema.parse(requireString(flags, "method"));
  const maxCostFlag = requireString(flags, "max-cost");
  const maxCostUsd = Number(maxCostFlag);
  if (!Number.isFinite(maxCostUsd) || maxCostUsd < 0) {
    throw new CliError("--max-cost must be a non-negative number of US dollars.");
  }

  if (method === "ai-structured-extraction") {
    const status = getProviderStatus();
    if (!status.configured) {
      process.stderr.write(
        [
          "",
          "provider not configured",
          "",
          PROVIDER_NOT_CONFIGURED_REASON,
          "",
          "No run was written. An unconfigured method produces no benchmark result,",
          "and this command will not invent one.",
          "",
        ].join("\n"),
      );
      process.exit(3);
    }
    throw new CliError(
      "A provider is configured but no live adapter is implemented in this build.",
    );
  }

  const cases = casesInSplit(split);
  if (cases.length === 0) throw new CliError(`Split ${split} contains no cases.`);

  const runId = runIdFor(method, split, corpusVersion);
  const startedAt = new Date();
  const runStart = performance.now();

  const outputs: CaseOutput[] = [];
  const errors: ExperimentRun["errors"] = [];
  let totalCostUsd = 0;

  for (const transcriptCase of cases) {
    const caseStart = performance.now();
    const result = runTaggedTranscriptBaseline(transcriptCase.transcript);
    const elapsedMs = performance.now() - caseStart;

    // The baseline makes no paid calls, so its per-case cost is zero by construction.
    const costUsd = 0;
    totalCostUsd += costUsd;
    if (totalCostUsd > maxCostUsd) {
      throw new CliError(
        `Aborted: measured spend $${totalCostUsd.toFixed(4)} exceeded --max-cost $${maxCostUsd.toFixed(4)}.`,
      );
    }

    const badRefs = invalidLineReferences(result.output, transcriptCase.lineIds);
    if (badRefs.length > 0) {
      errors.push({
        caseId: transcriptCase.id,
        stage: "validate",
        message: `output cited unknown line ids: ${badRefs.join(", ")}`,
      });
    }

    outputs.push({
      caseId: transcriptCase.id,
      output: result.output,
      attemptCount: 1,
      elapsedMs,
      costUsd,
      invalidLineReferences: badRefs,
    });
  }

  const run: ExperimentRun = {
    runId,
    corpusVersion,
    split,
    method,
    methodVersion: TAGGED_BASELINE_VERSION,
    dataMode: "recorded-experiment",
    archived: true,
    corpusHash: corpusHash(),
    promptHash: sha256(TAGGED_BASELINE_SPEC),
    provider: null,
    model: null,
    settings: { deterministic: true, tags: "ACTION,DECISION" },
    timestamp: startedAt.toISOString(),
    caseCount: cases.length,
    attemptCount: outputs.reduce((total, item) => total + item.attemptCount, 0),
    tokenUsage: null,
    pricingDate: null,
    pricingTableVersion: null,
    measuredCostUsd: totalCostUsd,
    maxCostUsd,
    elapsedMs: performance.now() - runStart,
    perCaseElapsedMs: outputs.map((item) => item.elapsedMs),
    outputHash: hashOf(outputs.map(({ caseId, output }) => ({ caseId, output }))),
    errors,
    reviewerStatus: "unreviewed",
    reviewerId: null,
    notes:
      "Deterministic run. No model provider was called. Corpus is synthetic and gold annotations are drafts that no human has reviewed.",
  };

  const directory = writeRunArtifact({ run, outputs }, flags.force === true);

  process.stdout.write(
    [
      `run-benchmark: ${method} over ${cases.length} ${split} cases`,
      `  corpus        ${CORPUS_VERSION} (${CORPUS.length} cases, all synthetic)`,
      `  corpusHash    ${run.corpusHash.slice(0, 16)}...`,
      `  promptHash    ${run.promptHash.slice(0, 16)}...`,
      `  outputHash    ${run.outputHash.slice(0, 16)}...`,
      `  measured cost $${run.measuredCostUsd.toFixed(4)} (budget $${maxCostUsd.toFixed(4)})`,
      `  elapsed       ${run.elapsedMs.toFixed(1)} ms`,
      `  errors        ${run.errors.length}`,
      `  written to    ${directory.replace(process.cwd(), ".")}`,
      "",
    ].join("\n"),
  );
});
