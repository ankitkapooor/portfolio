import { z } from "zod";

/**
 * Visitor transcript input limits (BRD section 5): UTF-8 text, at most 100 KB and
 * at most 30,000 characters. Both limits are checked; a transcript can breach one
 * without breaching the other, because a byte is not a character.
 */

export const MAX_TRANSCRIPT_BYTES = 100_000;
export const MAX_TRANSCRIPT_CHARS = 30_000;

export const TranscriptInputIssueSchema = z.enum([
  "empty",
  "too-many-bytes",
  "too-many-characters",
  "invalid-encoding",
  "no-parsable-lines",
]);
export type TranscriptInputIssue = z.infer<typeof TranscriptInputIssueSchema>;

export const TRANSCRIPT_INPUT_MESSAGES: Record<TranscriptInputIssue, string> = {
  empty: "The transcript is empty.",
  "too-many-bytes": `The transcript is larger than the ${(MAX_TRANSCRIPT_BYTES / 1000).toFixed(0)} KB limit.`,
  "too-many-characters": `The transcript is longer than the ${MAX_TRANSCRIPT_CHARS.toLocaleString("en-GB")} character limit.`,
  "invalid-encoding":
    "The file is not valid UTF-8 text. Save it as UTF-8 and try again.",
  "no-parsable-lines":
    "No transcript lines were recognised. Each line should look like: [L001] Speaker: text.",
};

export type TranscriptInputCheck = {
  ok: boolean;
  issues: TranscriptInputIssue[];
  byteLength: number;
  charLength: number;
};

/** UTF-8 byte length, computed without assuming a Node Buffer is available. */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * Checks the size limits only. Line parsing is checked separately so that a
 * transcript can be reported as "too large" without also being reported as
 * "unparsable".
 */
export function checkTranscriptSize(text: string): TranscriptInputCheck {
  const issues: TranscriptInputIssue[] = [];
  const charLength = [...text].length;
  const byteLength = utf8ByteLength(text);

  if (text.trim().length === 0) issues.push("empty");
  if (byteLength > MAX_TRANSCRIPT_BYTES) issues.push("too-many-bytes");
  if (charLength > MAX_TRANSCRIPT_CHARS) issues.push("too-many-characters");

  return { ok: issues.length === 0, issues, byteLength, charLength };
}

/**
 * Decodes an uploaded .txt file as strict UTF-8. Returns null when the bytes are
 * not valid UTF-8 instead of substituting replacement characters, so the failure
 * surfaces to the visitor rather than corrupting the transcript silently.
 */
export function decodeUtf8Strict(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
