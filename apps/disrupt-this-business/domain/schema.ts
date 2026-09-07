/**
 * Schemas and types for Disrupt This Business.
 *
 * Everything in this file describes a FICTIONAL scenario. No value here is an
 * empirical measurement of any real company or market.
 */
import { z } from "zod";

export const ENGINE_VERSION = "1.0.0";
export const EXPORT_FORMAT = "disrupt-this-business/run";
export const EXPORT_FORMAT_VERSION = 1;

/* ------------------------------------------------------------------ */
/* Identifiers                                                         */
/* ------------------------------------------------------------------ */

export const RoleSchema = z.enum(["incumbent", "challenger"]);
export type Role = z.infer<typeof RoleSchema>;

/** A customer's current supplier. "outside" means they buy from neither company. */
export const SupplierSchema = z.enum(["incumbent", "challenger", "outside"]);
export type Supplier = z.infer<typeof SupplierSchema>;

export const SegmentIdSchema = z.enum(["small", "enterprise"]);
export type SegmentId = z.infer<typeof SegmentIdSchema>;

export const TraitIdSchema = z.enum([
  "reliability",
  "automation",
  "integration",
  "reach",
]);
export type TraitId = z.infer<typeof TraitIdSchema>;

/** Catalog order matters: it is the opponent's deterministic tie-break. */
export const ActionIdSchema = z.enum([
  "improve-reliability",
  "enterprise-integrations",
  "autonomous-delivery",
  "expand-distribution",
  "reduce-price",
  "outcome-bundles",
  "commission-research",
  "hold",
]);
export type ActionId = z.infer<typeof ActionIdSchema>;

export const EnvironmentIdSchema = z.enum([
  "foundation",
  "reliability-shock",
  "commodity-models",
]);
export type EnvironmentId = z.infer<typeof EnvironmentIdSchema>;

export const OTHER_ROLE: Record<Role, Role> = {
  incumbent: "challenger",
  challenger: "incumbent",
};

export const SEGMENT_IDS: readonly SegmentId[] = ["small", "enterprise"];
export const SUPPLIER_IDS: readonly Supplier[] = [
  "incumbent",
  "challenger",
  "outside",
];
export const TRAIT_IDS: readonly TraitId[] = [
  "reliability",
  "automation",
  "integration",
  "reach",
];

/* ------------------------------------------------------------------ */
/* Scenario definition                                                 */
/* ------------------------------------------------------------------ */

export const TraitsSchema = z.strictObject({
  reliability: z.number(),
  automation: z.number(),
  integration: z.number(),
  reach: z.number(),
});
export type Traits = z.infer<typeof TraitsSchema>;

export const BySegmentSchema = z.strictObject({
  small: z.number(),
  enterprise: z.number(),
});
export type BySegment = z.infer<typeof BySegmentSchema>;

export const SegmentWeightsSchema = z.strictObject({
  reliability: z.number(),
  automation: z.number(),
  integration: z.number(),
  reach: z.number(),
  price: z.number(),
});
export type SegmentWeights = z.infer<typeof SegmentWeightsSchema>;

export const SegmentSchema = z.strictObject({
  id: SegmentIdSchema,
  label: z.string(),
  /** Total teams in the segment. Fixed in P0; segment expansion is out of scope. */
  size: z.number().positive(),
  weights: SegmentWeightsSchema,
  /** Annual price used to normalise the price penalty term, in USD. */
  referencePrice: z.number().positive(),
  /** Utility bonus applied only when the option is the cohort's current supplier. */
  relationshipBonus: z.number(),
  /** Share of each cohort that re-evaluates its supplier each quarter. */
  reconsiderationRate: z.number().min(0).max(1),
});
export type Segment = z.infer<typeof SegmentSchema>;

export const CompanyDefinitionSchema = z.strictObject({
  role: RoleSchema,
  name: z.string(),
  proposition: z.string(),
  cash: z.number(),
  /** Annual price per team, in USD. */
  prices: BySegmentSchema,
  /** Delivery cost per active team per quarter, in USD. */
  variableCost: BySegmentSchema,
  /** Fixed operating cash cost per quarter, in USD. */
  fixedCost: z.number(),
  traits: TraitsSchema,
  /** Effort units available each quarter. Unused capacity does not carry over. */
  capacityPerQuarter: z.number().int().positive(),
  initialCustomers: BySegmentSchema,
  /** TaskPilot already sells outcome bundles, so the conversion is unavailable to it. */
  outcomeBundlesApplied: z.boolean(),
});
export type CompanyDefinition = z.infer<typeof CompanyDefinitionSchema>;

export const ActionDefinitionSchema = z.strictObject({
  id: ActionIdSchema,
  label: z.string(),
  summary: z.string(),
  /** Immediate, irreversible cash outlay in USD. */
  cash: z.number().min(0),
  /** Effort units reserved in every quarter the project occupies. */
  effort: z.number().int().min(0),
  /** Quarters until the effect activates. 0 means the effect applies this quarter. */
  delay: z.number().int().min(0),
  /** Plain-language statement of what is uncertain about this commitment. */
  uncertainty: z.string(),
  /** Formula/parameter identifiers this action links to on the methodology page. */
  formulaIds: z.array(z.string()),
});
export type ActionDefinition = z.infer<typeof ActionDefinitionSchema>;

export const EnvironmentEventSchema = z.strictObject({
  id: z.string(),
  quarter: z.number().int().positive(),
  headline: z.string(),
  detail: z.string(),
  effect: z.discriminatedUnion("kind", [
    z.strictObject({
      kind: z.literal("segment-weight-transfer"),
      from: z.enum(["reliability", "automation", "integration", "reach", "price"]),
      to: z.enum(["reliability", "automation", "integration", "reach", "price"]),
      amount: z.number(),
    }),
    z.strictObject({
      kind: z.literal("commoditisation"),
      variableCostMultiplier: z.number(),
      outsideUtility: z.number(),
    }),
  ]),
});
export type EnvironmentEvent = z.infer<typeof EnvironmentEventSchema>;

export const EnvironmentSchema = z.strictObject({
  id: EnvironmentIdSchema,
  label: z.string(),
  /** Disclosed before play. Never states the quarter an event fires. */
  description: z.string(),
  /** Disclosed set of possible events; timing stays hidden until revealed. */
  disclosedEvents: z.array(z.string()),
  schedule: z.array(EnvironmentEventSchema),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

export const ScenarioSchema = z.strictObject({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  premise: z.string(),
  /** Honesty label rendered wherever scenario numbers appear. */
  assumptionNotice: z.string(),
  totalRounds: z.number().int().positive(),
  segments: z.array(SegmentSchema),
  outsideUtility: z.number(),
  choiceTemperature: z.number().positive(),
  companies: z.strictObject({
    incumbent: CompanyDefinitionSchema,
    challenger: CompanyDefinitionSchema,
  }),
  actions: z.array(ActionDefinitionSchema),
  environments: z.array(EnvironmentSchema),
  /** Lowest allowed price as a share of the role's original price. */
  priceFloorShare: z.number().positive(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

/* ------------------------------------------------------------------ */
/* Runtime game state                                                  */
/* ------------------------------------------------------------------ */

export const PendingProjectSchema = z.strictObject({
  id: z.string(),
  actionId: ActionIdSchema,
  committedQuarter: z.number().int(),
  activationQuarter: z.number().int(),
  effort: z.number().int(),
  /** Quarters in which this project holds effort. */
  occupiedQuarters: z.array(z.number().int()),
  activated: z.boolean(),
});
export type PendingProject = z.infer<typeof PendingProjectSchema>;

export const QuarterFinancialsSchema = z.strictObject({
  quarter: z.number().int(),
  openingCash: z.number(),
  investment: z.number(),
  revenue: z.number(),
  variableCost: z.number(),
  fixedCost: z.number(),
  operatingCashFlow: z.number(),
  endingCash: z.number(),
  fundingRequired: z.boolean(),
  customers: BySegmentSchema,
});
export type QuarterFinancials = z.infer<typeof QuarterFinancialsSchema>;

export const CompanyStateSchema = z.strictObject({
  role: RoleSchema,
  name: z.string(),
  cash: z.number(),
  prices: BySegmentSchema,
  originalPrices: BySegmentSchema,
  variableCost: BySegmentSchema,
  fixedCost: z.number(),
  traits: TraitsSchema,
  capacityPerQuarter: z.number().int(),
  /** Quarter number (as string key) -> effort units already reserved. */
  effortReserved: z.record(z.string(), z.number()),
  pendingProjects: z.array(PendingProjectSchema),
  outcomeBundlesApplied: z.boolean(),
  /** True once ending cash has gone negative. Paid commitments stay blocked. */
  fundingRequired: z.boolean(),
  ledger: z.array(QuarterFinancialsSchema),
});
export type CompanyState = z.infer<typeof CompanyStateSchema>;

export const ResearchNoteSchema = z.strictObject({
  purchasedInQuarter: z.number().int(),
  aboutQuarter: z.number().int(),
  headline: z.string(),
  detail: z.string(),
});
export type ResearchNote = z.infer<typeof ResearchNoteSchema>;

/**
 * What "Commission customer research" would reveal about the coming quarter.
 * This is hidden information: `publicSnapshot()` strips it before the opponent
 * policy ever sees the state.
 */
export const NextQuarterPreviewSchema = z.strictObject({
  quarter: z.number().int(),
  headline: z.string(),
  detail: z.string(),
});
export type NextQuarterPreview = z.infer<typeof NextQuarterPreviewSchema>;

export const GameStateSchema = z.strictObject({
  scenarioId: z.string(),
  scenarioVersion: z.string(),
  engineVersion: z.string(),
  environmentId: EnvironmentIdSchema,
  totalRounds: z.number().int(),
  /** 0 before the first round is prepared, otherwise the quarter in play. */
  quarter: z.number().int(),
  phase: z.enum(["initial", "prepared", "resolved"]),
  finished: z.boolean(),
  segments: z.array(SegmentSchema),
  outsideUtility: z.number(),
  choiceTemperature: z.number(),
  /** Lowest allowed price as a share of the role's original price. */
  priceFloorShare: z.number(),
  /**
   * The decision catalog, copied in so the engine needs nothing but the state.
   * Order is load-bearing: it is the opponent's final tie-break.
   */
  actions: z.array(ActionDefinitionSchema),
  /** Fractional customer equivalents: segment -> current supplier -> count. */
  customers: z.strictObject({
    small: z.strictObject({
      incumbent: z.number(),
      challenger: z.number(),
      outside: z.number(),
    }),
    enterprise: z.strictObject({
      incumbent: z.number(),
      challenger: z.number(),
      outside: z.number(),
    }),
  }),
  companies: z.strictObject({
    incumbent: CompanyStateSchema,
    challenger: CompanyStateSchema,
  }),
  /** Event ids whose effects have already been folded into state. Never re-applied. */
  appliedEventIds: z.array(z.string()),
  /** Hidden until bought with research. Stripped by `publicSnapshot()`. */
  nextQuarterPreview: NextQuarterPreviewSchema,
  /** Research purchased by the human player, keyed by role. */
  researchNotes: z.strictObject({
    incumbent: z.array(ResearchNoteSchema),
    challenger: z.array(ResearchNoteSchema),
  }),
});
export type GameState = z.infer<typeof GameStateSchema>;

export type CustomerTable = GameState["customers"];

/* ------------------------------------------------------------------ */
/* Engine event ledger                                                 */
/* ------------------------------------------------------------------ */

export const EngineEventSchema = z.strictObject({
  id: z.string(),
  quarter: z.number().int(),
  /** Ordering index within the quarter, following the fixed resolution order. */
  step: z.number().int(),
  kind: z.enum([
    "project-activated",
    "environment-event",
    "action-accepted",
    "action-rejected",
    "investment-outlay",
    "immediate-effect",
    "traits-recalculated",
    "customers-allocated",
    "financials",
    "funding-required",
    "research-revealed",
  ]),
  role: RoleSchema.nullable(),
  headline: z.string(),
  detail: z.string(),
  /** Links this ledger line to a documented parameter or formula (D-F04). */
  formulaIds: z.array(z.string()),
});
export type EngineEvent = z.infer<typeof EngineEventSchema>;

export const PreparedRoundSchema = z.strictObject({
  state: GameStateSchema,
  events: z.array(EngineEventSchema),
});
export type PreparedRound = z.infer<typeof PreparedRoundSchema>;

export const CommittedActionSchema = z.strictObject({
  role: RoleSchema,
  actionId: ActionIdSchema,
  /** Free text from the player. Stored as data; never interpreted as instructions. */
  rationale: z.string().max(2000).optional(),
});
export type CommittedAction = z.infer<typeof CommittedActionSchema>;

/* ------------------------------------------------------------------ */
/* Run records, branching, export envelope                             */
/* ------------------------------------------------------------------ */

export const ActionLegalitySchema = z.strictObject({
  actionId: ActionIdSchema,
  legal: z.boolean(),
  /** Present when legal is false. Shown verbatim on the disabled control. */
  reason: z.string().nullable(),
  cash: z.number(),
  effort: z.number(),
  /** Quarter the effect lands. Equal to the current quarter for immediate actions. */
  activationQuarter: z.number().int(),
});
export type ActionLegality = z.infer<typeof ActionLegalitySchema>;

export const RoundRecordSchema = z.strictObject({
  quarter: z.number().int(),
  snapshotHash: z.string(),
  playerRole: RoleSchema,
  playerAction: ActionIdSchema,
  opponentAction: ActionIdSchema,
  rationale: z.string(),
  /** What the player could see at the moment of commitment. */
  informationVisible: z.array(z.string()),
  /** Legality of every catalog action at commitment time (considered alternatives). */
  alternatives: z.array(ActionLegalitySchema),
  /** Ledger lines produced while preparing the round, before either side chose. */
  prepareEvents: z.array(EngineEventSchema),
  /** Ledger lines produced while resolving the round. */
  events: z.array(EngineEventSchema),
  /** How the opponent arrived at its move, in plain language. */
  opponentExplanation: z.string(),
  /** Reason recorded when a replayed script action had to fall back to hold. */
  substitution: z.string().nullable(),
  preparedState: GameStateSchema,
  resultState: GameStateSchema,
});
export type RoundRecord = z.infer<typeof RoundRecordSchema>;

export const RunModeSchema = z.enum(["standard", "branch", "switch-sides"]);
export type RunMode = z.infer<typeof RunModeSchema>;

export const ScriptEntrySchema = z.strictObject({
  quarter: z.number().int(),
  actionId: ActionIdSchema,
});
export type ScriptEntry = z.infer<typeof ScriptEntrySchema>;

export const GameRunSchema = z.strictObject({
  id: z.string(),
  parentId: z.string().nullable(),
  mode: RunModeSchema,
  label: z.string(),
  createdAt: z.string(),
  role: RoleSchema,
  scenarioId: z.string(),
  scenarioVersion: z.string(),
  engineVersion: z.string(),
  environmentId: EnvironmentIdSchema,
  rounds: z.array(RoundRecordSchema),
  /** Prepared-but-unlocked round, or null when the next round is not yet prepared. */
  pending: PreparedRoundSchema.nullable(),
  state: GameStateSchema,
  /** Recorded opponent action script, used only by switch-sides runs. */
  opponentScript: z.array(ScriptEntrySchema).nullable(),
  /** True when the opponent replays a fixed script instead of recomputing policy. */
  fixedOpponent: z.boolean(),
});
export type GameRun = z.infer<typeof GameRunSchema>;

export const LedgerRowSchema = z.strictObject({
  quarter: z.number().int(),
  incumbent: QuarterFinancialsSchema,
  challenger: QuarterFinancialsSchema,
});
export type LedgerRow = z.infer<typeof LedgerRowSchema>;

export const ExportedRunSchema = z.strictObject({
  format: z.literal(EXPORT_FORMAT),
  formatVersion: z.number().int(),
  engineVersion: z.string(),
  scenarioId: z.string(),
  scenarioVersion: z.string(),
  exportedAt: z.string(),
  run: z.strictObject({
    id: z.string(),
    parentId: z.string().nullable(),
    mode: RunModeSchema,
    label: z.string(),
    createdAt: z.string(),
    role: RoleSchema,
    environmentId: EnvironmentIdSchema,
    fixedOpponent: z.boolean(),
    opponentScript: z.array(ScriptEntrySchema).nullable(),
    rounds: z.array(
      z.strictObject({
        quarter: z.number().int(),
        playerAction: ActionIdSchema,
        opponentAction: ActionIdSchema,
        rationale: z.string(),
        substitution: z.string().nullable(),
      }),
    ),
    /** Reproduced and checked line by line on import (D-F07). */
    ledger: z.array(LedgerRowSchema),
  }),
});
export type ExportedRun = z.infer<typeof ExportedRunSchema>;

/** Uploads are capped so an import cannot be used as a memory exhaustion vector. */
export const MAX_IMPORT_BYTES = 1_000_000;
