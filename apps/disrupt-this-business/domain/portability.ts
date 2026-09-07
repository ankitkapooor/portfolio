/**
 * Export and import.
 *
 * An exported file carries metadata, the recorded action script, and the
 * financial ledger. Import does not trust the ledger: it replays the script
 * through the engine and fails loudly if a single line disagrees. That is what
 * makes "validated JSON reimports and reproduces all ledger values" checkable
 * rather than asserted.
 */
import { z } from "zod";
import {
  ENGINE_VERSION,
  EXPORT_FORMAT,
  EXPORT_FORMAT_VERSION,
  ExportedRunSchema,
  MAX_IMPORT_BYTES,
  SEGMENT_IDS,
  type ExportedRun,
  type GameRun,
  type LedgerRow,
  type QuarterFinancials,
  type Role,
} from "@/domain/schema";
import { money } from "@/domain/engine";
import { rebuildRun, type ScriptedRound } from "@/domain/run";
import { getScenario, scenarios } from "@/content/scenarios";

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
  }
}

const LEDGER_TOLERANCE = 1e-6;

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function buildLedger(run: GameRun): LedgerRow[] {
  const incumbent = run.state.companies.incumbent.ledger;
  const challenger = run.state.companies.challenger.ledger;
  return incumbent.map((row, index) => ({
    quarter: row.quarter,
    incumbent: row,
    challenger: challenger[index],
  }));
}

export function exportRun(run: GameRun, exportedAt: string): ExportedRun {
  return {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    engineVersion: run.engineVersion,
    scenarioId: run.scenarioId,
    scenarioVersion: run.scenarioVersion,
    exportedAt,
    run: {
      id: run.id,
      parentId: run.parentId,
      mode: run.mode,
      label: run.label,
      createdAt: run.createdAt,
      role: run.role,
      environmentId: run.environmentId,
      fixedOpponent: run.fixedOpponent,
      opponentScript: run.opponentScript,
      rounds: run.rounds.map((r) => ({
        quarter: r.quarter,
        playerAction: r.playerAction,
        opponentAction: r.opponentAction,
        rationale: r.rationale,
        substitution: r.substitution,
      })),
      ledger: buildLedger(run),
    },
  };
}

export function exportRunJson(run: GameRun, exportedAt: string): string {
  return JSON.stringify(exportRun(run, exportedAt), null, 2);
}

/* ------------------------------------------------------------------ */
/* Markdown export                                                     */
/* ------------------------------------------------------------------ */

function financialsRow(quarter: number, f: QuarterFinancials): string {
  return `| Q${quarter} | ${money(f.revenue)} | ${money(f.variableCost)} | ${money(
    f.fixedCost,
  )} | ${money(f.operatingCashFlow)} | ${money(f.investment)} | ${money(
    f.endingCash,
  )} |`;
}

export function exportRunMarkdown(run: GameRun, exportedAt: string): string {
  const scenario = getScenario(run.scenarioId);
  const environment = scenario.environments.find((e) => e.id === run.environmentId);
  const ledger = buildLedger(run);
  const lines: string[] = [];

  lines.push(`# Disrupt This Business - run ${run.id}`);
  lines.push("");
  lines.push(
    "> Fictional design assumptions. RelayWorks and TaskPilot are invented scenario labels. Nothing here is a measurement of, or a prediction about, any real company or market.",
  );
  lines.push("");
  lines.push(`- Scenario: ${scenario.title} (${scenario.id} v${scenario.version})`);
  lines.push(`- Engine version: ${run.engineVersion}`);
  lines.push(`- Environment preset: ${environment?.label ?? run.environmentId}`);
  lines.push(`- You played: ${run.state.companies[run.role].name} (${run.role})`);
  lines.push(`- Mode: ${run.mode}${run.parentId ? ` (branched from ${run.parentId})` : ""}`);
  lines.push(
    `- Opponent: ${run.fixedOpponent ? "fixed script recorded from a previous run" : "recomputed rules-based policy"}`,
  );
  lines.push(`- Exported: ${exportedAt}`);
  lines.push("");

  lines.push("## Decisions");
  lines.push("");
  lines.push("| Quarter | Your commitment | Opponent commitment | Your rationale |");
  lines.push("|---|---|---|---|");
  for (const round of run.rounds) {
    const rationale = round.rationale.replace(/\|/g, "\\|").replace(/\n/g, " ") || "-";
    lines.push(
      `| Q${round.quarter} | ${round.playerAction} | ${round.opponentAction} | ${rationale} |`,
    );
  }
  lines.push("");

  const substitutions = run.rounds.filter((r) => r.substitution);
  if (substitutions.length > 0) {
    lines.push("### Script substitutions");
    lines.push("");
    for (const round of substitutions) {
      lines.push(`- Q${round.quarter}: ${round.substitution}`);
    }
    lines.push("");
  }

  for (const role of ["incumbent", "challenger"] as Role[]) {
    lines.push(`## ${run.state.companies[role].name} ledger`);
    lines.push("");
    lines.push(
      "| Quarter | Revenue | Variable cost | Fixed cost | Operating cash flow | Investment | Ending cash |",
    );
    lines.push("|---|---|---|---|---|---|---|");
    for (const row of ledger) {
      lines.push(financialsRow(row.quarter, row[role]));
    }
    lines.push("");
    lines.push("| Quarter | Small teams | Enterprise teams |");
    lines.push("|---|---|---|");
    for (const row of ledger) {
      lines.push(
        `| Q${row.quarter} | ${row[role].customers.small.toFixed(1)} | ${row[
          role
        ].customers.enterprise.toFixed(1)} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Event ledger");
  lines.push("");
  for (const round of run.rounds) {
    lines.push(`### Q${round.quarter} (snapshot ${round.snapshotHash})`);
    for (const event of [...round.prepareEvents, ...round.events]) {
      lines.push(`- **${event.headline}** - ${event.detail}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Import                                                              */
/* ------------------------------------------------------------------ */

export interface ImportResult {
  run: GameRun;
  /** Non-fatal notes worth showing the user after a successful import. */
  notes: string[];
}

function compareLedger(expected: LedgerRow[], actual: LedgerRow[]): string[] {
  const problems: string[] = [];
  if (expected.length !== actual.length) {
    problems.push(
      `The file records ${expected.length} quarters but replaying its decisions produced ${actual.length}.`,
    );
    return problems;
  }
  const fields = [
    "revenue",
    "variableCost",
    "fixedCost",
    "operatingCashFlow",
    "investment",
    "openingCash",
    "endingCash",
  ] as const;

  expected.forEach((row, index) => {
    const rebuilt = actual[index];
    for (const role of ["incumbent", "challenger"] as Role[]) {
      for (const field of fields) {
        const a = row[role][field];
        const b = rebuilt[role][field];
        if (Math.abs(a - b) > LEDGER_TOLERANCE) {
          problems.push(
            `Q${row.quarter} ${role} ${field}: file says ${money(a)}, replay produced ${money(b)}.`,
          );
        }
      }
      for (const segmentId of SEGMENT_IDS) {
        const a = row[role].customers[segmentId];
        const b = rebuilt[role].customers[segmentId];
        if (Math.abs(a - b) > LEDGER_TOLERANCE) {
          problems.push(
            `Q${row.quarter} ${role} ${segmentId} customers: file says ${a.toFixed(
              3,
            )}, replay produced ${b.toFixed(3)}.`,
          );
        }
      }
    }
  });
  return problems;
}

export function importRun(text: string): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) {
    throw new ImportError(
      `That file is ${Math.round(text.length / 1000)} kB. Imports are capped at ${
        MAX_IMPORT_BYTES / 1000
      } kB.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ImportError(
      `That file is not valid JSON. ${(error as Error).message}`,
    );
  }

  const shape = ExportedRunSchema.safeParse(parsed);
  if (!shape.success) {
    const record = parsed as Record<string, unknown> | null;
    if (record && typeof record === "object" && record.format !== EXPORT_FORMAT) {
      throw new ImportError(
        `This does not look like a Disrupt This Business run. Expected a "format" field of "${EXPORT_FORMAT}", found ${JSON.stringify(
          record.format ?? null,
        )}.`,
      );
    }
    throw new ImportError(
      `The file does not match the run schema.\n${z.prettifyError(shape.error)}`,
    );
  }

  const data = shape.data;

  if (data.formatVersion !== EXPORT_FORMAT_VERSION) {
    throw new ImportError(
      `That run was written in export format version ${data.formatVersion}. This build reads version ${EXPORT_FORMAT_VERSION} only, so its ledger cannot be verified.`,
    );
  }
  if (data.engineVersion !== ENGINE_VERSION) {
    throw new ImportError(
      `That run was produced by engine ${data.engineVersion}. This build runs engine ${ENGINE_VERSION}, and a different engine cannot be trusted to reproduce the recorded ledger.`,
    );
  }

  const scenario = scenarios.find((s) => s.id === data.scenarioId);
  if (!scenario) {
    throw new ImportError(
      `Unknown scenario "${data.scenarioId}". This build ships ${scenarios
        .map((s) => `"${s.id}"`)
        .join(", ")}.`,
    );
  }
  if (scenario.version !== data.scenarioVersion) {
    throw new ImportError(
      `That run used scenario "${data.scenarioId}" version ${data.scenarioVersion}, but this build ships version ${scenario.version}. Parameters have changed, so the ledger would not reproduce.`,
    );
  }

  const scripted: ScriptedRound[] = data.run.rounds.map((r) => ({
    quarter: r.quarter,
    playerAction: r.playerAction,
    opponentAction: r.opponentAction,
    rationale: r.rationale,
    substitution: r.substitution,
  }));

  let run: GameRun;
  try {
    run = rebuildRun(
      {
        id: data.run.id,
        createdAt: data.run.createdAt,
        role: data.run.role,
        environmentId: data.run.environmentId,
        scenarioId: data.scenarioId,
        label: data.run.label,
        mode: data.run.mode,
        parentId: data.run.parentId,
        opponentScript: data.run.opponentScript,
        fixedOpponent: data.run.fixedOpponent,
      },
      scripted,
    );
  } catch (error) {
    throw new ImportError(
      `The recorded decisions could not be replayed: ${(error as Error).message}`,
    );
  }

  const problems = compareLedger(data.run.ledger, buildLedger(run));
  if (problems.length > 0) {
    throw new ImportError(
      `The file's ledger does not match what the engine reproduces from its decisions:\n- ${problems
        .slice(0, 6)
        .join("\n- ")}`,
    );
  }

  const notes: string[] = [];
  if (data.run.parentId) {
    notes.push(`This run was branched from ${data.run.parentId}.`);
  }
  if (data.run.fixedOpponent) {
    notes.push(
      "Fixed-opponent comparison: the opponent replayed a recorded script rather than recomputing its policy.",
    );
  }
  notes.push(
    `Verified: ${data.run.ledger.length} quarter${
      data.run.ledger.length === 1 ? "" : "s"
    } of ledger values reproduced exactly from the recorded decisions.`,
  );
  return { run, notes };
}
