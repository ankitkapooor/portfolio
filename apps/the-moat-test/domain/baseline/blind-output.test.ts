import { describe, expect, it } from "vitest";
import { ILLUSTRATIVE_OUTPUTS } from "@/content/illustrative-outputs";
import { ILLUSTRATIVE_CHALLENGER, METHODS } from "@/domain/methods";
import type { ExtractionOutput } from "@/domain/schemas/extraction";
import { CORPUS } from "@/experiments/corpus";
import {
  TAGGED_BASELINE_NAME,
  runTaggedTranscriptBaseline,
} from "./tagged-transcript-baseline";

/**
 * Neither panel of the blind comparison may identify itself (BRD section 8,
 * requirement M-F05).
 *
 * Both outputs render through the same component, so a method name written into
 * the output text is a label the reader can see before choosing. The name belongs
 * in the method metadata the reveal discloses. Scope limitations are content and
 * must stay: they are what lets a reader judge the output fairly.
 */

const METHOD_LABELS = [
  METHODS["tagged-transcript-baseline"].name,
  METHODS["ai-structured-extraction"].name,
  ILLUSTRATIVE_CHALLENGER.name,
  "Hand-authored",
  "Illustrative",
  "Measured",
  "Live trial",
];

/** Everything the comparison panel renders, including screen-reader-only text. */
function renderedText(output: ExtractionOutput): string {
  return [
    output.summary,
    ...output.decisions.map((item) => item.text),
    ...output.actions.map((item) => item.task),
    ...output.openQuestions.map((item) => item.text),
    ...output.uncertainties.map((item) => item.text),
  ].join("\n");
}

function labelsIn(output: ExtractionOutput): string[] {
  const text = renderedText(output);
  return METHOD_LABELS.filter((label) => text.includes(label));
}

describe("the deterministic baseline output", () => {
  it("names no method anywhere, for any corpus case", () => {
    const offenders: string[] = [];
    for (const transcriptCase of CORPUS) {
      const found = labelsIn(
        runTaggedTranscriptBaseline(transcriptCase.transcript).output,
      );
      if (found.length > 0) {
        offenders.push(`${transcriptCase.id}: ${found.join(", ")}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the full scope disclosure in the summary", () => {
    const { output } = runTaggedTranscriptBaseline(CORPUS[0].transcript);
    expect(output.summary).toMatch(
      /^Extracted \d+ tagged lines? from \d+ transcript lines?: \d+ tagged actions? and \d+ tagged decisions?\./,
    );
    expect(output.summary).toContain("This output covers tagged lines only.");
    expect(output.summary).toContain("Untagged discussion is not summarised");
    expect(output.summary).toContain(
      "owners, dates and decision status are not inferred",
    );
    expect(output.summary).not.toContain(TAGGED_BASELINE_NAME);
  });

  it("still discloses that it cannot judge whether a decision stands", () => {
    const withDecision = CORPUS.find(
      (item) =>
        runTaggedTranscriptBaseline(item.transcript).output.decisions.length > 0,
    );
    if (!withDecision) throw new Error("expected a case with a tagged decision");
    const { output } = runTaggedTranscriptBaseline(withDecision.transcript);
    expect(output.uncertainties).toHaveLength(1);
    expect(output.uncertainties[0].text).toMatch(
      /current, superseded, or unresolved/,
    );
  });

  it("counts tagged lines correctly in the summary it reports", () => {
    const { output, taggedLineCount, totalLineCount } =
      runTaggedTranscriptBaseline(CORPUS[0].transcript);
    expect(output.summary).toContain(
      `Extracted ${taggedLineCount} tagged lines from ${totalLineCount} transcript lines:`,
    );
    expect(output.summary).toContain(
      `${output.actions.length} tagged ${output.actions.length === 1 ? "action" : "actions"}`,
    );
  });
});

describe("the hand-authored illustrative outputs", () => {
  it("name no method either, so the other panel is equally anonymous", () => {
    const offenders: string[] = [];
    for (const [caseId, output] of Object.entries(ILLUSTRATIVE_OUTPUTS)) {
      const found = labelsIn(output);
      if (found.length > 0) offenders.push(`${caseId}: ${found.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("the method descriptors", () => {
  it("still carry the names, because the reveal has to disclose them", () => {
    expect(METHODS["tagged-transcript-baseline"].name).toBe(
      "Tagged transcript baseline",
    );
    expect(ILLUSTRATIVE_CHALLENGER.name).toBe("Illustrative structured extraction");
  });
});
