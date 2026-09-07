"use client";

import { useId, useRef, useState } from "react";
import type { PublicSample } from "@/domain/schemas/corpus";
import {
  MAX_TRANSCRIPT_BYTES,
  MAX_TRANSCRIPT_CHARS,
  TRANSCRIPT_INPUT_MESSAGES,
  type TranscriptInputIssue,
} from "@/domain/schemas/transcript-input";
import {
  readUploadedTranscript,
  validateTranscriptInput,
} from "@/domain/transcript/validate";
import { CASE_FAMILY_LABELS } from "@/domain/schemas/primitives";
import { SyntheticBadge } from "@/ui/Badges";

const EXAMPLE_FORMAT = "[L001] Priya: Let's start with the renewal.";

export type TranscriptSelection =
  | { kind: "sample"; sampleId: string }
  | { kind: "own"; text: string };

export function TranscriptInput({
  samples,
  selection,
  onSelectSample,
  onSubmitOwn,
}: {
  samples: readonly PublicSample[];
  selection: TranscriptSelection;
  onSelectSample: (sampleId: string) => void;
  onSubmitOwn: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [issues, setIssues] = useState<TranscriptInputIssue[]>([]);
  const [skipped, setSkipped] = useState<number[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const textareaId = useId();
  const fileId = useId();

  const live = validateTranscriptInput(draft);

  const submit = () => {
    const validation = validateTranscriptInput(draft);
    setIssues(validation.issues);
    setSkipped(validation.skippedLineNumbers);
    if (validation.ok) onSubmitOwn(draft);
  };

  const onFile = async (file: File) => {
    setIssues([]);
    setSkipped([]);
    if (file.size > MAX_TRANSCRIPT_BYTES) {
      // Checked before reading: a 50 MB file should not be loaded into memory
      // just to be told it is too large.
      setIssues(["too-many-bytes"]);
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = readUploadedTranscript(bytes);
    if (!result.ok) {
      setIssues(result.issues);
      return;
    }
    setDraft(result.text);
    setSkipped(result.validation.skippedLineNumbers);
    onSubmitOwn(result.text);
  };

  return (
    <div className="transcriptInput">
      <fieldset className="sampleChooser">
        <legend>Choose a transcript</legend>
        <ul className="sampleList">
          {samples.map((sample) => {
            const active =
              selection.kind === "sample" && selection.sampleId === sample.id;
            return (
              <li key={sample.id}>
                <button
                  type="button"
                  className={`sampleButton${active ? " sampleButtonActive" : ""}`}
                  aria-pressed={active}
                  onClick={() => onSelectSample(sample.id)}
                >
                  <span className="sampleTitle">{sample.title}</span>
                  <span className="sampleFamily">
                    {CASE_FAMILY_LABELS[sample.family]}
                  </span>
                  <span className="sampleMeta">
                    {sample.wordCount} words · {sample.lineIds.length} lines
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="badgeRow sampleNote">
          <SyntheticBadge />
          <span>
            All six were written for this benchmark. None is a real meeting.
          </span>
        </p>
      </fieldset>

      <div className="ownTranscript">
        <h3 className="panelHeading">Or use your own</h3>
        <p className="ownTranscriptNote">
          Your transcript stays in this browser. It is not uploaded, and no model is
          called: the deterministic baseline runs locally on the text you paste.
        </p>

        <label htmlFor={textareaId} className="fieldLabel">
          Paste a transcript
        </label>
        <p id={`${textareaId}-format`} className="fieldHint">
          One utterance per line, in the form <code>{EXAMPLE_FORMAT}</code>
        </p>
        <textarea
          id={textareaId}
          className="transcriptTextarea"
          rows={8}
          value={draft}
          spellCheck={false}
          aria-describedby={`${textareaId}-format ${textareaId}-count`}
          onChange={(event) => setDraft(event.target.value)}
        />
        <p id={`${textareaId}-count`} className="fieldHint" aria-live="polite">
          {live.charLength.toLocaleString("en-GB")} of{" "}
          {MAX_TRANSCRIPT_CHARS.toLocaleString("en-GB")} characters ·{" "}
          {(live.byteLength / 1000).toFixed(1)} of{" "}
          {(MAX_TRANSCRIPT_BYTES / 1000).toFixed(0)} KB · {live.lineCount} parsed
          lines
        </p>

        <div className="inputActions">
          <button type="button" className="button" onClick={submit}>
            Run the baseline on this text
          </button>
          <label htmlFor={fileId} className="button buttonSecondary fileLabel">
            Upload a .txt file
          </label>
          <input
            id={fileId}
            ref={fileInput}
            type="file"
            accept=".txt,text/plain"
            className="visuallyHidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
              event.target.value = "";
            }}
          />
        </div>

        {issues.length > 0 ? (
          <ul className="inputIssues" role="alert" data-testid="transcript-issues">
            {issues.map((issue) => (
              <li key={issue}>{TRANSCRIPT_INPUT_MESSAGES[issue]}</li>
            ))}
          </ul>
        ) : null}

        {issues.length === 0 && skipped.length > 0 ? (
          <p className="inputWarning" role="status">
            {skipped.length}{" "}
            {skipped.length === 1 ? "line was" : "lines were"} not in the expected
            format and {skipped.length === 1 ? "was" : "were"} skipped:{" "}
            {skipped.slice(0, 10).join(", ")}
            {skipped.length > 10 ? "…" : ""}. Skipped lines cannot be cited, so
            anything said on them is invisible to the method.
          </p>
        ) : null}
      </div>
    </div>
  );
}
