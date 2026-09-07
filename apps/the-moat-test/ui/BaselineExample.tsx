import { runTaggedTranscriptBaseline } from "@/domain/baseline/tagged-transcript-baseline";
import { METHODS } from "@/domain/methods";
import { caseById } from "@/experiments/corpus";
import { toPublicSample } from "@/domain/schemas/corpus";
import { CASE_FAMILY_LABELS } from "@/domain/schemas/primitives";
import { DataModeBadge, SyntheticBadge } from "./Badges";
import { OutputView } from "./OutputView";
import { TranscriptView, transcriptLineText } from "./TranscriptView";

const EXAMPLE_CASE_ID = "case-001";

/**
 * A full worked example: one synthetic transcript, and what the deterministic
 * baseline actually extracts from it.
 *
 * The baseline runs here, at render time, over the real corpus transcript, so this
 * is an execution of the method rather than a mock-up of one. Only the gold-free
 * projection of the case is used.
 */
export function BaselineExample() {
  const source = caseById(EXAMPLE_CASE_ID);
  if (!source) throw new Error(`example case ${EXAMPLE_CASE_ID} is missing`);

  const sample = toPublicSample(source);
  const result = runTaggedTranscriptBaseline(sample.transcript);
  const method = METHODS["tagged-transcript-baseline"];
  const cited = [
    ...result.output.decisions.flatMap((item) => item.evidenceLineIds),
    ...result.output.actions.flatMap((item) => item.evidenceLineIds),
  ];

  return (
    <section className="workedExample" aria-labelledby="baseline-example-heading">
      <header className="resultsHeader">
        <h3 id="baseline-example-heading">
          Worked example: {method.name} on {sample.title}
        </h3>
        <span className="badgeRow">
          <SyntheticBadge />
          <DataModeBadge mode="recorded-experiment" />
        </span>
      </header>
      <p className="measure resultsIntro">
        {CASE_FAMILY_LABELS[sample.family]} · {sample.wordCount} words ·{" "}
        {result.taggedLineCount} of {result.totalLineCount} lines carry a tag. The
        baseline reads only those {result.taggedLineCount} lines; the highlighted
        rows are the ones it used.
      </p>

      <div className="exampleGrid">
        <div className="examplePanel">
          <h4 className="panelHeading" id="baseline-example-transcript">
            Transcript
          </h4>
          <div className="transcriptScroll">
            <TranscriptView
              transcript={sample.transcript}
              highlightLineIds={cited}
              labelledBy="baseline-example-transcript"
            />
          </div>
        </div>
        <div className="examplePanel">
          <h4 className="panelHeading">What the baseline extracts</h4>
          <OutputView
            output={result.output}
            lineText={transcriptLineText(sample.transcript)}
            idPrefix="baseline-example"
          />
        </div>
      </div>

      <p className="measure note noteLimitation">
        <strong>{method.isNot}</strong> Every decision comes back as
        &ldquo;unresolved&rdquo; and every owner as null because a tag does not carry
        that information, not because the meeting was ambiguous.
      </p>
    </section>
  );
}
