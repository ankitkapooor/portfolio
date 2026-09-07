import { describe, expect, it } from "vitest";
import {
  MAX_TRANSCRIPT_BYTES,
  MAX_TRANSCRIPT_CHARS,
  checkTranscriptSize,
  decodeUtf8Strict,
  utf8ByteLength,
} from "@/domain/schemas/transcript-input";
import {
  readUploadedTranscript,
  validateTranscriptInput,
} from "./validate";

/**
 * Transcript size and encoding limits (BRD section 5 and section 10).
 *
 * The two limits are independent: 100 KB and 30,000 characters. A transcript can
 * breach either one alone, so each is asserted on input that breaches only it.
 */

/** One line of valid transcript, repeated, so the size checks have real material. */
function transcriptOf(lineCount: number): string {
  return Array.from(
    { length: lineCount },
    (_, index) =>
      `[L${String(index + 1).padStart(3, "0")}] Priya: Line ${index + 1} of the discussion.`,
  ).join("\n");
}

describe("the two size limits are the ones the BRD names", () => {
  it("is 100 KB and 30,000 characters", () => {
    expect(MAX_TRANSCRIPT_BYTES).toBe(100_000);
    expect(MAX_TRANSCRIPT_CHARS).toBe(30_000);
  });
});

describe("the character limit", () => {
  it("accepts a transcript of exactly 30,000 characters", () => {
    const text = "a".repeat(MAX_TRANSCRIPT_CHARS);
    const check = checkTranscriptSize(text);
    expect(check.charLength).toBe(30_000);
    expect(check.issues).toEqual([]);
  });

  it("rejects 30,001 characters even though the byte count is well under the limit", () => {
    const text = "a".repeat(MAX_TRANSCRIPT_CHARS + 1);
    const check = checkTranscriptSize(text);
    expect(check.byteLength).toBeLessThan(MAX_TRANSCRIPT_BYTES);
    expect(check.issues).toEqual(["too-many-characters"]);
    expect(check.ok).toBe(false);
  });
});

describe("the byte limit", () => {
  it("rejects a transcript over 100 KB whose character count is still under 30,000", () => {
    // Each emoji is one code point and four UTF-8 bytes.
    const text = "\u{1F600}".repeat(26_000);
    const check = checkTranscriptSize(text);
    expect(check.charLength).toBe(26_000);
    expect(check.charLength).toBeLessThan(MAX_TRANSCRIPT_CHARS);
    expect(check.byteLength).toBe(104_000);
    expect(check.issues).toEqual(["too-many-bytes"]);
  });

  it("reports both breaches together rather than one at a time", () => {
    const text = "\u{1F600}".repeat(40_000);
    const check = checkTranscriptSize(text);
    expect(check.issues).toEqual(["too-many-bytes", "too-many-characters"]);
  });

  it("counts bytes rather than characters", () => {
    expect(utf8ByteLength("abc")).toBe(3);
    expect(utf8ByteLength("\u00e9")).toBe(2);
    expect(utf8ByteLength("\u{1F600}")).toBe(4);
  });
});

describe("validating pasted text", () => {
  it("accepts a well-formed transcript and reports its shape", () => {
    const validation = validateTranscriptInput(transcriptOf(3));
    expect(validation.ok).toBe(true);
    expect(validation.issues).toEqual([]);
    expect(validation.lineCount).toBe(3);
    expect(validation.skippedLineNumbers).toEqual([]);
  });

  it("reports an empty transcript as empty rather than unparsable", () => {
    const validation = validateTranscriptInput("   \n  ");
    expect(validation.issues).toEqual(["empty"]);
  });

  it("reports text with no recognisable line as unparsable", () => {
    const validation = validateTranscriptInput("just some prose with no line ids");
    expect(validation.issues).toEqual(["no-parsable-lines"]);
  });

  it("reports lines it skipped instead of guessing at them", () => {
    const validation = validateTranscriptInput(
      ["[L001] Priya: First.", "no line id here", "[L002] Tomas: Second."].join("\n"),
    );
    expect(validation.ok).toBe(true);
    expect(validation.lineCount).toBe(2);
    expect(validation.skippedLineNumbers).toEqual([2]);
  });
});

describe("uploaded file encoding", () => {
  it("decodes valid UTF-8, including multi-byte characters", () => {
    const text = "[L001] Ren\u00e9e: caf\u00e9 \u{1F600}";
    const bytes = new TextEncoder().encode(text);
    expect(decodeUtf8Strict(bytes)).toBe(text);
    const result = readUploadedTranscript(bytes);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.text).toBe(text);
  });

  it("rejects bytes that are not valid UTF-8 instead of substituting U+FFFD", () => {
    const bytes = new Uint8Array([0x5b, 0x4c, 0x30, 0x30, 0x31, 0x5d, 0xff, 0xfe]);
    expect(decodeUtf8Strict(bytes)).toBeNull();
    const result = readUploadedTranscript(bytes);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toEqual(["invalid-encoding"]);
  });

  it("rejects an uploaded file that decodes cleanly but breaches the byte limit", () => {
    const bytes = new TextEncoder().encode("\u{1F600}".repeat(26_000));
    const result = readUploadedTranscript(bytes);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContain("too-many-bytes");
  });
});
