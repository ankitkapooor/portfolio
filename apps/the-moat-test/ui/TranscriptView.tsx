import { parseTranscript } from "@/domain/transcript";

/**
 * A transcript, one utterance per line, with the line id kept visible so that a
 * citation elsewhere on the page can be checked against the source.
 */
export function TranscriptView({
  transcript,
  highlightLineIds = [],
  labelledBy,
}: {
  transcript: string;
  highlightLineIds?: readonly string[];
  labelledBy?: string;
}) {
  const { lines } = parseTranscript(transcript);
  const highlighted = new Set(highlightLineIds);

  return (
    <ol className="transcriptView" aria-labelledby={labelledBy}>
      {lines.map((line) => (
        <li
          key={line.id}
          id={`line-${line.id}`}
          className={
            highlighted.has(line.id) ? "transcriptLine transcriptLineCited" : "transcriptLine"
          }
        >
          <span className="transcriptLineId">{line.id}</span>
          <span className="transcriptSpeaker">{line.speaker}</span>
          <span className="transcriptText">{line.text}</span>
        </li>
      ))}
    </ol>
  );
}

export function transcriptLineText(transcript: string): Record<string, string> {
  const { lines } = parseTranscript(transcript);
  return Object.fromEntries(
    lines.map((line) => [line.id, `${line.speaker}: ${line.text}`]),
  );
}
