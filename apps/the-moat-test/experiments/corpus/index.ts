import type { TranscriptCase } from "@/domain/schemas/corpus";
import type { CaseFamily, Split } from "@/domain/schemas/primitives";
import { toPublicSample, type PublicSample } from "@/domain/schemas/corpus";
import { case001, case002, case013, case014 } from "./cases/explicit-action-ownership";
import { case003, case004, case015, case016 } from "./cases/ambiguous-owner-or-date";
import { case005, case006, case017, case018 } from "./cases/decision-reversed";
import { case007, case008, case019, case020 } from "./cases/conflicting-no-resolution";
import { case009, case010, case021, case022 } from "./cases/multi-project-repeated-names";
import { case011, case012, case023, case024 } from "./cases/embedded-instruction-override";

export { CORPUS_VERSION } from "./build-case";

/**
 * The whole corpus, in case-id order. Every transcript here is synthetic: it was
 * authored for this benchmark and depicts no real meeting, person, or company.
 *
 * This module carries gold annotations. It must stay out of client bundles and out
 * of generation prompts; use `publicSamples()` for anything the browser or a model
 * is allowed to see.
 */
export const CORPUS: readonly TranscriptCase[] = [
  case001,
  case002,
  case003,
  case004,
  case005,
  case006,
  case007,
  case008,
  case009,
  case010,
  case011,
  case012,
  case013,
  case014,
  case015,
  case016,
  case017,
  case018,
  case019,
  case020,
  case021,
  case022,
  case023,
  case024,
];

export function casesInSplit(split: Split): TranscriptCase[] {
  return CORPUS.filter((item) => item.split === split);
}

export function casesInFamily(family: CaseFamily): TranscriptCase[] {
  return CORPUS.filter((item) => item.family === family);
}

export function caseById(id: string): TranscriptCase | undefined {
  return CORPUS.find((item) => item.id === id);
}

/** Gold-free projections, safe to send to the browser. */
export function publicSamples(): PublicSample[] {
  return CORPUS.map(toPublicSample);
}

/**
 * The samples offered in the lab. These are development-split cases only, chosen so
 * that each of the six families is represented once, and so that the held-out split
 * is not the material a visitor spends the most time reading.
 */
export const LAB_SAMPLE_IDS = [
  "case-001",
  "case-003",
  "case-005",
  "case-007",
  "case-009",
  "case-011",
] as const;

export function labSamples(): PublicSample[] {
  return LAB_SAMPLE_IDS.map((id) => {
    const found = caseById(id);
    if (!found) throw new Error(`lab sample ${id} is not in the corpus`);
    return toPublicSample(found);
  });
}
