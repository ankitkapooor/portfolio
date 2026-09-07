import { describe, expect, it } from "vitest";
import { assets } from "@/content/assets";
import { contactPlaceholder, profile } from "@/content/profile";
import { projects, getProject, projectPath } from "@/content/projects";
import { approachSteps } from "@/content/approach";
import {
  hasLaunchAction,
  statusDescriptions,
  statusLabels,
} from "@/lib/content-validation";
import { schematicIds } from "@/components/schematics/ids";

/**
 * Assertions about the actual published content: statuses, links, and the
 * honesty constraints. If someone edits content in a way that overstates the
 * work, these should fail before a build ships.
 */

const REQUIRED_SLUGS = [
  "disrupt-this-business",
  "the-moat-test",
  "priced-in",
] as const;

/** Every string a visitor can read, flattened for text-level scans. */
function allContentStrings(): string[] {
  const out: string[] = [];

  const walk = (value: unknown) => {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };

  walk(projects);
  walk(profile);
  walk(assets);
  walk(approachSteps);
  walk(contactPlaceholder);
  return out;
}

describe("project registry", () => {
  it("contains exactly the three required cases, in numbered order", () => {
    expect(projects.map((project) => project.slug)).toEqual([...REQUIRED_SLUGS]);
    expect(projects.map((project) => project.number)).toEqual(["01", "02", "03"]);
  });

  it("resolves each required route", () => {
    for (const slug of REQUIRED_SLUGS) {
      expect(getProject(slug), slug).toBeDefined();
      expect(projectPath({ slug })).toBe(`/work/${slug}`);
    }
  });

  it("does not resolve an unknown slug", () => {
    expect(getProject("projects")).toBeUndefined();
    expect(getProject("disrupt")).toBeUndefined();
  });

  it("gives every project a distinct question, capability and accent", () => {
    const questions = new Set(projects.map((p) => p.question));
    const capabilities = new Set(projects.map((p) => p.capability));
    const accents = new Set(projects.map((p) => p.accentVar));
    expect(questions.size).toBe(projects.length);
    expect(capabilities.size).toBe(projects.length);
    expect(accents.size).toBe(projects.length);
  });
});

describe("project status", () => {
  it("ships all three projects at prototype stage, because the software runs", () => {
    for (const project of projects) {
      expect(project.status, project.slug).toBe("prototype");
    }
  });

  it("claims measured evidence only for The Moat Test, and never claims review", () => {
    const byStatus = Object.fromEntries(
      projects.map((project) => [project.slug, project.evidenceStatus]),
    );
    expect(byStatus).toEqual({
      "disrupt-this-business": "illustrative",
      "the-moat-test": "measured-partial",
      "priced-in": "illustrative",
    });
  });

  it("backs a measured-partial claim with at least one measured evidence item", () => {
    for (const project of projects) {
      if (project.evidenceStatus !== "measured-partial") continue;
      const measured = project.evidence.filter(
        (item) => item.status === "measured-partial",
      );
      expect(measured.length, project.slug).toBeGreaterThan(0);
      // A measured claim has to be traceable to the run that produced it.
      for (const item of measured) {
        expect(item.sourceRefs.length, item.id).toBeGreaterThan(0);
      }
    }
  });

  it("renders a launch action for every project, because each demo is deployed", () => {
    for (const project of projects) {
      // An absolute https URL, not a root-relative path: each demo is a
      // separate application on its own subdomain.
      expect(project.demoUrl, project.slug).toMatch(/^https:\/\//);
      expect(project.demoTarget, project.slug).toBe("external");
      expect(hasLaunchAction(project), project.slug).toBe(true);
    }
  });

  it("keeps a demo label ready so promotion needs no component change", () => {
    for (const project of projects) {
      expect(project.demoLabel.length, project.slug).toBeGreaterThan(0);
    }
  });

  it("publishes no recommendation and no invented conclusion", () => {
    for (const project of projects) {
      expect(project.recommendation, project.slug).toBeNull();
      expect(project.brief.position, project.slug).toMatch(
        /^Investigation in progress/,
      );
    }
  });

  it("labels status honestly in the UI vocabulary", () => {
    expect(statusLabels.concept).toBe("Concept");
    expect(statusLabels.prototype).toBe("Prototype");
  });

  it("keeps hosting out of the status description, so it survives deployment", () => {
    for (const description of Object.values(statusDescriptions)) {
      expect(description.toLowerCase()).not.toContain("hosted");
      expect(description.toLowerCase()).not.toContain("deployed");
    }
  });
});

describe("homepage introductions", () => {
  it("are all between 50 and 80 words", () => {
    for (const project of projects) {
      const words = project.summary.trim().split(/\s+/).length;
      expect(words, `${project.slug} (${words} words)`).toBeGreaterThanOrEqual(50);
      expect(words, `${project.slug} (${words} words)`).toBeLessThanOrEqual(80);
    }
  });

  it("keep the starter copy's opening sentence rather than strengthening it", () => {
    expect(projects[0].summary).toContain(
      "A competitive strategy game about defending an established business or building the challenger.",
    );
    expect(projects[1].summary).toContain(
      "An investigation into what makes an AI product worth paying for.",
    );
    expect(projects[2].summary).toContain(
      "A financial workbench for exploring the business performance required to justify a valuation.",
    );
  });
});

describe("case structure", () => {
  it("gives every case all five brief fields and all long-form sections", () => {
    for (const project of projects) {
      for (const key of [
        "decision",
        "position",
        "evidence",
        "tradeoff",
        "uncertainty",
      ] as const) {
        expect(project.brief[key].length, `${project.slug}.${key}`).toBeGreaterThan(
          20,
        );
      }
      for (const key of [
        "context",
        "methodAndModel",
        "evidenceAndResults",
        "interpretation",
        "limitations",
        "nextTest",
      ] as const) {
        expect(
          project.sections[key].length,
          `${project.slug}.${key}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("gives every case a visible authorship block", () => {
    for (const project of projects) {
      expect(project.ownerContribution.length).toBeGreaterThan(20);
      expect(project.implementationDisclosure.toLowerCase()).toContain("ai");
      expect(project.humanReviewStatus.toLowerCase()).toContain("review");
    }
  });

  it("cites at least one source per case and resolves every citation", () => {
    for (const project of projects) {
      expect(project.sourceRefs.length, project.slug).toBeGreaterThan(0);
      const ids = new Set(project.sourceRefs.map((ref) => ref.id));
      for (const item of project.evidence) {
        for (const ref of item.sourceRefs) {
          expect(ids.has(ref), `${project.slug} -> ${ref}`).toBe(true);
        }
      }
    }
  });
});

describe("assets", () => {
  it("gives each project its own preview, not a shared placeholder", () => {
    const covers = projects.map((project) => project.coverAsset);
    expect(new Set(covers).size).toBe(projects.length);
  });

  it("registers a schematic component for every schematic asset", () => {
    for (const asset of assets) {
      if (asset.kind === "svg-schematic") {
        expect(schematicIds as readonly string[]).toContain(asset.id);
      }
    }
    expect(schematicIds.length).toBe(assets.length);
  });

  it("labels every preview as a concept preview while none is a real screenshot", () => {
    for (const asset of assets) {
      expect(asset.label, asset.id).toBe("Concept preview");
      expect(asset.caption, asset.id).toContain("Concept preview");
    }
  });

  it("gives every asset distinct alt text and a data alternative", () => {
    const alts = new Set(assets.map((asset) => asset.alt));
    expect(alts.size).toBe(assets.length);
    for (const asset of assets) {
      expect(asset.alt.length, asset.id).toBeGreaterThan(80);
      expect(asset.dataAlternative.length, asset.id).toBeGreaterThan(2);
      expect(asset.source, asset.id).toMatch(/Original SVG/);
    }
  });
});

describe("profile honesty constraints", () => {
  it("records only confirmed facts", () => {
    expect(profile.name).toBe("Ankit Kapoor");
    expect(profile.education.map((entry) => entry.institution)).toEqual([
      "USC Marshall",
      "BITS Pilani Dubai",
    ]);
  });

  it("has no invented contact details, resume, portrait or location", () => {
    expect(profile.verifiedLinks).toEqual([]);
    expect(profile.resumeAsset).toBeNull();
    expect(profile.portraitAsset).toBeNull();
    expect(profile.locationOptional).toBeNull();
  });

  it("offers the neutral contact copy while no link is verified", () => {
    expect(contactPlaceholder).toBe(
      "Contact details will be added before launch.",
    );
  });
});

describe("text-level honesty scan", () => {
  const strings = allContentStrings();

  it("contains no email address, phone number, or social handle", () => {
    for (const text of strings) {
      expect(text, text.slice(0, 60)).not.toMatch(
        /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
      );
      expect(text, text.slice(0, 60)).not.toMatch(
        /linkedin\.com|github\.com|twitter\.com|x\.com\//i,
      );
      expect(text, text.slice(0, 60)).not.toMatch(/\+\d[\d\s()-]{7,}/);
    }
  });

  it("never claims an AI strategist title or named clients", () => {
    for (const text of strings) {
      expect(text.toLowerCase()).not.toContain("ai strategist");
      expect(text.toLowerCase()).not.toContain("clients include");
      expect(text.toLowerCase()).not.toContain("advised");
    }
  });

  it("never claims the site is deployed or hosted", () => {
    for (const text of strings) {
      expect(text.toLowerCase()).not.toContain("now live");
      expect(text.toLowerCase()).not.toContain("deployed at");
    }
  });

  it("never publishes a placeholder domain as a real destination", () => {
    for (const text of strings) {
      expect(text).not.toMatch(/https?:\/\/(www\.)?example\.(com|org|net)/);
    }
  });

  it("does not present projected outcomes as achieved results", () => {
    for (const text of strings) {
      // Percentages and dollar amounts would be measured claims; there are none.
      expect(text, text.slice(0, 60)).not.toMatch(/\b\d+(\.\d+)?%/);
      expect(text, text.slice(0, 60)).not.toMatch(/\$\s?\d/);
    }
  });
});

describe("approach", () => {
  it("has exactly three steps, each with one concrete sentence", () => {
    expect(approachSteps).toHaveLength(3);
    for (const step of approachSteps) {
      expect(step.body.trim().endsWith(".")).toBe(true);
      expect(step.body.split(". ").length).toBe(1);
      expect(step.detail.length).toBeGreaterThan(0);
    }
  });
});
