import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { CORPUS, CORPUS_VERSION } from "@/experiments/corpus";
import {
  MAX_CASE_WORDS,
  MIN_CASE_WORDS,
  TranscriptCaseSchema,
} from "@/domain/schemas/corpus";
import { CASE_FAMILY_LABELS } from "@/domain/schemas/primitives";
import { EVIDENCE, evidenceIds } from "@/content/evidence";
import { MEETING_ASSISTANTS } from "@/content/investigations/meeting-assistants";
import { investigationEvidenceIds } from "@/domain/schemas/investigation";
import { THESIS } from "@/content/thesis";
import { thesisEvidenceIds } from "@/domain/schemas/evidence";
import { LENSES } from "@/content/lenses";
import { ILLUSTRATIVE_OUTPUTS } from "@/content/illustrative-outputs";
import { invalidLineReferences } from "@/domain/schemas/extraction";
import { caseById } from "@/experiments/corpus";
import { hashOf, parseFlags, runCli, sha256 } from "./lib/cli";

/**
 * validate-content: schemas, evidence references, and split leakage (BRD section 11).
 *
 * Exits non-zero on any failure. A broken evidence id is a build failure, not a
 * silently published page.
 */

type Problem = { check: string; message: string };

const problems: Problem[] = [];
const checks: { name: string; detail: string }[] = [];

function pass(name: string, detail: string) {
  checks.push({ name, detail });
}

function fail(check: string, message: string) {
  problems.push({ check, message });
}

runCli(() => {
  const flags = parseFlags(process.argv.slice(2));
  const projectRoot = process.cwd();

  checkCorpusSchemas();
  checkCorpusComposition();
  checkSplitLeakage();
  checkGoldEvidenceReferences();
  checkAnnotationHonesty();
  checkEvidenceRecords(projectRoot);
  checkPublishedClaims();
  checkLensEvidence();
  checkIllustrativeOutputs();
  checkGoldStaysOffTheClient(projectRoot);

  const report = {
    corpusVersion: CORPUS_VERSION,
    corpusHash: hashOf({ version: CORPUS_VERSION, cases: CORPUS }).slice(0, 16),
    checksRun: checks.length,
    problems,
  };

  if (flags.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`validate-content: corpus ${CORPUS_VERSION}\n`);
    for (const check of checks) {
      process.stdout.write(`  ok    ${check.name} — ${check.detail}\n`);
    }
    for (const problem of problems) {
      process.stdout.write(`  FAIL  ${problem.check} — ${problem.message}\n`);
    }
    process.stdout.write(
      `\n  ${checks.length} checks passed, ${problems.length} failed.\n\n`,
    );
  }

  if (problems.length > 0) process.exit(1);
});

function checkCorpusSchemas() {
  let failures = 0;
  for (const transcriptCase of CORPUS) {
    const parsed = TranscriptCaseSchema.safeParse(transcriptCase);
    if (!parsed.success) {
      failures += 1;
      fail(
        "corpus schema",
        `${transcriptCase.id}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
      );
    }
  }
  if (failures === 0) {
    pass("corpus schema", `${CORPUS.length} cases validate against TranscriptCase`);
  }
}

function checkCorpusComposition() {
  if (CORPUS.length !== 24) {
    fail("corpus size", `expected 24 cases, found ${CORPUS.length}`);
  }

  const families = Object.keys(CASE_FAMILY_LABELS);
  let compositionOk = true;
  for (const family of families) {
    for (const split of ["development", "held-out"] as const) {
      const count = CORPUS.filter(
        (item) => item.family === family && item.split === split,
      ).length;
      if (count !== 2) {
        compositionOk = false;
        fail(
          "corpus composition",
          `${family} has ${count} ${split} cases, expected 2`,
        );
      }
    }
  }
  if (compositionOk) {
    pass(
      "corpus composition",
      "6 families, 2 development and 2 held-out cases each",
    );
  }

  const outOfRange = CORPUS.filter(
    (item) => item.wordCount < MIN_CASE_WORDS || item.wordCount > MAX_CASE_WORDS,
  );
  if (outOfRange.length > 0) {
    fail(
      "transcript length",
      outOfRange.map((item) => `${item.id}=${item.wordCount}`).join(", "),
    );
  } else {
    const counts = CORPUS.map((item) => item.wordCount);
    pass(
      "transcript length",
      `all between ${Math.min(...counts)} and ${Math.max(...counts)} words`,
    );
  }

  const noActionCases = CORPUS.filter((item) => item.goldActions.length === 0);
  if (noActionCases.length === 0) {
    fail("corpus coverage", "no case has zero gold actions; a no-action meeting is required");
  } else {
    pass(
      "corpus coverage",
      `${noActionCases.length} no-action case(s): ${noActionCases.map((item) => item.id).join(", ")}`,
    );
  }

  const noFinalDecision = CORPUS.filter(
    (item) =>
      item.goldDecisions.length > 0 &&
      item.goldDecisions.every((decision) => decision.status !== "current"),
  );
  if (noFinalDecision.length === 0) {
    fail(
      "corpus coverage",
      "no case has decisions without any affirmative decision; a no-final-decision meeting is required",
    );
  } else {
    pass(
      "corpus coverage",
      `${noFinalDecision.length} no-final-decision case(s): ${noFinalDecision.map((item) => item.id).join(", ")}`,
    );
  }
}

/**
 * Split leakage: a held-out case must not repeat a development case, by id or by
 * transcript content. Near-duplicates are caught by comparing the normalized text
 * as well as the exact bytes.
 */
function checkSplitLeakage() {
  const ids = new Set<string>();
  for (const item of CORPUS) {
    if (ids.has(item.id)) fail("split leakage", `duplicate case id ${item.id}`);
    ids.add(item.id);
  }

  const development = CORPUS.filter((item) => item.split === "development");
  const heldOut = CORPUS.filter((item) => item.split === "held-out");

  const developmentHashes = new Map(
    development.map((item) => [sha256(normalize(item.transcript)), item.id]),
  );
  let leaks = 0;
  for (const item of heldOut) {
    const match = developmentHashes.get(sha256(normalize(item.transcript)));
    if (match) {
      leaks += 1;
      fail("split leakage", `${item.id} repeats development case ${match}`);
    }
  }

  // Gold item ids must be unique corpus-wide so a judgment cannot be attributed to
  // the wrong split.
  const goldIds = new Set<string>();
  for (const item of CORPUS) {
    for (const gold of [...item.goldActions, ...item.goldDecisions]) {
      if (goldIds.has(gold.id)) {
        leaks += 1;
        fail("split leakage", `gold id ${gold.id} appears in more than one case`);
      }
      goldIds.add(gold.id);
    }
  }

  if (leaks === 0) {
    pass(
      "split leakage",
      `${development.length} development and ${heldOut.length} held-out cases share no transcript and no gold id`,
    );
  }
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function checkGoldEvidenceReferences() {
  let broken = 0;
  let references = 0;
  for (const item of CORPUS) {
    const known = new Set(item.lineIds);
    for (const gold of [...item.goldActions, ...item.goldDecisions]) {
      for (const lineId of gold.evidenceLineIds) {
        references += 1;
        if (!known.has(lineId)) {
          broken += 1;
          fail(
            "gold evidence references",
            `${item.id}: gold item ${gold.id} cites unknown line ${lineId}`,
          );
        }
      }
    }
  }
  if (broken === 0) {
    pass("gold evidence references", `${references} line references all resolve`);
  }
}

function checkAnnotationHonesty() {
  const reviewed = CORPUS.filter((item) => item.humanReviewed);
  if (reviewed.length > 0) {
    fail(
      "annotation honesty",
      `${reviewed.length} case(s) claim humanReviewed=true; no human has reviewed this corpus`,
    );
    return;
  }
  const withReviewer = CORPUS.filter((item) => item.reviewerId !== null);
  if (withReviewer.length > 0) {
    fail("annotation honesty", "reviewerId must be null while humanReviewed is false");
    return;
  }
  const notSynthetic = CORPUS.filter((item) => item.synthetic !== true);
  if (notSynthetic.length > 0) {
    fail("annotation honesty", "every corpus case must be labelled synthetic");
    return;
  }
  pass(
    "annotation honesty",
    "all 24 cases are synthetic, humanReviewed=false, reviewerId=null",
  );
}

function checkEvidenceRecords(projectRoot: string) {
  const seen = new Set<string>();
  let broken = 0;
  for (const record of EVIDENCE) {
    if (seen.has(record.id)) {
      broken += 1;
      fail("evidence ledger", `duplicate evidence id ${record.id}`);
    }
    seen.add(record.id);

    if (record.artifactPath) {
      const path = join(projectRoot, record.artifactPath);
      if (!existsSync(path)) {
        broken += 1;
        fail(
          "evidence ledger",
          `${record.id} points at ${record.artifactPath}, which does not exist`,
        );
      }
    }
    if (record.type === "measured" && record.artifactPath === null) {
      broken += 1;
      fail(
        "evidence ledger",
        `${record.id} is typed measured but has no artifact to check`,
      );
    }
  }

  const interviews = EVIDENCE.filter((record) => record.type === "interview");
  if (interviews.length > 0) {
    broken += 1;
    fail(
      "evidence ledger",
      `${interviews.length} interview record(s) exist, but no interviews have been conducted`,
    );
  }

  const claimingReviewed = EVIDENCE.filter(
    (record) => record.reviewerStatus === "reviewed",
  );
  if (claimingReviewed.length > 0) {
    broken += 1;
    fail(
      "evidence ledger",
      `${claimingReviewed.length} record(s) claim reviewerStatus=reviewed; no review has happened`,
    );
  }

  if (broken === 0) {
    pass(
      "evidence ledger",
      `${EVIDENCE.length} records, every artifact path resolves, no fabricated interviews`,
    );
  }
}

function checkPublishedClaims() {
  const known = new Set(evidenceIds());
  let broken = 0;

  for (const id of investigationEvidenceIds(MEETING_ASSISTANTS)) {
    if (!known.has(id)) {
      broken += 1;
      fail("published claims", `article cites ${id}, which is not in the ledger`);
    }
  }
  for (const id of thesisEvidenceIds(THESIS)) {
    if (!known.has(id)) {
      broken += 1;
      fail("published claims", `thesis cites ${id}, which is not in the ledger`);
    }
  }

  if (THESIS.status !== "draft") {
    broken += 1;
    fail("published claims", "the thesis must stay labelled draft until it is reviewed");
  }

  const sections = MEETING_ASSISTANTS.sections;
  if (sections.length !== 10) {
    broken += 1;
    fail("published claims", `the article has ${sections.length} sections, expected 10`);
  }

  if (broken === 0) {
    pass(
      "published claims",
      `${investigationEvidenceIds(MEETING_ASSISTANTS).length} article references and ${thesisEvidenceIds(THESIS).length} thesis references all resolve`,
    );
  }
}

function checkLensEvidence() {
  const known = new Set(evidenceIds());
  let broken = 0;
  for (const lens of Object.values(LENSES)) {
    for (const requirement of lens.requirements) {
      for (const id of requirement.evidenceIds) {
        if (!known.has(id)) {
          broken += 1;
          fail(
            "lens evidence",
            `${lens.id}/${requirement.id} cites ${id}, which is not in the ledger`,
          );
        }
      }
    }
  }
  if (broken === 0) {
    pass("lens evidence", "every lens requirement cites an existing evidence record");
  }
}

function checkIllustrativeOutputs() {
  let broken = 0;
  for (const [caseId, output] of Object.entries(ILLUSTRATIVE_OUTPUTS)) {
    const transcriptCase = caseById(caseId);
    if (!transcriptCase) {
      broken += 1;
      fail("illustrative outputs", `${caseId} is not a corpus case`);
      continue;
    }
    const bad = invalidLineReferences(output, transcriptCase.lineIds);
    if (bad.length > 0) {
      broken += 1;
      fail(
        "illustrative outputs",
        `${caseId} cites line ids that do not exist: ${bad.join(", ")}`,
      );
    }
  }
  if (broken === 0) {
    pass(
      "illustrative outputs",
      `${Object.keys(ILLUSTRATIVE_OUTPUTS).length} hand-authored outputs cite only real transcript lines`,
    );
  }
}

/**
 * Gold annotations are experiment-side. Nothing marked "use client" may import the
 * corpus or name a gold field, because that would ship the answers to the browser
 * and, through the lab, into anything a visitor could paste into a model.
 */
function checkGoldStaysOffTheClient(projectRoot: string) {
  const offenders: string[] = [];
  for (const file of sourceFiles(projectRoot)) {
    const text = readFileSync(file, "utf8");
    if (!/^\s*["']use client["']/m.test(text)) continue;
    const relativePath = relative(projectRoot, file);
    if (/@\/experiments\/corpus/.test(text)) {
      offenders.push(`${relativePath} imports the corpus module`);
    }
    if (/\bgoldActions\b|\bgoldDecisions\b|\bannotationRationale\b/.test(text)) {
      offenders.push(`${relativePath} references a gold annotation field`);
    }
  }
  if (offenders.length > 0) {
    for (const offender of offenders) fail("gold isolation", offender);
    return;
  }
  pass("gold isolation", "no client component imports the corpus or names a gold field");
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "experiments",
  "playwright-report",
  "test-results",
]);

function sourceFiles(root: string): string[] {
  const found: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      if (SKIP_DIRS.has(entry)) continue;
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (/\.tsx?$/.test(entry)) {
        found.push(path);
      }
    }
  };
  walk(root);
  return found;
}
