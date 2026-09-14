import { describe, expect, it } from "vitest";
import { headlineLines, headlineText, heroHeadline } from "@/lib/hero-headline";
import { profile } from "@/content/profile";

/**
 * The hero headline is authored as phrase units with explicit breaks, so the
 * risk is that a break edit silently changes the sentence. These assertions
 * pin both the sentence and the line breaks at each breakpoint.
 */
describe("hero headline", () => {
  it("reads exactly as the positioning statement", () => {
    expect(headlineText()).toBe(profile.positioning);
  });

  it("breaks into three authored lines from 641px up", () => {
    expect(headlineLines("wide")).toEqual([
      "I build decision systems",
      "for ambiguous",
      "strategic questions.",
    ]);
  });

  it("breaks into five authored lines at 640px and below", () => {
    expect(headlineLines("mobile")).toEqual([
      "I build",
      "decision systems",
      "for ambiguous",
      "strategic",
      "questions.",
    ]);
  });

  it("keeps every wide line within the measured column budget", () => {
    // The hero spans 8 of 12 columns (~819px) at 1440px, where the clamped
    // font size is ~94px. The longest phrase is intentionally the opening line.
    for (const line of headlineLines("wide")) {
      expect(line.length, line).toBeLessThanOrEqual(24);
    }
  });

  it("keeps every mobile line within the 360px budget", () => {
    // Long phrases are split explicitly rather than left to emergent wrapping.
    for (const line of headlineLines("mobile")) {
      expect(line.length, line).toBeLessThanOrEqual(16);
    }
  });

  it("ends without a trailing break so no empty line renders", () => {
    expect(heroHeadline.at(-1)?.breakAt).toBeNull();
  });

  it("reconstitutes the same sentence at every breakpoint", () => {
    for (const breakpoint of ["mobile", "wide"] as const) {
      expect(headlineLines(breakpoint).join(" ")).toBe(profile.positioning);
    }
  });
});
