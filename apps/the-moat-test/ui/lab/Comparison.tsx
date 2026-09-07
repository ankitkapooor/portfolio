"use client";

import { useId, useState } from "react";
import {
  COMPARISON_CHOICE_LABELS,
  type ComparisonChoice,
  type ComparisonSession,
  type PanelSource,
} from "@/domain/schemas/comparison";
import type { ExtractionOutput } from "@/domain/schemas/extraction";
import type { DataMode } from "@/domain/schemas/primitives";
import { DataModeBadge } from "@/ui/Badges";
import { OutputView } from "@/ui/OutputView";

/**
 * Blind comparison (BRD section 8).
 *
 * Both panels render through the same component with the same classes, so they are
 * identical in type, width and formatting by construction. Pre-reveal metadata is
 * the panel letter and nothing else: no method name, no version, no provenance
 * badge, because a badge would give the answer away.
 *
 * The surface as a whole is labelled as not a measurement, which is how requirement
 * M-F03 is met without breaking the blind: no panel is presented as a measured
 * experiment, because the comparison itself is not presented as one.
 */

export type PanelDescriptor = {
  name: string;
  version: string;
  dataMode: DataMode;
  isNot: string;
};

const CHOICES: ComparisonChoice[] = [
  "A",
  "B",
  "tie",
  "insufficient-information",
];

function Panel({
  letter,
  output,
  lineText,
  descriptor,
  revealed,
}: {
  letter: "A" | "B";
  output: ExtractionOutput;
  lineText: Record<string, string>;
  descriptor: PanelDescriptor;
  revealed: boolean;
}) {
  return (
    <section
      className="comparisonPanel"
      aria-labelledby={`panel-${letter}-heading`}
      data-panel={letter}
      data-revealed={revealed ? "true" : "false"}
    >
      <header className="comparisonPanelHeader">
        <h3 id={`panel-${letter}-heading`} className="comparisonPanelTitle">
          Output {letter}
        </h3>
        {revealed ? (
          <div className="comparisonReveal" data-testid={`reveal-${letter}`}>
            <p className="comparisonRevealName">
              {descriptor.name} <span className="numeric">{descriptor.version}</span>
            </p>
            <DataModeBadge mode={descriptor.dataMode} />
            <p className="comparisonRevealIsNot">{descriptor.isNot}</p>
          </div>
        ) : (
          <p className="comparisonPanelHidden">Source hidden until you choose</p>
        )}
      </header>
      <OutputView
        output={output}
        lineText={lineText}
        idPrefix={`panel-${letter}`}
      />
    </section>
  );
}

export function Comparison({
  session,
  outputs,
  descriptors,
  lineText,
  onChoose,
  onReveal,
}: {
  session: ComparisonSession;
  outputs: Record<PanelSource, ExtractionOutput | undefined>;
  descriptors: Record<PanelSource, PanelDescriptor>;
  lineText: Record<string, string>;
  onChoose: (choice: ComparisonChoice, reason: string) => void;
  onReveal: () => void;
}) {
  const [reason, setReason] = useState(session.reason ?? "");
  const groupName = useId();
  const reasonId = useId();

  const outputA = outputs[session.panelA];
  const outputB = outputs[session.panelB];
  if (!outputA || !outputB) return null;

  return (
    <section className="comparison" aria-labelledby="comparison-heading">
      <header className="comparisonHeader">
        <h2 id="comparison-heading" className="pageSectionTitle">
          Which output would you rather receive?
        </h2>
        <p className="measure note noteLimitation" data-testid="comparison-scope">
          This is a reading exercise, not a measurement. One of these outputs was
          produced by a deterministic method and one was hand-authored by the author;
          which is which is hidden until you choose. Your answer stays in your
          browser, is not sent anywhere, and is not evidence about either approach.
          No audience preference data has been collected, so no percentages are shown.
        </p>
      </header>

      <div className="comparisonGrid">
        <Panel
          letter="A"
          output={outputA}
          lineText={lineText}
          descriptor={descriptors[session.panelA]}
          revealed={session.revealed}
        />
        <Panel
          letter="B"
          output={outputB}
          lineText={lineText}
          descriptor={descriptors[session.panelB]}
          revealed={session.revealed}
        />
      </div>

      <div className="comparisonControls">
        <fieldset className="choiceFieldset">
          <legend>Your choice</legend>
          {CHOICES.map((choice) => (
            <label key={choice} className="choiceOption">
              <input
                type="radio"
                name={groupName}
                value={choice}
                checked={session.choice === choice}
                onChange={() => onChoose(choice, reason)}
              />
              <span>{COMPARISON_CHOICE_LABELS[choice]}</span>
            </label>
          ))}
        </fieldset>

        <div className="reasonField">
          <label htmlFor={reasonId} className="fieldLabel">
            Why? (optional, recorded before the reveal)
          </label>
          <textarea
            id={reasonId}
            className="reasonTextarea"
            rows={3}
            value={reason}
            disabled={session.revealed}
            onChange={(event) => setReason(event.target.value)}
            onBlur={() => {
              if (session.choice && !session.revealed) {
                onChoose(session.choice, reason);
              }
            }}
          />
          <p className="fieldHint">
            {session.revealed
              ? "The reason is locked once the sources are revealed, so it stays a pre-reveal judgment."
              : "Written before you know which is which, so it records what you noticed rather than what you expected."}
          </p>
        </div>

        <div className="revealField">
          <button
            type="button"
            className="button"
            disabled={session.choice === null || session.revealed}
            onClick={onReveal}
            data-testid="reveal-button"
          >
            {session.revealed ? "Sources revealed" : "Reveal the sources"}
          </button>
          <p className="fieldHint">
            {session.choice === null
              ? "Choose one of the four options first. Revealing before choosing would make the choice meaningless."
              : session.revealed
                ? "Both panels now name their source above."
                : "Your choice is recorded. Revealing will not change it."}
          </p>
        </div>
      </div>
    </section>
  );
}
