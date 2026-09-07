import type {
  ExtractionAction,
  ExtractionDecision,
} from "@/domain/schemas/extraction";
import type { GoldAction, GoldDecision } from "@/domain/schemas/corpus";

/**
 * One-to-one matching between predicted and gold items (BRD section 7).
 *
 * Matching is exact after normalization, using the alternative phrasings declared in
 * the annotation. Anything that is only close is reported as needing human
 * adjudication rather than being scored as a match.
 */

/** Threshold for flagging a near miss for a human. Not a matching rule. */
const ADJUDICATION_OVERLAP = 0.6;

export function normalizeText(text: string): string {
  return text
    .replace(/^\s*(action|decision|todo|task)\s*:\s*/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Owner names compare on normalized text; "Sam" does not equal "Sam Reyes". */
export function normalizeOwner(owner: string): string {
  return owner.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function acceptedForms(
  goldId: string,
  goldText: string,
  alternatives: Record<string, string[]>,
): Set<string> {
  const forms = new Set<string>([normalizeText(goldText)]);
  for (const alternative of alternatives[goldId] ?? []) {
    forms.add(normalizeText(alternative));
  }
  return forms;
}

function tokenOverlap(a: string, b: string): number {
  const left = new Set(a.split(" ").filter(Boolean));
  const right = new Set(b.split(" ").filter(Boolean));
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

export type ActionPair = { predicted: ExtractionAction; gold: GoldAction };

export type ActionMatchResult = {
  pairs: ActionPair[];
  falsePositives: ExtractionAction[];
  missed: GoldAction[];
  /** Unmatched predictions that look close to an unmatched gold item. */
  needsAdjudication: { predicted: ExtractionAction; nearestGoldId: string }[];
};

export function matchActions(
  predicted: readonly ExtractionAction[],
  gold: readonly GoldAction[],
  alternatives: Record<string, string[]>,
): ActionMatchResult {
  const goldForms = gold.map((item) => ({
    item,
    forms: acceptedForms(item.id, item.task, alternatives),
  }));
  const usedGold = new Set<string>();
  const pairs: ActionPair[] = [];
  const falsePositives: ExtractionAction[] = [];

  for (const prediction of predicted) {
    const normalized = normalizeText(prediction.task);
    // First unmatched gold item that accepts this phrasing. A duplicate prediction
    // finds nothing left to consume and becomes a false positive.
    const hit = goldForms.find(
      (candidate) =>
        !usedGold.has(candidate.item.id) && candidate.forms.has(normalized),
    );
    if (hit) {
      usedGold.add(hit.item.id);
      pairs.push({ predicted: prediction, gold: hit.item });
    } else {
      falsePositives.push(prediction);
    }
  }

  const missed = gold.filter((item) => !usedGold.has(item.id));
  const needsAdjudication: ActionMatchResult["needsAdjudication"] = [];
  for (const prediction of falsePositives) {
    const normalized = normalizeText(prediction.task);
    let best: { id: string; score: number } | null = null;
    for (const candidate of missed) {
      const score = tokenOverlap(normalized, normalizeText(candidate.task));
      if (!best || score > best.score) best = { id: candidate.id, score };
    }
    if (best && best.score >= ADJUDICATION_OVERLAP) {
      needsAdjudication.push({ predicted: prediction, nearestGoldId: best.id });
    }
  }

  return { pairs, falsePositives, missed, needsAdjudication };
}

export type DecisionPair = { predicted: ExtractionDecision; gold: GoldDecision };

export type DecisionMatchResult = {
  pairs: DecisionPair[];
  falsePositives: ExtractionDecision[];
  missed: GoldDecision[];
  needsAdjudication: { predicted: ExtractionDecision; nearestGoldId: string }[];
};

export function matchDecisions(
  predicted: readonly ExtractionDecision[],
  gold: readonly GoldDecision[],
  alternatives: Record<string, string[]>,
): DecisionMatchResult {
  const goldForms = gold.map((item) => ({
    item,
    forms: acceptedForms(item.id, item.text, alternatives),
  }));
  const usedGold = new Set<string>();
  const pairs: DecisionPair[] = [];
  const falsePositives: ExtractionDecision[] = [];

  for (const prediction of predicted) {
    const normalized = normalizeText(prediction.text);
    const hit = goldForms.find(
      (candidate) =>
        !usedGold.has(candidate.item.id) && candidate.forms.has(normalized),
    );
    if (hit) {
      usedGold.add(hit.item.id);
      pairs.push({ predicted: prediction, gold: hit.item });
    } else {
      falsePositives.push(prediction);
    }
  }

  const missed = gold.filter((item) => !usedGold.has(item.id));
  const needsAdjudication: DecisionMatchResult["needsAdjudication"] = [];
  for (const prediction of falsePositives) {
    const normalized = normalizeText(prediction.text);
    let best: { id: string; score: number } | null = null;
    for (const candidate of missed) {
      const score = tokenOverlap(normalized, normalizeText(candidate.text));
      if (!best || score > best.score) best = { id: candidate.id, score };
    }
    if (best && best.score >= ADJUDICATION_OVERLAP) {
      needsAdjudication.push({ predicted: prediction, nearestGoldId: best.id });
    }
  }

  return { pairs, falsePositives, missed, needsAdjudication };
}
