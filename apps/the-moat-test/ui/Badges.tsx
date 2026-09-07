import type { DataMode } from "@/domain/schemas/primitives";

/**
 * Provenance badges.
 *
 * Requirement M-F03: an illustrative output must never read as a measured result.
 * The badge carries a word, not just a colour, so the distinction survives
 * greyscale, colour blindness, and a screen reader.
 */

export const DATA_MODE_COPY: Record<
  DataMode,
  { mark: string; label: string; detail: string; tone: "illustrative" | "measured" }
> = {
  "illustrative-demo": {
    mark: "Illustrative",
    label: "Illustrative — not a measured result",
    detail:
      "Hand-authored to show the shape of the output contract. No model produced it and it carries no performance claim.",
    tone: "illustrative",
  },
  "recorded-experiment": {
    mark: "Measured",
    label: "Measured — archived experiment run",
    detail:
      "Produced by running an archived method over the corpus and scored against draft gold annotations.",
    tone: "measured",
  },
  "live-trial": {
    mark: "Live trial",
    label: "Live trial — unavailable in this deployment",
    detail: "No model provider is configured, so no live trial can run.",
    tone: "illustrative",
  },
};

export function DataModeBadge({
  mode,
  className,
}: {
  mode: DataMode;
  className?: string;
}) {
  const copy = DATA_MODE_COPY[mode];
  const toneClass =
    copy.tone === "measured" ? "pillMeasured" : "pillIllustrative";
  return (
    <span
      className={`pill ${toneClass}${className ? ` ${className}` : ""}`}
      data-data-mode={mode}
    >
      <span className="pillMark">{copy.mark}</span>
      <span className="visuallyHidden">: {copy.label}</span>
    </span>
  );
}

export function SyntheticBadge() {
  return (
    <span className="pill" data-testid="synthetic-badge">
      <span className="pillMark">Synthetic</span>
      <span className="visuallyHidden">
        : this transcript was authored for the benchmark and depicts no real
        meeting
      </span>
    </span>
  );
}

export function DraftGoldBadge() {
  return (
    <span className="pill">
      <span className="pillMark">Draft gold</span>
      <span className="visuallyHidden">
        : annotations written by a coding agent and not reviewed by a human
      </span>
    </span>
  );
}
