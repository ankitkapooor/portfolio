import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { CORPUS } from "@/experiments/corpus";
import { toPublicSample } from "@/domain/schemas/corpus";

/**
 * No secret in client bundles (BRD section 10, requirements M-F07 and the
 * credential rules in section 12).
 *
 * This is the source-level half of that guarantee: nothing that could carry a
 * credential or a gold annotation is reachable from a client component, and no
 * credential-shaped literal exists in the tree at all. The built bundles that the
 * browser actually downloads are scanned in `e2e/bundle-safety.spec.ts`.
 */

const PROJECT_ROOT = join(import.meta.dirname, "..");

const SOURCE_DIRS = [
  "app",
  "ui",
  "lib",
  "domain",
  "content",
  "server",
  "experiments",
  "scripts",
];

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", ".tmp", "runs"]);

function sourceFiles(): string[] {
  const found: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      if (SKIP_DIRS.has(entry)) continue;
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
        found.push(path);
      }
    }
  };
  for (const directory of SOURCE_DIRS) walk(join(PROJECT_ROOT, directory));
  return found;
}

const FILES = sourceFiles().map((path) => ({
  path: relative(PROJECT_ROOT, path).split(sep).join("/"),
  text: readFileSync(path, "utf8"),
}));

const CLIENT_FILES = FILES.filter((file) =>
  /^\s*["']use client["']/m.test(file.text),
);

describe("the source tree carries no credential", () => {
  it("found the client components it is supposed to be checking", () => {
    expect(FILES.length).toBeGreaterThan(20);
    expect(CLIENT_FILES.length).toBeGreaterThan(0);
  });

  it("contains no credential-shaped literal anywhere", () => {
    const patterns: [string, RegExp][] = [
      ["OpenAI-style key", /\bsk-[A-Za-z0-9_-]{16,}/],
      ["Anthropic-style key", /\bsk-ant-[A-Za-z0-9_-]{16,}/],
      ["AWS access key id", /\bAKIA[0-9A-Z]{16}\b/],
      ["Google API key", /\bAIza[0-9A-Za-z_-]{20,}/],
      ["bearer token literal", /["']Bearer\s+[A-Za-z0-9._-]{12,}["']/],
      ["assigned api key", /\b(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"'\s]{12,}["']/i],
    ];
    const offenders: string[] = [];
    for (const file of FILES) {
      for (const [label, pattern] of patterns) {
        if (pattern.test(file.text)) offenders.push(`${file.path}: ${label}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("reads no environment variable at all, so none can be inlined into a bundle", () => {
    const offenders = FILES.filter((file) => /process\.env/.test(file.text)).map(
      (file) => file.path,
    );
    expect(offenders).toEqual([]);
  });

  it("declares no NEXT_PUBLIC_ variable, which is the only way a value reaches the client", () => {
    const offenders = FILES.filter((file) => /NEXT_PUBLIC_/.test(file.text)).map(
      (file) => file.path,
    );
    expect(offenders).toEqual([]);
  });
});

describe("client components cannot reach anything server-side", () => {
  it("never import the provider seam, where a credential would live", () => {
    const offenders = CLIENT_FILES.filter((file) =>
      /@\/server\//.test(file.text),
    ).map((file) => file.path);
    expect(offenders).toEqual([]);
  });

  it("never import the corpus, which carries the gold annotations", () => {
    const offenders = CLIENT_FILES.filter((file) =>
      /@\/experiments\/corpus/.test(file.text),
    ).map((file) => file.path);
    expect(offenders).toEqual([]);
  });

  it("never name a gold annotation field", () => {
    const offenders = CLIENT_FILES.filter((file) =>
      /\bgoldActions\b|\bgoldDecisions\b|\bannotationRationale\b|\bacceptableAlternatives\b/.test(
        file.text,
      ),
    ).map((file) => file.path);
    expect(offenders).toEqual([]);
  });
});

describe("the public projection of a case", () => {
  it("drops every gold field before a sample can cross into the browser", () => {
    for (const transcriptCase of CORPUS) {
      const sample = toPublicSample(transcriptCase) as Record<string, unknown>;
      expect(sample).not.toHaveProperty("goldActions");
      expect(sample).not.toHaveProperty("goldDecisions");
      expect(sample).not.toHaveProperty("acceptableAlternatives");
      expect(sample).not.toHaveProperty("annotationRationale");
      expect(sample).not.toHaveProperty("humanReviewed");
      expect(sample).not.toHaveProperty("reviewerId");
    }
  });

  it("carries no gold text in its serialised form", () => {
    const withGold = CORPUS.find((item) => item.goldActions.length > 0);
    if (!withGold) throw new Error("expected at least one case with gold actions");
    const serialised = JSON.stringify(toPublicSample(withGold));
    expect(serialised).not.toContain(withGold.goldActions[0].id);
    expect(serialised).not.toContain(withGold.annotationRationale);
  });
});
