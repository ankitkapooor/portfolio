import {
  checkTranscriptSize,
  decodeUtf8Strict,
  type TranscriptInputIssue,
} from "@/domain/schemas/transcript-input";
import { countWords, parseTranscript } from "./index";

/**
 * The single check the lab runs on a pasted or uploaded transcript.
 *
 * Size and parseability are reported together but as separate issues, so a visitor
 * whose file is both too large and badly formatted is told both things instead of
 * fixing one and discovering the other.
 */

export type TranscriptValidation = {
  ok: boolean;
  issues: TranscriptInputIssue[];
  byteLength: number;
  charLength: number;
  wordCount: number;
  lineCount: number;
  /** 1-based input line numbers that did not match the transcript format. */
  skippedLineNumbers: number[];
};

export function validateTranscriptInput(text: string): TranscriptValidation {
  const size = checkTranscriptSize(text);
  const { lines, skippedLineNumbers } = parseTranscript(text);
  const issues = [...size.issues];

  if (!issues.includes("empty") && lines.length === 0) {
    issues.push("no-parsable-lines");
  }

  return {
    ok: issues.length === 0,
    issues,
    byteLength: size.byteLength,
    charLength: size.charLength,
    wordCount: countWords(text),
    lineCount: lines.length,
    skippedLineNumbers,
  };
}

export type UploadResult =
  | { ok: true; text: string; validation: TranscriptValidation }
  | { ok: false; issues: TranscriptInputIssue[] };

/**
 * Validates an uploaded file's bytes before decoding them.
 *
 * The byte limit is checked first because decoding a very large file to find out it
 * is too large is work nobody asked for, and strict decoding means invalid UTF-8 is
 * reported rather than silently replaced with U+FFFD.
 */
export function readUploadedTranscript(bytes: Uint8Array): UploadResult {
  const decoded = decodeUtf8Strict(bytes);
  if (decoded === null) {
    return { ok: false, issues: ["invalid-encoding"] };
  }
  const validation = validateTranscriptInput(decoded);
  if (!validation.ok) {
    return { ok: false, issues: validation.issues };
  }
  return { ok: true, text: decoded, validation };
}
