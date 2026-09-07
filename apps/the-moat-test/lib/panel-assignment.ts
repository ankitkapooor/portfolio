import type { PanelSource } from "@/domain/schemas/comparison";

/**
 * Which output goes in panel A (BRD section 8).
 *
 * The assignment is a pure function of a seed that is stored for the session, so
 * reloading the page cannot reorder the labels into a more convenient arrangement.
 * It is deterministic and therefore testable, which is the point: "we shuffled it"
 * is not a claim a reader can check.
 */

/** FNV-1a, 32-bit. Chosen for being short, stable, and easy to reimplement. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export type PanelAssignment = { panelA: PanelSource; panelB: PanelSource };

export function assignPanels(
  sessionSeed: string,
  sampleId: string,
  sources: readonly [PanelSource, PanelSource],
): PanelAssignment {
  const swap = hashString(`${sessionSeed}:${sampleId}`) % 2 === 1;
  return swap
    ? { panelA: sources[1], panelB: sources[0] }
    : { panelA: sources[0], panelB: sources[1] };
}
