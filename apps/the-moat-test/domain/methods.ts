import type { MethodId } from "@/domain/schemas/experiment";
import {
  TAGGED_BASELINE_NAME,
  TAGGED_BASELINE_VERSION,
} from "@/domain/baseline/tagged-transcript-baseline";

/**
 * Method descriptors used by the UI and the CLIs. The wording here is the wording
 * the reader sees after a blind reveal, so it must not overclaim.
 */

export type MethodDescriptor = {
  id: MethodId;
  name: string;
  version: string;
  /** One sentence a reader can check against the implementation. */
  summary: string;
  /** What this method is not, stated so that nobody has to infer it. */
  isNot: string;
  deterministic: boolean;
  available: boolean;
};

export const METHODS: Record<MethodId, MethodDescriptor> = {
  "tagged-transcript-baseline": {
    id: "tagged-transcript-baseline",
    name: TAGGED_BASELINE_NAME,
    version: TAGGED_BASELINE_VERSION,
    summary:
      "Extracts only transcript lines that carry an explicit ACTION: or DECISION: tag, records the line id, and leaves owner and date null.",
    isNot:
      "Not a measure of human performance, not a commercial product, and not named after any vendor.",
    deterministic: true,
    available: true,
  },
  "ai-structured-extraction": {
    id: "ai-structured-extraction",
    name: "AI structured extraction",
    version: "0.0.0-unconfigured",
    summary:
      "A fixed structured-extraction prompt run against a configured model provider, validated against the extraction schema server-side.",
    isNot:
      "Not configured in this deployment. No model has been called and no measured result exists for it.",
    deterministic: false,
    available: false,
  },
};

/**
 * The illustrative challenger shown in the lab. It is not a method: it is a set of
 * hand-authored outputs. It is described here so the comparison surface can label
 * it without borrowing a method's credibility.
 */
export const ILLUSTRATIVE_CHALLENGER = {
  id: "illustrative-challenger",
  name: "Illustrative structured extraction",
  version: "1.0.0",
  summary:
    "Hand-authored output showing the shape a structured extraction is expected to produce for this sample.",
  isNot:
    "Not produced by a model, not measured, and not evidence that any system can achieve it.",
} as const;

export type ComparisonMethodId = MethodId | typeof ILLUSTRATIVE_CHALLENGER.id;
