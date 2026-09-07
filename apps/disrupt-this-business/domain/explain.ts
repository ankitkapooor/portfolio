/**
 * Rule-based explanations and closing observations.
 *
 * Every sentence produced here is derived from the engine's own event ledger or
 * from the scenario parameters, and every item names the formula or parameter
 * behind it. No language model is involved anywhere in P0, so the explanation
 * path here is the only path: there is no narration call that can time out.
 */
import {
  SEGMENT_IDS,
  type EngineEvent,
  type GameRun,
  type RoundRecord,
  type Role,
} from "@/domain/schema";
import { money } from "@/domain/engine";

export interface RoundExplanation {
  /** Always "rule-based" in P0. Displayed so the source of the text is never ambiguous. */
  source: "rule-based";
  headline: string;
  tradeoff: string;
  /** Ids of the ledger events this text is derived from. */
  evidenceIds: string[];
  formulaIds: string[];
}

export function explainRound(record: RoundRecord): RoundExplanation {
  const all: EngineEvent[] = [...record.prepareEvents, ...record.events];
  const mine = all.find(
    (e) => e.kind === "financials" && e.role === record.playerRole,
  );
  const theirs = all.find(
    (e) => e.kind === "financials" && e.role !== record.playerRole && e.role !== null,
  );
  const accepted = all.find(
    (e) => e.kind === "action-accepted" && e.role === record.playerRole,
  );
  const outlay = all.find(
    (e) => e.kind === "investment-outlay" && e.role === record.playerRole,
  );

  const evidenceIds = [mine, theirs, accepted, outlay]
    .filter((e): e is EngineEvent => Boolean(e))
    .map((e) => e.id);

  const tradeoff = outlay
    ? `${outlay.headline}. That cash is gone this quarter whether or not the commitment pays off, and the effect lands on the activation date shown on the control.`
    : "No cash left the business this quarter, so the whole trade-off is the quarter of capacity you did not spend.";

  return {
    source: "rule-based",
    headline: mine?.headline ?? `Q${record.quarter} resolved`,
    tradeoff,
    evidenceIds,
    formulaIds: Array.from(new Set(all.flatMap((e) => e.formulaIds))),
  };
}

export interface Observation {
  title: string;
  body: string;
  formulaIds: string[];
}

/** Exactly three closing observations, all grounded in the recorded ledger. */
export function closingObservations(run: GameRun): Observation[] {
  const role: Role = run.role;
  const you = run.state.companies[role];
  const rival =
    run.state.companies[role === "incumbent" ? "challenger" : "incumbent"];
  const ledger = you.ledger;
  const first = ledger[0];
  const last = ledger[ledger.length - 1];

  const observations: Observation[] = [];

  if (!first || !last) {
    return [
      {
        title: "No quarters resolved yet",
        body: "Lock a decision to produce a ledger. Observations are generated only from resolved quarters.",
        formulaIds: [],
      },
    ];
  }

  const worst = ledger.reduce((acc, row) =>
    row.operatingCashFlow < acc.operatingCashFlow ? row : acc,
  );
  observations.push({
    title: "Cash trajectory",
    body: `${you.name} ended on ${money(last.endingCash)} against ${money(
      rival.ledger[rival.ledger.length - 1]?.endingCash ?? 0,
    )} for ${rival.name}. The weakest quarter was Q${worst.quarter} at ${money(
      worst.operatingCashFlow,
    )} of operating cash flow. Ending cash is opening cash minus investment outlays plus operating cash flow; there is no financing in this model.`,
    formulaIds: ["F-OCF", "F-CASH"],
  });

  const smallChange = last.customers.small - first.customers.small;
  const enterpriseChange = last.customers.enterprise - first.customers.enterprise;
  observations.push({
    title: "Where the customers moved",
    body: `Small teams changed by ${smallChange.toFixed(
      1,
    )} and enterprise teams by ${enterpriseChange.toFixed(
      1,
    )}. Only 20% of each small-team cohort and 8% of each enterprise cohort reconsider per quarter, so enterprise positions move slowly in either direction and the relationship bonus is more than twice as large there.`,
    formulaIds: ["P-SEGMENTS", "F-ALLOC"],
  });

  const paid = run.rounds.filter((r) => r.playerAction !== "hold");
  const activated = you.pendingProjects.filter((p) => p.activated).length;
  const stranded = you.pendingProjects.filter((p) => !p.activated);
  if (last.fundingRequired) {
    observations.push({
      title: "Funding required",
      body: `${you.name} finished with negative cash of ${money(
        last.endingCash,
      )}. Once ending cash is negative, paid commitments are blocked and only price changes and hold remain. The model injects no financing.`,
      formulaIds: ["F-CASH", "P-INSOLVENCY"],
    });
  } else {
    observations.push({
      title: "Timing of the build",
      body: `You made ${paid.length} non-hold commitment${
        paid.length === 1 ? "" : "s"
      }. ${activated} project${
        activated === 1 ? "" : "s"
      } activated inside the game and ${stranded.length} remained committed work at the final whistle${
        stranded.length > 0
          ? ` (${stranded
              .map((p) => `${p.actionId} due Q${p.activationQuarter}`)
              .join(", ")})`
          : ""
      }. Projects that complete after Q${run.state.totalRounds} carry no terminal benefit here.`,
      formulaIds: ["P-TIMING"],
    });
  }

  return observations.slice(0, 3);
}

/** Segment-level customer mix for the results page and its chart alternative. */
export function customerMix(run: GameRun) {
  return SEGMENT_IDS.map((segmentId) => ({
    segmentId,
    label: run.state.segments.find((s) => s.id === segmentId)?.label ?? segmentId,
    incumbent: run.state.customers[segmentId].incumbent,
    challenger: run.state.customers[segmentId].challenger,
    outside: run.state.customers[segmentId].outside,
  }));
}
