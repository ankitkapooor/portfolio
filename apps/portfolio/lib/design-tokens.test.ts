import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reads styles/tokens.css and computes the real WCAG contrast of every pair
 * the site renders, in both the dark and light themes. It also pins the token
 * values, so a "small tweak" to a colour or the type scale is a deliberate,
 * reviewed change rather than drift.
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

type Palette = Record<"paper" | "surface" | "raised" | "ink" | "mutedInk" | "rule" | "accent", string>;

function themePalette(theme: "dark" | "light"): Palette {
  return {
    paper: token(`${theme}-paper`),
    surface: token(`${theme}-surface`),
    raised: token(`${theme}-raised`),
    ink: token(`${theme}-ink`),
    mutedInk: token(`${theme}-muted-ink`),
    rule: token(`${theme}-rule`),
    accent: token(`${theme}-accent`),
  };
}

const themes = { dark: themePalette("dark"), light: themePalette("light") };

describe("palette tokens", () => {
  it("define a neutral dark and light theme with one warm accent", () => {
    expect(themes.dark).toEqual({
      paper: "#0b0b0c",
      surface: "#141416",
      raised: "#1c1c1f",
      ink: "#f2f1ee",
      mutedInk: "#a3a3a8",
      rule: "#27272a",
      accent: "#ff7a45",
    });
    expect(themes.light).toEqual({
      paper: "#fafaf8",
      surface: "#ffffff",
      raised: "#f1f0ec",
      ink: "#111111",
      mutedInk: "#5c5c63",
      rule: "#e4e3df",
      accent: "#c2410c",
    });
  });

  it("maps the active theme to dark by default and swaps every role for light", () => {
    for (const role of ["paper", "surface", "raised", "ink", "muted-ink", "rule", "accent"]) {
      expect(token(role)).toBe(`var(--dark-${role})`);
      expect(css).toMatch(new RegExp(`prefers-color-scheme: light[\\s\\S]*--${role}: var\\(--light-${role}\\)`));
      expect(css).toMatch(new RegExp(`data-theme="light"\\][\\s\\S]*--${role}: var\\(--light-${role}\\)`));
    }
  });
});

for (const [name, palette] of Object.entries(themes)) {
  describe(`${name} theme: text meets 4.5:1`, () => {
    const pairs: [string, string, string][] = [
      ["Ink on paper", palette.ink, palette.paper],
      ["Ink on surface", palette.ink, palette.surface],
      ["Ink on raised", palette.ink, palette.raised],
      ["Muted ink on paper", palette.mutedInk, palette.paper],
      ["Muted ink on surface", palette.mutedInk, palette.surface],
      ["Muted ink on raised", palette.mutedInk, palette.raised],
      ["Accent on paper", palette.accent, palette.paper],
      ["Accent on surface", palette.accent, palette.surface],
      ["Paper text on the ink button", palette.paper, palette.ink],
      ["Paper text on the accent hover state", palette.paper, palette.accent],
    ];

    for (const [label, fg, bg] of pairs) {
      it(label, () => {
        const ratio = contrast(fg, bg);
        expect(ratio, `${label} is ${ratio}:1`).toBeGreaterThanOrEqual(4.5);
      });
    }

    it("the focus ring clears 3:1 against paper and surface", () => {
      expect(contrast(palette.accent, palette.paper)).toBeGreaterThanOrEqual(3);
      expect(contrast(palette.accent, palette.surface)).toBeGreaterThanOrEqual(3);
    });

    it("rule is a quiet divider, so controls use ink for their borders", () => {
      expect(contrast(palette.rule, palette.paper)).toBeLessThan(3);
      expect(contrast(palette.ink, palette.paper)).toBeGreaterThanOrEqual(3);
    });
  });
}

describe("control tokens", () => {
  it("borders and focus use the high-contrast roles", () => {
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
    expect(token("type-hero")).toBe("clamp(56px, 8vw, 128px)");
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

  it("keeps serif, sans, and mono fallback stacks for when the fonts fail", () => {
    expect(token("family-serif")).toContain("serif");
    expect(token("family-serif")).toContain("Georgia");
    expect(token("family-sans")).toContain("sans-serif");
    expect(token("family-display")).toContain("sans-serif");
    expect(token("family-mono")).toContain("monospace");
  });
});
