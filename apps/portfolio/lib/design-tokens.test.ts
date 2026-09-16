import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The BRD warns that its palette is proposed and not validated, so this suite
 * reads styles/tokens.css and computes the real contrast of every pair the
 * site actually renders. It also pins the token values themselves, so a
 * "small tweak" to a colour or the type scale cannot drift away from the spec
 * without a failing test.
 */

const css = readFileSync(
  join(process.cwd(), "styles", "tokens.css"),
  "utf8",
);

function token(name: string): string {
  const match = css.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, "m"));
  if (!match) throw new Error(`Token --${name} not found in styles/tokens.css`);
  return match[1].trim();
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928
    ? srgb / 12.92
    : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) =>
    channel(parseInt(clean.slice(i, i + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, rounded to two decimals for readable failures. */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].toSorted((x, y) => y - x);
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

const palette = {
  paper: token("paper"),
  surface: token("surface"),
  ink: token("ink"),
  mutedInk: token("muted-ink"),
  rule: token("rule"),
  accent: token("accent"),
  project01: token("project-accent-01"),
  project02: token("project-accent-02"),
  project03: token("project-accent-03"),
  project04: token("project-accent-04"),
  project05: token("project-accent-05"),
};

describe("palette tokens match the specification", () => {
  it("uses the requested navy, blue, sky, and cream palette", () => {
    expect(palette).toEqual({
      paper: "#021526",
      surface: "#03346e",
      ink: "#e2e2b6",
      mutedInk: "#a9bfd0",
      rule: "#25445d",
      accent: "#6eacda",
      project01: "#6eacda",
      project02: "#e2e2b6",
      project03: "#6eacda",
      project04: "#e2e2b6",
      project05: "#6eacda",
    });
  });
});

describe("body and secondary text meet 4.5:1", () => {
  const pairs: [string, string, string][] = [
    ["Ink on paper", palette.ink, palette.paper],
    ["Ink on surface", palette.ink, palette.surface],
    ["Muted ink on paper", palette.mutedInk, palette.paper],
    ["Muted ink on surface", palette.mutedInk, palette.surface],
    ["Accent link on paper", palette.accent, palette.paper],
    ["Accent link on surface", palette.accent, palette.surface],
    ["Project accent 01 on paper", palette.project01, palette.paper],
    ["Project accent 02 on paper", palette.project02, palette.paper],
    ["Project accent 03 on paper", palette.project03, palette.paper],
    ["Project accent 04 on paper", palette.project04, palette.paper],
    ["Project accent 05 on paper", palette.project05, palette.paper],
    ["Project accent 01 on surface", palette.project01, palette.surface],
    ["Project accent 02 on surface", palette.project02, palette.surface],
    ["Project accent 03 on surface", palette.project03, palette.surface],
    ["Project accent 04 on surface", palette.project04, palette.surface],
    ["Project accent 05 on surface", palette.project05, palette.surface],
  ];

  for (const [label, fg, bg] of pairs) {
    it(`${label}`, () => {
      const ratio = contrast(fg, bg);
      expect(ratio, `${label} is ${ratio}:1`).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("button surfaces meet 4.5:1", () => {
  it("paper text on the ink button", () => {
    expect(contrast(palette.paper, palette.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("paper text on the accent hover state", () => {
    expect(contrast(palette.paper, palette.accent)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("non-text contrast", () => {
  it("the focus ring clears the 3:1 minimum against paper and surface", () => {
    expect(contrast(palette.accent, palette.paper)).toBeGreaterThanOrEqual(3);
    expect(contrast(palette.accent, palette.surface)).toBeGreaterThanOrEqual(3);
  });

  it("control borders use ink, because rule alone does not clear 3:1", () => {
    // Documents the reason --border-control exists: the rule colour is a
    // structural divider, not a perceivable control boundary.
    expect(contrast(palette.rule, palette.paper)).toBeLessThan(3);
    expect(contrast(palette.ink, palette.paper)).toBeGreaterThanOrEqual(3);
    expect(token("border-control")).toBe("var(--ink)");
    expect(token("focus-ring")).toBe("var(--accent)");
  });
});

describe("layout and type tokens match the specification", () => {
  it("pins the grid and measure", () => {
    expect(token("content-max")).toBe("1240px");
    expect(token("grid-columns")).toBe("12");
    expect(token("gutter")).toBe("24px");
    expect(token("article-max")).toBe("720px");
    expect(token("rail-width")).toBe("200px");
    expect(token("rail-gap")).toBe("48px");
  });

  it("pins the hero clamp", () => {
    expect(token("type-hero")).toBe("clamp(48px, 6.5vw, 96px)");
  });

  it("keeps the header at 64px mobile and 80px desktop", () => {
    expect(token("header-height")).toBe("64px");
    expect(css).toMatch(/min-width: 1024px[\s\S]*--header-height: 80px/);
  });

  it("uses the 4-to-128 spacing scale and nothing else", () => {
    const scale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => token(`space-${i}`));
    expect(scale).toEqual([
      "4px",
      "8px",
      "12px",
      "16px",
      "24px",
      "32px",
      "48px",
      "64px",
      "96px",
      "128px",
    ]);
  });

  it("keeps interactive targets at least 44px and radii at most 8px", () => {
    expect(Number.parseInt(token("control-height"), 10)).toBeGreaterThanOrEqual(44);
    expect(Number.parseInt(token("radius"), 10)).toBeLessThanOrEqual(8);
    expect(Number.parseInt(token("radius-figure"), 10)).toBeLessThanOrEqual(8);
    expect(token("border-width")).toBe("1px");
  });

  it("keeps motion inside the 140-220ms band", () => {
    for (const name of ["motion-fast", "motion", "motion-slow"]) {
      const ms = Number.parseInt(token(name), 10);
      expect(ms, name).toBeGreaterThanOrEqual(140);
      expect(ms, name).toBeLessThanOrEqual(220);
    }
  });

  it("disables non-essential motion under prefers-reduced-motion", () => {
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\)[\s\S]*--motion-fast: 0ms/,
    );
  });

  it("keeps a serif and sans fallback stack for when the fonts fail", () => {
    expect(token("family-serif")).toContain("serif");
    expect(token("family-serif")).toContain("Georgia");
    expect(token("family-sans")).toContain("sans-serif");
  });
});
