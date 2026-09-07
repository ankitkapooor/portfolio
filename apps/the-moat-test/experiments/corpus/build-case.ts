import {
  TranscriptCaseSchema,
  type GoldAction,
  type GoldDecision,
  type TranscriptCase,
  type TranscriptLine,
} from "@/domain/schemas/corpus";
import type { CaseFamily, Split } from "@/domain/schemas/primitives";
import { countWords, renderTranscript } from "@/domain/transcript";

/**
 * The corpus version is frozen before a reportable evaluation run. Bump it when a
 * transcript or a gold annotation changes; a run archived against an older hash
 * will then fail `evaluate-run` rather than silently comparing different data.
 */
export const CORPUS_VERSION = "2026-09-07.1";

export type CaseInput = {
  id: string;
  split: Split;
  family: CaseFamily;
  title: string;
  meetingDate: string | null;
  timezone: string | null;
  lines: TranscriptLine[];
  goldActions: GoldAction[];
  goldDecisions: GoldDecision[];
  acceptableAlternatives: Record<string, string[]>;
  annotationRationale: string;
};

/**
 * Derives transcript text, line ids and word count from the authored lines, then
 * validates the whole case. Authoring the derived fields by hand is how evidence
 * references drift out of sync with transcripts, so they are computed here.
 */
export function buildCase(input: CaseInput): TranscriptCase {
  const transcript = renderTranscript(input.lines);
  return TranscriptCaseSchema.parse({
    ...input,
    version: CORPUS_VERSION,
    synthetic: true,
    transcript,
    lineIds: input.lines.map((line) => line.id),
    wordCount: countWords(transcript),
    // An agent authored these annotations. That is not human review.
    humanReviewed: false,
    reviewerId: null,
  });
}
