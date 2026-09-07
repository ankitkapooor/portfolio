import type { ExtractionOutput } from "@/domain/schemas/extraction";
import type { DataMode } from "@/domain/schemas/primitives";
import type { ComparisonChoice } from "@/domain/schemas/comparison";
import { COMPARISON_CHOICE_LABELS } from "@/domain/schemas/comparison";
import { DATA_MODE_LABELS } from "@/domain/schemas/primitives";

/**
 * Export (BRD section 8).
 *
 * An exported file has to survive being read a month later with no page around it,
 * so scope, sources, versions and limitations travel with the output. The
 * limitations are part of the payload, not a footer added at render time, which
 * means the JSON and the Markdown cannot disagree about them.
 */

export type ExportOutput = {
  panel: "A" | "B" | null;
  label: string;
  version: string;
  dataMode: DataMode;
  /** What this output is not. Copied from the method descriptor. */
  isNot: string;
  output: ExtractionOutput;
};

export type ExportTranscript = {
  origin: "corpus-sample" | "visitor-supplied";
  id: string | null;
  title: string | null;
  synthetic: boolean;
  wordCount: number;
  lineCount: number;
};

export type ExportComparison = {
  choice: ComparisonChoice | null;
  reason: string | null;
  revealed: boolean;
};

export type ExportPayload = {
  title: string;
  generatedAt: string;
  scope: string;
  transcript: ExportTranscript;
  versions: {
    app: string;
    corpus: string | null;
  };
  outputs: ExportOutput[];
  comparison: ExportComparison | null;
  limitations: string[];
};

export const BASE_LIMITATIONS = [
  "This export is not a benchmark result. It records what one or more methods produced for one transcript.",
  "Nothing here has been scored against a gold annotation.",
  "No model provider is configured in this deployment, so no model produced any part of this file.",
  "An output marked illustrative was hand-authored to show the shape of the output contract. It carries no performance claim.",
];

export function buildExport(args: {
  generatedAt: string;
  appVersion: string;
  corpusVersion: string | null;
  transcript: ExportTranscript;
  outputs: ExportOutput[];
  comparison: ExportComparison | null;
}): ExportPayload {
  const limitations = [...BASE_LIMITATIONS];
  if (args.transcript.synthetic) {
    limitations.unshift(
      "The transcript is synthetic. It was authored for this benchmark and depicts no real meeting.",
    );
  }
  if (args.comparison && !args.comparison.revealed) {
    limitations.push(
      "The comparison was exported before the identities were revealed, so the labels A and B do not say which method produced which output.",
    );
  }
  if (args.comparison?.choice) {
    limitations.push(
      "A single reader's preference is not evidence. No audience preference data has been collected.",
    );
  }

  return {
    title: "The Moat Test — extraction output",
    generatedAt: args.generatedAt,
    scope:
      "One transcript, run through the methods listed below. Scope is a single case; it supports no claim about how any method performs in general.",
    transcript: args.transcript,
    versions: { app: args.appVersion, corpus: args.corpusVersion },
    outputs: args.outputs,
    comparison: args.comparison,
    limitations,
  };
}

export function toJson(payload: ExportPayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function outputToMarkdown(item: ExportOutput): string {
  const lines: string[] = [];
  const heading = item.panel ? `Output ${item.panel}: ${item.label}` : item.label;
  lines.push(`### ${heading}`);
  lines.push("");
  lines.push(`- Version: ${item.version}`);
  lines.push(`- Provenance: ${DATA_MODE_LABELS[item.dataMode]}`);
  lines.push(`- Not: ${item.isNot}`);
  lines.push("");
  lines.push(`**Summary.** ${item.output.summary || "(none)"}`);
  lines.push("");

  lines.push(`**Decisions (${item.output.decisions.length}).**`);
  if (item.output.decisions.length === 0) {
    lines.push("");
    lines.push("- None recorded.");
  } else {
    lines.push("");
    for (const decision of item.output.decisions) {
      lines.push(
        `- ${decision.text} — status: ${decision.status}; lines: ${decision.evidenceLineIds.join(", ") || "none cited"}`,
      );
    }
  }
  lines.push("");

  lines.push(`**Actions (${item.output.actions.length}).**`);
  if (item.output.actions.length === 0) {
    lines.push("");
    lines.push("- None recorded.");
  } else {
    lines.push("");
    for (const action of item.output.actions) {
      const owner = action.owner ?? "not named in the transcript";
      const due =
        action.dueDate ??
        (action.dueDateText
          ? `${action.dueDateText} (not resolved to a date)`
          : "no date");
      lines.push(
        `- ${action.task} — owner: ${owner}; due: ${due}; status: ${action.status}; lines: ${action.evidenceLineIds.join(", ") || "none cited"}`,
      );
    }
  }
  lines.push("");

  for (const [label, items] of [
    ["Open questions", item.output.openQuestions],
    ["Uncertainties", item.output.uncertainties],
  ] as const) {
    lines.push(`**${label} (${items.length}).**`);
    lines.push("");
    if (items.length === 0) {
      lines.push("- None recorded.");
    } else {
      for (const entry of items) {
        lines.push(
          `- ${entry.text} — lines: ${entry.evidenceLineIds.join(", ") || "none cited"}`,
        );
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function toMarkdown(payload: ExportPayload): string {
  const lines: string[] = [];
  lines.push(`# ${payload.title}`);
  lines.push("");
  lines.push(`Generated ${payload.generatedAt}`);
  lines.push("");

  lines.push("## Scope");
  lines.push("");
  lines.push(payload.scope);
  lines.push("");

  lines.push("## Source");
  lines.push("");
  lines.push(
    `- Transcript: ${payload.transcript.origin === "corpus-sample" ? "corpus sample" : "supplied by the reader"}`,
  );
  if (payload.transcript.id) lines.push(`- Case id: ${payload.transcript.id}`);
  if (payload.transcript.title) lines.push(`- Title: ${payload.transcript.title}`);
  lines.push(`- Synthetic: ${payload.transcript.synthetic ? "yes" : "unknown"}`);
  lines.push(
    `- Size: ${payload.transcript.wordCount} words, ${payload.transcript.lineCount} parsed lines`,
  );
  lines.push("");

  lines.push("## Versions");
  lines.push("");
  lines.push(`- Application: ${payload.versions.app}`);
  lines.push(`- Corpus: ${payload.versions.corpus ?? "not applicable"}`);
  lines.push("");

  lines.push("## Outputs");
  lines.push("");
  for (const item of payload.outputs) {
    lines.push(outputToMarkdown(item));
  }

  if (payload.comparison) {
    lines.push("## Comparison");
    lines.push("");
    lines.push(
      `- Choice: ${payload.comparison.choice ? COMPARISON_CHOICE_LABELS[payload.comparison.choice] : "none recorded"}`,
    );
    lines.push(`- Reason given: ${payload.comparison.reason ?? "none"}`);
    lines.push(
      `- Identities revealed at export: ${payload.comparison.revealed ? "yes" : "no"}`,
    );
    lines.push("");
  }

  lines.push("## Limitations");
  lines.push("");
  for (const limitation of payload.limitations) {
    lines.push(`- ${limitation}`);
  }
  lines.push("");

  return lines.join("\n");
}
