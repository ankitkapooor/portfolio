import type { TranscriptLine } from "@/domain/schemas/corpus";

/**
 * Transcript wire format (BRD section 5): UTF-8 text with speaker labels and
 * stable line ids, one utterance per line.
 *
 *   [L001] Priya: Let's start with the renewal.
 */

const LINE_PATTERN = /^\s*\[(L\d{3,4})\]\s*([^:]{1,80}?)\s*:\s*(.*)$/;

export function renderTranscript(lines: readonly TranscriptLine[]): string {
  return lines.map((line) => `[${line.id}] ${line.speaker}: ${line.text}`).join("\n");
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

export type ParsedTranscript = {
  lines: TranscriptLine[];
  /** 1-based numbers of input lines that could not be parsed and were skipped. */
  skippedLineNumbers: number[];
};

/**
 * Parses transcript text. Lines that do not match the format are reported rather
 * than guessed at, because a mis-parsed line would produce an extraction that
 * cites a line id that does not mean what the reader thinks it means.
 */
export function parseTranscript(text: string): ParsedTranscript {
  const lines: TranscriptLine[] = [];
  const skippedLineNumbers: number[] = [];

  text.split(/\r?\n/).forEach((raw, index) => {
    if (raw.trim().length === 0) return;
    const match = LINE_PATTERN.exec(raw);
    if (!match) {
      skippedLineNumbers.push(index + 1);
      return;
    }
    const [, id, speaker, body] = match;
    if (body.trim().length === 0) {
      skippedLineNumbers.push(index + 1);
      return;
    }
    lines.push({ id, speaker: speaker.trim(), text: body.trim() });
  });

  return { lines, skippedLineNumbers };
}
