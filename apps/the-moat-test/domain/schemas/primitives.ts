import { z } from "zod";

/**
 * Shared primitive schemas. Everything else in domain/schemas builds on these.
 */

/** Calendar date with no time component, e.g. 2026-09-11. */
export const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected an ISO calendar date (YYYY-MM-DD)");

/** Stable transcript line identifier, e.g. L001. */
export const LineIdSchema = z
  .string()
  .regex(/^L\d{3,4}$/, "expected a line id of the form L001");

/** IANA timezone name, e.g. Europe/London. Not validated against the tz database. */
export const TimezoneSchema = z.string().min(1);

/**
 * How a displayed result was produced. The BRD (section 3) names three modes.
 * `recorded-experiment` covers any actual execution of a real method whose run
 * metadata is preserved, whether the run is read from `experiments/runs` or
 * executed deterministically in the visitor's browser. `ExperimentRun.archived`
 * distinguishes those two situations.
 */
export const DataModeSchema = z.enum([
  "illustrative-demo",
  "recorded-experiment",
  "live-trial",
]);
export type DataMode = z.infer<typeof DataModeSchema>;

export const DATA_MODE_LABELS: Record<DataMode, string> = {
  "illustrative-demo": "Illustrative demo",
  "recorded-experiment": "Recorded experiment",
  "live-trial": "Live trial",
};

export const DATA_MODE_DESCRIPTIONS: Record<DataMode, string> = {
  "illustrative-demo":
    "Hand-authored output written by the author to illustrate a format. No model produced it and it carries no performance claim.",
  "recorded-experiment":
    "Actual output from an actual execution of a named method, preserved with its run metadata.",
  "live-trial":
    "Output from a configured model provider, produced after the visitor deliberately ran a transcript.",
};

/** Split names for the corpus. */
export const SplitSchema = z.enum(["development", "held-out"]);
export type Split = z.infer<typeof SplitSchema>;

/** The six case families required by BRD section 6. */
export const CaseFamilySchema = z.enum([
  "explicit-action-ownership",
  "ambiguous-owner-or-date",
  "decision-reversed",
  "conflicting-no-resolution",
  "multi-project-repeated-names",
  "embedded-instruction-override",
]);
export type CaseFamily = z.infer<typeof CaseFamilySchema>;

export const CASE_FAMILY_LABELS: Record<CaseFamily, string> = {
  "explicit-action-ownership": "Explicit action ownership",
  "ambiguous-owner-or-date": "Ambiguous owner or date",
  "decision-reversed": "Decision later reversed",
  "conflicting-no-resolution": "Conflicting statements, no resolution",
  "multi-project-repeated-names": "Multiple projects, repeated names",
  "embedded-instruction-override": "Embedded instruction override attempt",
};

export const DecisionStatusSchema = z.enum([
  "current",
  "superseded",
  "unresolved",
]);
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;

export const ActionStatusSchema = z.enum(["open", "completed", "cancelled"]);
export type ActionStatus = z.infer<typeof ActionStatusSchema>;
