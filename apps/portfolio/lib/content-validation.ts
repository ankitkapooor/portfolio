/**
 * Content schemas and integrity checks.
 *
 * Two layers:
 *  1. zod schemas — shape and enum correctness. Content modules parse
 *     themselves at import time, so a malformed record breaks the build.
 *  2. `validateContent` — cross-record rules that a single-record schema
 *     cannot express: duplicate slugs, dangling source IDs, missing assets,
 *     malformed demo URLs, dates that do not make sense, and honesty
 *     guards on concept-stage projects.
 *
 * `npm run validate:content` runs both plus a filesystem check for
 * file-backed assets.
 */

import { z } from "zod";

/* ---------------------------------------------------------------------- */
/* Schemas                                                                */
/* ---------------------------------------------------------------------- */

const nonEmpty = z.string().min(1);

const isoDate = nonEmpty.regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "date must be an ISO calendar date (YYYY-MM-DD)",
);

const httpsUrl = nonEmpty.refine(
  (value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "must be an absolute https URL" },
);

/** Internal (same-tab) or external (new tab) demo. */
export const demoTargetSchema = z.enum(["internal", "external"]);

export const projectStatusSchema = z.enum([
  "concept",
  "prototype",
  "published",
]);

export const evidenceStatusSchema = z.enum([
  "illustrative",
  "measured-partial",
  "reviewed",
]);

export const assetSchema = z.object({
  id: nonEmpty,
  /** `svg-schematic` is drawn in code; `file` lives under public/. */
  kind: z.enum(["svg-schematic", "file"]),
  label: nonEmpty,
  /** Meaningful alt text. Required for every asset. */
  alt: nonEmpty,
  caption: nonEmpty,
  /**
   * Non-visual alternative for the figure's content, rendered on the page in
   * a disclosure so the information does not depend on reading the drawing.
   */
  dataAlternative: z.array(nonEmpty).min(1),
  /** Provenance record, per BRD section 11. */
  source: nonEmpty,
  /** Path relative to public/, for kind === "file". */
  file: nonEmpty.optional(),
});

export const verifiedLinkSchema = z.object({
  label: nonEmpty,
  href: httpsUrl,
});

export const profileSchema = z.object({
  name: nonEmpty,
  positioning: nonEmpty,
  shortBio: nonEmpty,
  longBio: z.array(nonEmpty).min(1),
  education: z
    .array(
      z.object({
        institution: nonEmpty,
        credential: nonEmpty,
      }),
    )
    .min(1),
  /** Empty until the owner supplies verified destinations. */
  verifiedLinks: z.array(verifiedLinkSchema),
  /** Asset ID, or null while no real file exists. */
  resumeAsset: nonEmpty.nullable(),
  portraitAsset: nonEmpty.nullable(),
  locationOptional: nonEmpty.nullable(),
});

export const sourceRefSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  detail: nonEmpty,
});

export const evidenceSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  detail: nonEmpty,
  /** Per-item honesty label; must be consistent with the project's. */
  status: evidenceStatusSchema,
  /** IDs that must resolve against the project's sourceRefs. */
  sourceRefs: z.array(nonEmpty),
});

export const projectSchema = z.object({
  slug: nonEmpty.regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  /** Display number, e.g. "01". Also the ordering key. */
  number: nonEmpty.regex(/^\d{2}$/, "number must be two digits"),
  title: nonEmpty,
  question: nonEmpty,
  capability: nonEmpty,
  /** One sentence. Rendered directly under the case title. */
  purpose: nonEmpty,
  status: projectStatusSchema,
  evidenceStatus: evidenceStatusSchema,
  /** Homepage feature introduction. BRD requires 50-80 words. */
  summary: nonEmpty,
  /**
   * The authored conclusion. Must be null until evidence supports one; the
   * 30-second brief then reads "Investigation in progress".
   */
  recommendation: nonEmpty.nullable(),
  brief: z.object({
    decision: nonEmpty,
    position: nonEmpty,
    evidence: nonEmpty,
    tradeoff: nonEmpty,
    uncertainty: nonEmpty,
  }),
  alternatives: z
    .array(
      z.object({
        option: nonEmpty,
        argument: nonEmpty,
        objection: nonEmpty,
      }),
    )
    .min(1),
  evidence: z.array(evidenceSchema),
  tradeoffs: z.array(z.object({ label: nonEmpty, detail: nonEmpty })).min(1),
  uncertainties: z.array(z.object({ label: nonEmpty, detail: nonEmpty })).min(1),
  /** Long-form body. Each value is an array of paragraphs. */
  sections: z.object({
    context: z.array(nonEmpty).min(1),
    methodAndModel: z.array(nonEmpty).min(1),
    evidenceAndResults: z.array(nonEmpty).min(1),
    interpretation: z.array(nonEmpty).min(1),
    limitations: z.array(nonEmpty).min(1),
    nextTest: z.array(nonEmpty).min(1),
  }),
  /** Visible authorship block. */
  ownerContribution: nonEmpty,
  implementationDisclosure: nonEmpty,
  humanReviewStatus: nonEmpty,
  /** Launch destination. Null means no launch action is rendered. */
  demoUrl: nonEmpty.nullable(),
  demoTarget: demoTargetSchema,
  /** Label for the launch action, e.g. "Play the scenario". */
  demoLabel: nonEmpty,
  repositoryUrl: httpsUrl.nullable(),
  /** Asset ID for the evidence preview. */
  coverAsset: nonEmpty,
  sourceRefs: z.array(sourceRefSchema),
  publishedAt: isoDate,
  updatedAt: isoDate,
  /** CSS custom property name carrying this project's accent. */
  accentVar: nonEmpty.regex(/^--project-accent-\d{2}$/),
});

export type Asset = z.infer<typeof assetSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type EvidenceStatus = z.infer<typeof evidenceStatusSchema>;

/* ---------------------------------------------------------------------- */
/* Presentation rules derived from content                                */
/* ---------------------------------------------------------------------- */

export const statusLabels: Record<ProjectStatus, string> = {
  concept: "Concept",
  prototype: "Prototype",
  published: "Published",
};

export const statusDescriptions: Record<ProjectStatus, string> = {
  concept:
    "Designed and specified. No runnable demo and no measured results yet.",
  // Deliberately silent on hosting and on results. Whether the public can
  // reach the demo is `demoUrl`; what the demo has produced is
  // `evidenceStatus`. Both stay true whether or not the demo is deployed.
  prototype: "A working demo runs. Results are reported by the evidence label.",
  published: "An authored case with reviewed evidence.",
};

export const evidenceStatusLabels: Record<EvidenceStatus, string> = {
  illustrative: "Illustrative",
  "measured-partial": "Measured, partial",
  reviewed: "Reviewed",
};

/**
 * The single decision point for launch actions.
 *
 * Absence is the default: a launch action exists only when the project has
 * left concept stage AND a demo URL is recorded. Promoting a project is a
 * content edit (set `status` and `demoUrl`); no component changes.
 */
export function hasLaunchAction(
  project: Pick<Project, "status" | "demoUrl">,
): boolean {
  return project.status !== "concept" && project.demoUrl !== null;
}

/* ---------------------------------------------------------------------- */
/* Cross-record validation                                                */
/* ---------------------------------------------------------------------- */

export type ValidationIssue = {
  severity: "error" | "warning";
  where: string;
  message: string;
};

export type ContentBundle = {
  profile: unknown;
  projects: unknown;
  assets: unknown;
};

function isRealDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validates a whole content bundle. Returns every issue found rather than
 * throwing on the first, so one run reports all the work to do.
 */
export function validateContent(bundle: ContentBundle): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const assetsResult = z.array(assetSchema).safeParse(bundle.assets);
  const profileResult = profileSchema.safeParse(bundle.profile);
  const projectsResult = z.array(projectSchema).safeParse(bundle.projects);

  for (const [where, result] of [
    ["content/assets.ts", assetsResult],
    ["content/profile.ts", profileResult],
    ["content/projects.ts", projectsResult],
  ] as const) {
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push({
          severity: "error",
          where: `${where}${issue.path.length ? ` (${issue.path.join(".")})` : ""}`,
          message: issue.message,
        });
      }
    }
  }

  if (!assetsResult.success || !profileResult.success || !projectsResult.success) {
    // Cross-record checks below assume well-shaped data.
    return issues;
  }

  const assets = assetsResult.data;
  const profile = profileResult.data;
  const projects = projectsResult.data;

  /* -- Assets ---------------------------------------------------------- */

  const assetIds = new Set<string>();
  for (const asset of assets) {
    if (assetIds.has(asset.id)) {
      issues.push({
        severity: "error",
        where: `asset "${asset.id}"`,
        message: "duplicate asset ID",
      });
    }
    assetIds.add(asset.id);

    if (asset.kind === "file" && !asset.file) {
      issues.push({
        severity: "error",
        where: `asset "${asset.id}"`,
        message: 'kind "file" requires a `file` path',
      });
    }
    if (asset.kind === "svg-schematic" && asset.file) {
      issues.push({
        severity: "error",
        where: `asset "${asset.id}"`,
        message: 'kind "svg-schematic" is drawn in code and must not set `file`',
      });
    }
  }

  /* -- Profile --------------------------------------------------------- */

  for (const [field, value] of [
    ["resumeAsset", profile.resumeAsset],
    ["portraitAsset", profile.portraitAsset],
  ] as const) {
    if (value !== null && !assetIds.has(value)) {
      issues.push({
        severity: "error",
        where: `profile.${field}`,
        message: `references unknown asset "${value}"`,
      });
    }
  }

  if (profile.verifiedLinks.length === 0) {
    issues.push({
      severity: "warning",
      where: "profile.verifiedLinks",
      message:
        "no verified links configured; the contact section will say details are pending. Required before launch.",
    });
  }

  /* -- Projects -------------------------------------------------------- */

  const slugs = new Set<string>();
  const numbers = new Set<string>();

  for (const project of projects) {
    const where = `project "${project.slug}"`;

    if (slugs.has(project.slug)) {
      issues.push({ severity: "error", where, message: "duplicate slug" });
    }
    slugs.add(project.slug);

    if (numbers.has(project.number)) {
      issues.push({
        severity: "error",
        where,
        message: `duplicate project number "${project.number}"`,
      });
    }
    numbers.add(project.number);

    // Dates
    for (const [field, value] of [
      ["publishedAt", project.publishedAt],
      ["updatedAt", project.updatedAt],
    ] as const) {
      if (!isRealDate(value)) {
        issues.push({
          severity: "error",
          where: `${where}.${field}`,
          message: `"${value}" is not a real calendar date`,
        });
      }
    }
    if (project.updatedAt < project.publishedAt) {
      issues.push({
        severity: "error",
        where,
        message: "updatedAt is earlier than publishedAt",
      });
    }

    // Assets
    if (!assetIds.has(project.coverAsset)) {
      issues.push({
        severity: "error",
        where: `${where}.coverAsset`,
        message: `references unknown asset "${project.coverAsset}"`,
      });
    }

    // Source references
    const sourceIds = new Set<string>();
    for (const ref of project.sourceRefs) {
      if (sourceIds.has(ref.id)) {
        issues.push({
          severity: "error",
          where: `${where}.sourceRefs`,
          message: `duplicate source ID "${ref.id}"`,
        });
      }
      sourceIds.add(ref.id);
    }
    for (const item of project.evidence) {
      if (item.sourceRefs.length === 0) {
        issues.push({
          severity: "error",
          where: `${where}.evidence "${item.id}"`,
          message: "evidence must cite at least one source ID",
        });
      }
      for (const id of item.sourceRefs) {
        if (!sourceIds.has(id)) {
          issues.push({
            severity: "error",
            where: `${where}.evidence "${item.id}"`,
            message: `cites missing source ID "${id}"`,
          });
        }
      }
      if (
        project.evidenceStatus === "illustrative" &&
        item.status !== "illustrative"
      ) {
        issues.push({
          severity: "error",
          where: `${where}.evidence "${item.id}"`,
          message: `project evidenceStatus is "illustrative" but this item claims "${item.status}"`,
        });
      }
    }

    // Demo actions
    //
    // `status` and `demoUrl` are separate facts and only one direction is
    // constrained. `status` says how mature the software is; `demoUrl` says
    // whether the public can reach it — the same separation the BRD keeps
    // between `status` and `evidenceStatus`. A demo can genuinely run and
    // still not be hosted, so a non-concept status does not require a URL.
    // The reverse is still unsound: a concept has nothing to link to.
    if (project.status === "concept" && project.demoUrl !== null) {
      issues.push({
        severity: "error",
        where,
        message:
          'status "concept" must have demoUrl null; a runnable demo means the status is at least "prototype"',
      });
    }
    if (project.demoUrl !== null) {
      const isInternal = project.demoUrl.startsWith("/");
      if (project.demoTarget === "internal" && !isInternal) {
        issues.push({
          severity: "error",
          where: `${where}.demoUrl`,
          message: 'demoTarget "internal" requires a root-relative path',
        });
      }
      if (project.demoTarget === "external") {
        try {
          if (new URL(project.demoUrl).protocol !== "https:") {
            throw new Error("not https");
          }
        } catch {
          issues.push({
            severity: "error",
            where: `${where}.demoUrl`,
            message: 'demoTarget "external" requires an absolute https URL',
          });
        }
      }
    }

    // Honesty guards
    if (project.status === "concept") {
      if (project.recommendation !== null) {
        issues.push({
          severity: "error",
          where: `${where}.recommendation`,
          message:
            'a concept-stage project has no supported conclusion; recommendation must be null',
        });
      }
      if (!/^Investigation in progress/.test(project.brief.position)) {
        issues.push({
          severity: "error",
          where: `${where}.brief.position`,
          message:
            'a concept-stage project must open Position with "Investigation in progress"',
        });
      }
    }
    // A conclusion follows evidence, not software maturity. Keying this off
    // `status` would ask for a recommendation as soon as the code runs, which
    // is the confusion the rest of this file exists to prevent. Only reviewed
    // evidence is enough to support an authored recommendation.
    if (project.evidenceStatus === "reviewed" && project.recommendation === null) {
      issues.push({
        severity: "warning",
        where: `${where}.recommendation`,
        message:
          "project has reviewed evidence but still has no authored recommendation",
      });
    }

    // Homepage introduction length
    const words = countWords(project.summary);
    if (words < 50 || words > 80) {
      issues.push({
        severity: "error",
        where: `${where}.summary`,
        message: `introduction is ${words} words; BRD section 5 requires 50-80`,
      });
    }
  }

  return issues;
}

/** Throws on any error-severity issue. Used by content modules at import. */
export function assertContentValid(bundle: ContentBundle): void {
  const errors = validateContent(bundle).filter(
    (issue) => issue.severity === "error",
  );
  if (errors.length > 0) {
    const lines = errors.map((e) => `  - ${e.where}: ${e.message}`).join("\n");
    throw new Error(`Invalid site content:\n${lines}`);
  }
}
