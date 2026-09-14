/**
 * The hero headline, split into phrase units with an explicit break after
 * each one.
 *
 * The BRD asks for line breaks chosen per breakpoint rather than one heading
 * shrinking to fit, so the breaks are authored, not emergent:
 *
 *   Desktop (>=641px), 3 lines   Mobile (<=640px), 5 lines
 *   I build decision systems     I build
 *   for ambiguous                decision systems
 *   strategic questions.         for ambiguous
 *                                strategic
 *                                questions.
 *
 * `breakAt` says which breakpoints render a break after that unit. Joining the
 * units with single spaces must reproduce profile.positioning exactly;
 * lib/hero-headline.test.ts asserts that.
 */

export type HeadlineBreakpoint = "mobile" | "wide" | "both";

export type HeadlineUnit = {
  text: string;
  breakAt: HeadlineBreakpoint | null;
};

export const heroHeadline: readonly HeadlineUnit[] = [
  { text: "I build", breakAt: "mobile" },
  { text: "decision systems", breakAt: "both" },
  { text: "for ambiguous", breakAt: "both" },
  { text: "strategic", breakAt: "mobile" },
  { text: "questions.", breakAt: null },
];

export function headlineText(
  units: readonly HeadlineUnit[] = heroHeadline,
): string {
  return units.map((unit) => unit.text).join(" ");
}

/** Lines as they render at a given breakpoint, for inspection and tests. */
export function headlineLines(
  breakpoint: "mobile" | "wide",
  units: readonly HeadlineUnit[] = heroHeadline,
): string[] {
  const lines: string[] = [];
  let current: string[] = [];

  for (const unit of units) {
    current.push(unit.text);
    if (unit.breakAt === "both" || unit.breakAt === breakpoint) {
      lines.push(current.join(" "));
      current = [];
    }
  }
  if (current.length > 0) lines.push(current.join(" "));

  return lines;
}
