import { describe, expect, it } from "vitest";
import {
  commitRound,
  createRun,
  playerScript,
  rewindTo,
  switchSides,
} from "@/domain/run";
import { actionVerdict, snapshotHash } from "@/domain/engine";
import { defaultScenario } from "@/content/scenarios";
import type { ActionId, GameRun } from "@/domain/schema";

function newRun(overrides: Partial<Parameters<typeof createRun>[0]> = {}): GameRun {
  return createRun({
    id: "run-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    role: "incumbent",
    environmentId: "reliability-shock",
    scenarioId: defaultScenario.id,
    label: "Test run",
    ...overrides,
  });
}

function play(run: GameRun, actions: ActionId[]): GameRun {
  let current = run;
  for (const action of actions) {
    current = commitRound(current, action, `Rationale for ${action}`);
  }
  return current;
}

describe("run lifecycle", () => {
  it("prepares quarter one immediately and finishes after four quarters", () => {
    const run = newRun();
    expect(run.pending?.state.quarter).toBe(1);
    const finished = play(run, ["improve-reliability", "hold", "reduce-price", "hold"]);
    expect(finished.rounds).toHaveLength(4);
    expect(finished.state.finished).toBe(true);
    expect(finished.pending).toBeNull();
  });

  it("records the alternatives and visible information behind each decision", () => {
    const run = play(newRun(), ["improve-reliability"]);
    const record = run.rounds[0];
    expect(record.alternatives).toHaveLength(defaultScenario.actions.length);
    expect(record.alternatives.some((a) => a.legal)).toBe(true);
    expect(record.informationVisible.join(" ")).toContain("hidden until you lock");
    expect(record.rationale).toBe("Rationale for improve-reliability");
    expect(record.snapshotHash).toHaveLength(8);
  });

  it("rejects an illegal player commitment with the reason attached", () => {
    const run = newRun({ role: "challenger" });
    const afterQ1 = commitRound(run, "autonomous-delivery", "");
    expect(() => commitRound(afterQ1, "improve-reliability", "")).toThrow(
      /Capacity does not carry over/,
    );
  });
});

describe("every role completes every environment", () => {
  const environments = ["foundation", "reliability-shock", "commodity-models"] as const;
  const roles = ["incumbent", "challenger"] as const;

  for (const role of roles) {
    for (const environmentId of environments) {
      it(`${role} plays four quarters in ${environmentId}`, () => {
        let run = newRun({ role, environmentId });
        // Take the first legal choice from the catalog each quarter, so the run
        // exercises real commitments rather than four holds.
        for (let quarter = 1; quarter <= 4; quarter += 1) {
          const legal = run.pending!.state.actions
            .map((a) => a.id)
            .filter((id) => actionVerdict(run.pending!.state, role, id).legal);
          expect(legal.length).toBeGreaterThan(0);
          run = commitRound(run, legal[0], "");
          expect(run.rounds[quarter - 1].quarter).toBe(quarter);
        }
        expect(run.state.finished).toBe(true);
        expect(run.pending).toBeNull();
      });
    }
  }
});

describe("rewind creates an immutable branch", () => {
  it("leaves the original run untouched and preserves earlier decisions", () => {
    const original = play(newRun(), ["improve-reliability", "hold", "reduce-price"]);
    const originalHash = snapshotHash(original.state);
    const originalRounds = original.rounds.map((r) => r.playerAction);

    const branch = rewindTo(original, 2, "run-2", "2026-01-02T00:00:00.000Z");

    expect(snapshotHash(original.state)).toBe(originalHash);
    expect(original.rounds.map((r) => r.playerAction)).toEqual(originalRounds);
    expect(original.rounds).toHaveLength(3);

    expect(branch.id).toBe("run-2");
    expect(branch.parentId).toBe("run-1");
    expect(branch.mode).toBe("branch");
    expect(branch.rounds).toHaveLength(1);
    expect(branch.rounds[0].playerAction).toBe("improve-reliability");
    expect(branch.pending?.state.quarter).toBe(2);
  });

  it("reproduces the parent when the same decision is replayed", () => {
    const original = play(newRun(), ["improve-reliability", "hold", "reduce-price"]);
    const branch = rewindTo(original, 3, "run-2", "2026-01-02T00:00:00.000Z");
    const replayed = commitRound(branch, "reduce-price", "Rationale for reduce-price");
    expect(snapshotHash(replayed.state)).toBe(snapshotHash(original.state));
  });

  it("keeps the external event sequence identical on the branch", () => {
    const original = play(newRun(), ["hold", "hold", "hold", "hold"]);
    const branch = rewindTo(original, 2, "run-2", "2026-01-02T00:00:00.000Z");
    expect(branch.pending?.state.appliedEventIds).toEqual(["reliability-shock-q2"]);
    const diverged = commitRound(branch, "improve-reliability", "");
    expect(diverged.state.appliedEventIds).toEqual(["reliability-shock-q2"]);
  });

  it("refuses to rewind to a quarter that was never played", () => {
    const original = play(newRun(), ["hold"]);
    expect(() => rewindTo(original, 3, "run-2", "2026-01-02T00:00:00.000Z")).toThrow(
      /has not been played/,
    );
  });
});

describe("switch sides", () => {
  it("starts on the other side with the recorded actions as a fixed script", () => {
    const original = play(newRun(), ["improve-reliability", "hold", "reduce-price", "hold"]);
    const reversed = switchSides(original, "run-3", "2026-01-03T00:00:00.000Z");

    expect(reversed.role).toBe("challenger");
    expect(reversed.mode).toBe("switch-sides");
    expect(reversed.parentId).toBe("run-1");
    expect(reversed.fixedOpponent).toBe(true);
    expect(reversed.opponentScript).toEqual(playerScript(original));
    expect(reversed.environmentId).toBe(original.environmentId);
    expect(reversed.rounds).toHaveLength(0);
    expect(reversed.pending?.state.quarter).toBe(1);
  });

  it("replays the script when legal", () => {
    const original = play(newRun(), ["improve-reliability", "hold", "reduce-price", "hold"]);
    const reversed = play(switchSides(original, "run-3", "2026-01-03T00:00:00.000Z"), [
      "hold",
      "hold",
      "hold",
      "hold",
    ]);
    expect(reversed.rounds.map((r) => r.opponentAction)).toEqual([
      "improve-reliability",
      "hold",
      "reduce-price",
      "hold",
    ]);
    expect(reversed.rounds.every((r) => r.substitution === null)).toBe(true);
  });

  it("substitutes hold with a stated reason instead of a stronger move", () => {
    // RelayWorks buys enterprise integrations twice, which needs 2 of its 3
    // effort units each quarter. Replayed by TaskPilot, which only has 2 units
    // and spends both on autonomous delivery, the second copy becomes illegal.
    const original = play(newRun({ role: "challenger" }), [
      "autonomous-delivery",
      "hold",
      "hold",
      "hold",
    ]);
    const reversed = switchSides(original, "run-3", "2026-01-03T00:00:00.000Z");
    // The script now belongs to RelayWorks (capacity 3), so make it bite by
    // rewriting it to two consecutive 2-effort commitments.
    const tight: GameRun = {
      ...reversed,
      opponentScript: [
        { quarter: 1, actionId: "autonomous-delivery" },
        { quarter: 2, actionId: "enterprise-integrations" },
        { quarter: 3, actionId: "hold" },
        { quarter: 4, actionId: "hold" },
      ],
      role: "challenger",
    };
    const played = play(tight, ["hold", "hold"]);
    expect(played.rounds[1].opponentAction).toBe("hold");
    expect(played.rounds[1].substitution).toContain("illegal here");
    expect(played.rounds[1].substitution).toContain(
      "Substituted with hold rather than a different move",
    );
  });

  it("refuses to switch sides before anything has been recorded", () => {
    expect(() => switchSides(newRun(), "run-3", "2026-01-03T00:00:00.000Z")).toThrow(
      /at least one quarter/,
    );
  });
});
