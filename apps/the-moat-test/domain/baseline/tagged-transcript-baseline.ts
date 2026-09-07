import {
  ExtractionOutputSchema,
  type ExtractionAction,
  type ExtractionDecision,
  type ExtractionOutput,
  type GroundedText,
} from "@/domain/schemas/extraction";
import { parseTranscript } from "@/domain/transcript";

/**
 * The Tagged transcript baseline (BRD section 5).
 *
 * It extracts only lines that carry an explicit ACTION: or DECISION: tag, records
 * the speaker and line id, and leaves every field it cannot support as null. It
 * does not read untagged discussion, infer owners, resolve dates, or judge whether
 * a decision still stands.
 *
 * This is a narrow extraction baseline. It is not a measure of human performance
 * and it is not a stand-in for any commercial product.
 */

export const TAGGED_BASELINE_ID = "tagged-transcript-baseline";
export const TAGGED_BASELINE_VERSION = "1.0.0";
export const TAGGED_BASELINE_NAME = "Tagged transcript baseline";

/**
 * The frozen rule set. `run-benchmark` hashes this string into the run record, so a
 * later change to the rules invalidates comparisons against archived runs.
 */
export const TAGGED_BASELINE_SPEC = [
  "tagged-transcript-baseline@1.0.0",
  "1. Parse each transcript line as [lineId] Speaker: text.",
  "2. A line whose text begins with ACTION: (case-insensitive) yields one action.",
  "3. A line whose text begins with DECISION: (case-insensitive) yields one decision.",
  "4. The task or decision text is the remainder of the line after the tag.",
  "5. owner, dueDate and dueDateText are always null: the tag does not carry them.",
  "6. Action status is always open.",
  "7. Decision status is always unresolved: the tag does not say whether it still stands.",
  "8. evidenceLineIds is the single line the tag was found on.",
  "9. Untagged lines are not examined.",
].join("\n");

const TAG_PATTERN = /^(action|decision)\s*:\s*(.+)$/i;

export type BaselineResult = {
  output: ExtractionOutput;
  /** Speaker recorded per extracted item, for display. Not part of the contract. */
  speakerByItemId: Record<string, string>;
  taggedLineCount: number;
  totalLineCount: number;
};

export function runTaggedTranscriptBaseline(transcript: string): BaselineResult {
  const { lines } = parseTranscript(transcript);

  const actions: ExtractionAction[] = [];
  const decisions: ExtractionDecision[] = [];
  const speakerByItemId: Record<string, string> = {};

  for (const line of lines) {
    const match = TAG_PATTERN.exec(line.text);
    if (!match) continue;

    const tag = match[1].toLowerCase();
    const body = match[2].trim().replace(/\s+/g, " ");
    if (body.length === 0) continue;

    if (tag === "action") {
      const id = `baseline-action-${line.id}`;
      actions.push({
        id,
        task: body,
        owner: null,
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: [line.id],
      });
      speakerByItemId[id] = line.speaker;
    } else {
      const id = `baseline-decision-${line.id}`;
      decisions.push({
        id,
        text: body,
        status: "unresolved",
        evidenceLineIds: [line.id],
      });
      speakerByItemId[id] = line.speaker;
    }
  }

  const uncertainties: GroundedText[] = [];
  if (decisions.length > 0) {
    uncertainties.push({
      id: "baseline-uncertainty-decision-status",
      text: "This method does not determine whether a decision is current, superseded, or unresolved. Every tagged decision above is reported as unresolved.",
      evidenceLineIds: decisions.flatMap((decision) => decision.evidenceLineIds),
    });
  }

  const taggedLineCount = actions.length + decisions.length;
  const summary = [
    `Tagged transcript baseline. Extracted ${taggedLineCount} tagged ${plural(taggedLineCount, "line")} from ${lines.length} transcript ${plural(lines.length, "line")}:`,
    `${actions.length} tagged ${plural(actions.length, "action")} and ${decisions.length} tagged ${plural(decisions.length, "decision")}.`,
    "This method reads tags only. It does not summarise untagged discussion, infer owners or dates, or judge whether a decision still stands.",
  ].join(" ");

  return {
    output: ExtractionOutputSchema.parse({
      summary,
      decisions,
      actions,
      openQuestions: [],
      uncertainties,
    }),
    speakerByItemId,
    taggedLineCount,
    totalLineCount: lines.length,
  };
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}
