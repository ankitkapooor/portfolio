import { describe, expect, it } from "vitest";
import {
  hasLaunchAction,
  validateContent,
  type Project,
  type ValidationIssue,
} from "@/lib/content-validation";
import { assets } from "@/content/assets";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";

/**
 * Exercises the validator's rules against deliberately broken content. These
 * are the guardrails that stop a future edit from publishing a dead launch
 * button, a dangling citation, or a conclusion nothing supports.
 */

function errorsFor(project: Project): ValidationIssue[] {
  return validateContent({ profile, projects: [project], assets }).filter(
    (issue) => issue.severity === "error",
  );
}

function messages(issues: ValidationIssue[]): string {
  return issues.map((issue) => `${issue.where}: ${issue.message}`).join("\n");
}

/** A known-good project to mutate per test. */
const base = projects[0];

describe("validateContent", () => {
  it("accepts the real site content with no errors", () => {
    const issues = validateContent({ profile, projects, assets });
    expect(messages(issues.filter((i) => i.severity === "error"))).toBe("");
  });

  it("rejects duplicate slugs", () => {
    const issues = validateContent({
      profile,
      projects: [base, { ...projects[1], slug: base.slug }],
      assets,
    });
    expect(messages(issues)).toContain("duplicate slug");
  });

  it("rejects duplicate project numbers", () => {
    const issues = validateContent({
      profile,
      projects: [base, { ...projects[1], number: base.number }],
      assets,
    });
    expect(messages(issues)).toContain("duplicate project number");
  });

  it("rejects evidence citing a source ID that does not exist", () => {
    const issues = errorsFor({
      ...base,
      evidence: [
        { ...base.evidence[0], sourceRefs: ["src-does-not-exist"] },
      ],
    });
    expect(messages(issues)).toContain('cites missing source ID "src-does-not-exist"');
  });

  it("rejects evidence with no citation at all", () => {
    const issues = errorsFor({
      ...base,
      evidence: [{ ...base.evidence[0], sourceRefs: [] }],
    });
    expect(messages(issues)).toContain("must cite at least one source ID");
  });

  it("rejects duplicate source IDs", () => {
    const issues = errorsFor({
      ...base,
      sourceRefs: [base.sourceRefs[0], base.sourceRefs[0]],
    });
    expect(messages(issues)).toContain("duplicate source ID");
  });

  it("rejects a cover asset that is not registered", () => {
    const issues = errorsFor({ ...base, coverAsset: "schematic-nope" });
    expect(messages(issues)).toContain('references unknown asset "schematic-nope"');
  });

  it("rejects a date that is not a real calendar day", () => {
    const issues = errorsFor({
      ...base,
      publishedAt: "2026-02-30",
      updatedAt: "2026-02-30",
    });
    expect(messages(issues)).toContain("is not a real calendar date");
  });

  it("rejects updatedAt earlier than publishedAt", () => {
    const issues = errorsFor({
      ...base,
      publishedAt: "2026-09-07",
      updatedAt: "2026-09-01",
    });
    expect(messages(issues)).toContain("updatedAt is earlier than publishedAt");
  });

  it("rejects a malformed date string outright", () => {
    const issues = errorsFor({ ...base, publishedAt: "7 September 2026" });
    expect(messages(issues)).toContain("ISO calendar date");
  });

  describe("demo actions", () => {
    it("rejects a concept project that carries a demo URL", () => {
      const issues = errorsFor({ ...base, demoUrl: "/play" });
      expect(messages(issues)).toContain('status "concept" must have demoUrl null');
    });

    it("rejects a promoted project with no demo URL", () => {
      const issues = errorsFor({
        ...base,
        status: "prototype",
        recommendation: "Something supported by evidence.",
        brief: { ...base.brief, position: "A supported position." },
      });
      expect(messages(issues)).toContain("promises a runnable demo but demoUrl is null");
    });

    it("accepts a promoted project with a demo URL", () => {
      const issues = errorsFor({
        ...base,
        status: "prototype",
        demoUrl: "/demos/disrupt-this-business",
        demoTarget: "internal",
        recommendation: "Something supported by evidence.",
        brief: { ...base.brief, position: "A supported position." },
        evidenceStatus: "measured-partial",
        evidence: base.evidence.map((item) => ({
          ...item,
          status: "measured-partial" as const,
        })),
      });
      expect(messages(issues)).toBe("");
    });

    it("rejects an internal demo target pointing at an absolute URL", () => {
      const issues = errorsFor({
        ...base,
        status: "prototype",
        demoUrl: "https://example.org/play",
        demoTarget: "internal",
        recommendation: "Something supported by evidence.",
        brief: { ...base.brief, position: "A supported position." },
        evidenceStatus: "measured-partial",
        evidence: base.evidence.map((item) => ({
          ...item,
          status: "measured-partial" as const,
        })),
      });
      expect(messages(issues)).toContain("requires a root-relative path");
    });

    it("rejects an external demo target over plain http", () => {
      const issues = errorsFor({
        ...base,
        status: "prototype",
        demoUrl: "http://insecure.example/play",
        demoTarget: "external",
        recommendation: "Something supported by evidence.",
        brief: { ...base.brief, position: "A supported position." },
        evidenceStatus: "measured-partial",
        evidence: base.evidence.map((item) => ({
          ...item,
          status: "measured-partial" as const,
        })),
      });
      expect(messages(issues)).toContain("requires an absolute https URL");
    });
  });

  describe("honesty guards", () => {
    it("rejects a recommendation on a concept-stage project", () => {
      const issues = errorsFor({
        ...base,
        recommendation: "Reposition immediately.",
      });
      expect(messages(issues)).toContain("recommendation must be null");
    });

    it("requires a concept Position to open with Investigation in progress", () => {
      const issues = errorsFor({
        ...base,
        brief: { ...base.brief, position: "Defend the installed base." },
      });
      expect(messages(issues)).toContain('must open Position with "Investigation in progress"');
    });

    it("rejects evidence claiming a stronger status than the project", () => {
      const issues = errorsFor({
        ...base,
        evidence: [{ ...base.evidence[0], status: "reviewed" }],
      });
      expect(messages(issues)).toContain('but this item claims "reviewed"');
    });
  });

  describe("homepage introduction length", () => {
    it("rejects an introduction under 50 words", () => {
      const issues = errorsFor({ ...base, summary: "Too short." });
      expect(messages(issues)).toContain("BRD section 5 requires 50-80");
    });

    it("rejects an introduction over 80 words", () => {
      const issues = errorsFor({
        ...base,
        summary: Array.from({ length: 90 }, (_, i) => `word${i}`).join(" "),
      });
      expect(messages(issues)).toContain("is 90 words");
    });
  });

  describe("assets", () => {
    it("rejects a schematic asset that also claims a file path", () => {
      const issues = validateContent({
        profile,
        projects,
        assets: [{ ...assets[0], file: "img/thing.png" }, ...assets.slice(1)],
      });
      expect(messages(issues)).toContain("must not set `file`");
    });

    it("rejects a file asset with no path", () => {
      const issues = validateContent({
        profile,
        projects,
        assets: [
          ...assets,
          {
            id: "shot-broken",
            kind: "file",
            label: "Screenshot",
            alt: "alt",
            caption: "caption",
            dataAlternative: ["something"],
            source: "source",
          },
        ],
      });
      expect(messages(issues)).toContain("requires a `file` path");
    });

    it("rejects a profile pointing at an unknown resume asset", () => {
      const issues = validateContent({
        profile: { ...profile, resumeAsset: "resume-does-not-exist" },
        projects,
        assets,
      });
      expect(messages(issues)).toContain('references unknown asset "resume-does-not-exist"');
    });
  });
});

describe("hasLaunchAction", () => {
  it("is false at concept stage, whatever the URL says", () => {
    expect(hasLaunchAction({ status: "concept", demoUrl: null })).toBe(false);
    expect(hasLaunchAction({ status: "concept", demoUrl: "/play" })).toBe(false);
  });

  it("is false without a demo URL, whatever the status says", () => {
    expect(hasLaunchAction({ status: "prototype", demoUrl: null })).toBe(false);
    expect(hasLaunchAction({ status: "published", demoUrl: null })).toBe(false);
  });

  it("is true only when the project has left concept and has a URL", () => {
    expect(hasLaunchAction({ status: "prototype", demoUrl: "/play" })).toBe(true);
    expect(
      hasLaunchAction({ status: "published", demoUrl: "https://demo.example" }),
    ).toBe(true);
  });
});
