import { describe, expect, it } from "vitest";
import {
  ComparisonSessionSchema,
  type PanelSource,
} from "@/domain/schemas/comparison";
import { LAB_SAMPLE_IDS } from "@/experiments/corpus";
import { APP_VERSION } from "./app-meta";
import { assignPanels, hashString } from "./panel-assignment";

/**
 * Blind-state refresh (BRD section 8 and section 10).
 *
 * The seed is persisted, so "reload the page" is the same call with the same
 * arguments. These tests assert that the assignment is a pure function of the
 * stored seed and the sample, that it is not constant, and that the session
 * contract refuses a reveal that came before a choice.
 */

const SOURCES: readonly [PanelSource, PanelSource] = [
  "tagged-transcript-baseline",
  "illustrative-challenger",
];

const SEED = "6f1c0a3d9b2e4f5081a7c3d2e5f60718";

describe("the assignment survives a reload", () => {
  it("returns the same panel order every time for one seed and one sample", () => {
    const first = assignPanels(SEED, "case-001", SOURCES);
    for (let reload = 0; reload < 50; reload += 1) {
      expect(assignPanels(SEED, "case-001", SOURCES)).toEqual(first);
    }
  });

  it("is stable for every sample the lab offers", () => {
    for (const sampleId of LAB_SAMPLE_IDS) {
      const assignment = assignPanels(SEED, sampleId, SOURCES);
      expect(assignPanels(SEED, sampleId, SOURCES)).toEqual(assignment);
    }
  });

  it("depends on the seed, so a fresh browser is not given a fixed order", () => {
    const orders = new Set<string>();
    for (let index = 0; index < 200; index += 1) {
      const assignment = assignPanels(`seed-${index}`, "case-001", SOURCES);
      orders.add(assignment.panelA);
    }
    expect(orders).toEqual(new Set(SOURCES));
  });

  it("never puts the same source in both panels", () => {
    for (let index = 0; index < 200; index += 1) {
      const assignment = assignPanels(`seed-${index}`, "case-005", SOURCES);
      expect(assignment.panelA).not.toBe(assignment.panelB);
      expect([assignment.panelA, assignment.panelB].sort()).toEqual(
        [...SOURCES].sort(),
      );
    }
  });

  it("hashes deterministically, which is what makes the order checkable", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abd"));
  });
});

describe("the comparison session contract", () => {
  const base = {
    id: "cmp-case-001",
    sampleId: "case-001",
    sessionSeed: SEED,
    panelA: "tagged-transcript-baseline",
    panelB: "illustrative-challenger",
    choice: null,
    reason: null,
    revealed: false,
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
    appVersion: APP_VERSION,
  };

  it("accepts a session that has not been revealed and has no choice yet", () => {
    expect(ComparisonSessionSchema.safeParse(base).success).toBe(true);
  });

  it("refuses a reveal recorded before a choice", () => {
    const parsed = ComparisonSessionSchema.safeParse({
      ...base,
      revealed: true,
      choice: null,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toMatch(/after a choice/i);
    }
  });

  it("refuses a comparison of a method against itself", () => {
    const parsed = ComparisonSessionSchema.safeParse({
      ...base,
      panelB: "tagged-transcript-baseline",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toMatch(/two different methods/i);
    }
  });

  it("keeps the seed on the record, so a stored session can be checked against it", () => {
    const parsed = ComparisonSessionSchema.parse({
      ...base,
      choice: "A",
      revealed: true,
    });
    expect(parsed.sessionSeed).toBe(SEED);
    expect(assignPanels(parsed.sessionSeed, parsed.sampleId, SOURCES).panelA).toBe(
      assignPanels(SEED, "case-001", SOURCES).panelA,
    );
  });
});
