import { z } from "zod";

/**
 * Strategic case schema (v2 case template).
 *
 * Every case makes the same four-beat argument — the bet, why now, who else,
 * why it holds — and closes with what would prove it wrong. Each beat names
 * the framework it uses, so a reader can see that the lens was chosen rather
 * than applied by habit.
 *
 * Honesty rule, enforced by `assertCaseValid`: any claim that contains a
 * number must cite at least one source, and every citation must resolve.
 */

const sourceRefs = z.array(z.string().min(1));

export const conditionStatus = ["supported", "plausible", "untested"] as const;
export const pestelImpact = ["high", "medium", "low", "ruled-out"] as const;
export const vrioMark = ["yes", "partial", "no"] as const;
export const decider = ["rules", "model", "human"] as const;

export const conditionStatusLabels: Record<(typeof conditionStatus)[number], string> = {
  supported: "Supported by evidence",
  plausible: "Plausible, not proven",
  untested: "Untested — the open question",
};

export const pestelImpactLabels: Record<(typeof pestelImpact)[number], string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
  "ruled-out": "Ruled out",
};

export const deciderLabels: Record<(typeof decider)[number], string> = {
  rules: "Deterministic rules",
  model: "Model",
  human: "Human",
};

const claim = z.object({
  text: z.string().min(1),
  sourceRefs: sourceRefs.default([]),
});

export const caseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  number: z.string().regex(/^\d{2}$/),
  title: z.string().min(1),
  lens: z.string().min(1),
  question: z.string().min(1),
  /** One sentence. The thesis the whole page argues for. */
  bet: z.string().min(1),
  betDetail: z.string().min(1),
  frameworks: z.array(z.string()).min(1),
  status: z.string().min(1),
  demoUrl: z.string().url().startsWith("https://"),
  repositoryUrl: z.string().url().startsWith("https://"),
  researchedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  conditions: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        detail: z.string().min(1),
        status: z.enum(conditionStatus),
        sourceRefs: sourceRefs.default([]),
      }),
    )
    .min(2)
    .max(4),

  whyNow: z.object({
    title: z.string().min(1),
    framework: z.string().min(1),
    intro: z.string().min(1),
    forces: z
      .array(
        z.object({
          letter: z.enum(["P", "E", "S", "T", "E2", "L"]),
          name: z.string().min(1),
          impact: z.enum(pestelImpact),
          headline: z.string().min(1),
          claims: z.array(claim).default([]),
          soWhat: z.string().min(1),
        }),
      )
      .length(6),
  }),

  landscape: z.object({
    title: z.string().min(1),
    framework: z.string().min(1),
    intro: z.string().min(1),
    xAxis: z.tuple([z.string(), z.string(), z.string()]),
    yAxis: z.tuple([z.string(), z.string(), z.string()]),
    caveat: z.string().min(1),
    players: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          examples: z.string().min(1),
          x: z.number().min(0).max(1),
          y: z.number().min(0).max(1),
          self: z.boolean().default(false),
          wins: z.string().min(1),
          gap: z.string().min(1),
          sourceRefs: sourceRefs.default([]),
        }),
      )
      .min(3),
    whiteSpace: z.string().min(1),
  }),

  vrio: z.object({
    title: z.string().min(1),
    framework: z.string().min(1),
    intro: z.string().min(1),
    rows: z
      .array(
        z.object({
          capability: z.string().min(1),
          v: z.enum(vrioMark),
          r: z.enum(vrioMark),
          i: z.enum(vrioMark),
          o: z.enum(vrioMark),
          verdict: z.string().min(1),
          note: z.string().min(1),
        }),
      )
      .min(2),
    readout: z.string().min(1),
  }),

  killCriteria: z
    .array(
      z.object({
        condition: z.string().min(1),
        ifTrue: z.string().min(1),
        test: z.string().min(1),
        conditionRef: z.string().min(1),
      }),
    )
    .min(2),

  system: z.object({
    title: z.string().min(1),
    intro: z.string().min(1),
    steps: z
      .array(
        z.object({
          label: z.string().min(1),
          decidedBy: z.enum(decider),
          detail: z.string().min(1),
          serves: z.array(z.string()).default([]),
        }),
      )
      .min(3),
  }),

  evidence: z.object({
    built: z.array(claim).min(1),
    notClaimed: z.array(z.string().min(1)).min(1),
  }),

  nextMoves: z.object({
    title: z.string().min(1),
    intro: z.string().min(1),
    stages: z
      .array(
        z.object({
          label: z.string().min(1),
          detail: z.string().min(1),
          gate: z.string().min(1),
        }),
      )
      .min(2),
  }),

  sources: z
    .array(
      z.object({
        id: z.string().min(1),
        publisher: z.string().min(1),
        title: z.string().min(1),
        date: z.string().min(1),
        url: z.string().url().startsWith("https://"),
      }),
    )
    .min(1),
});

export type StrategicCase = z.infer<typeof caseSchema>;
export type CaseInput = z.input<typeof caseSchema>;

const HAS_NUMBER = /\d/;

/** Cross-field checks zod cannot express. Throws with every problem at once. */
export function caseErrors(data: StrategicCase): string[] {
  const errors: string[] = [];
  const sourceIds = new Set(data.sources.map((source) => source.id));
  const conditionIds = new Set(data.conditions.map((condition) => condition.id));

  if (sourceIds.size !== data.sources.length) errors.push("duplicate source id");

  const checkRefs = (where: string, refs: readonly string[]) => {
    for (const ref of refs) {
      if (!sourceIds.has(ref)) errors.push(`${where}: unknown source "${ref}"`);
    }
  };
  const checkClaim = (where: string, text: string, refs: readonly string[]) => {
    checkRefs(where, refs);
    if (HAS_NUMBER.test(text) && refs.length === 0) {
      errors.push(`${where}: a numeric claim must cite a source — "${text.slice(0, 60)}"`);
    }
  };

  data.conditions.forEach((condition) =>
    checkClaim(`condition ${condition.id}`, condition.detail, condition.sourceRefs),
  );
  data.whyNow.forces.forEach((force) =>
    force.claims.forEach((item) => checkClaim(`force ${force.name}`, item.text, item.sourceRefs)),
  );
  data.landscape.players.forEach((player) => checkRefs(`player ${player.id}`, player.sourceRefs));
  data.evidence.built.forEach((item, index) =>
    checkClaim(`evidence ${index + 1}`, item.text, item.sourceRefs),
  );

  for (const criterion of data.killCriteria) {
    if (!conditionIds.has(criterion.conditionRef)) {
      errors.push(`kill criterion points at unknown condition "${criterion.conditionRef}"`);
    }
  }
  for (const step of data.system.steps) {
    for (const ref of step.serves) {
      if (!conditionIds.has(ref)) errors.push(`system step "${step.label}" serves unknown condition "${ref}"`);
    }
  }
  if (data.landscape.players.filter((player) => player.self).length !== 1) {
    errors.push("landscape must mark exactly one player as self");
  }

  return errors;
}

export function parseCase(input: CaseInput): StrategicCase {
  const data = caseSchema.parse(input);
  const errors = caseErrors(data);
  if (errors.length > 0) {
    throw new Error(`Invalid case "${data.slug}":\n- ${errors.join("\n- ")}`);
  }
  return data;
}
