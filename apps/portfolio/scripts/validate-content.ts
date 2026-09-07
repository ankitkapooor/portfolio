/**
 * Content validator. Run with `npm run validate:content`.
 *
 * Reports every problem it finds rather than stopping at the first, then exits
 * non-zero if any of them is an error. Warnings are printed and do not fail
 * the run — they are the launch checklist, not a broken build.
 *
 * Checks: zod shape and enums, duplicate slugs and project numbers, dangling
 * source IDs, unknown or missing assets (including files on disk), malformed
 * demo URLs, invalid or inconsistent dates, honesty guards on concept-stage
 * projects, and the 50-80 word homepage introduction limit.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { assets } from "../content/assets";
import { profile } from "../content/profile";
import { projects } from "../content/projects";
import { isSchematicId, schematicIds } from "../components/schematics/ids";
import { validateContent, type ValidationIssue } from "../lib/content-validation";

const PUBLIC_DIR = join(process.cwd(), "public");

/** Checks that assets promising a real file actually have one. */
function checkAssetsOnDisk(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const asset of assets) {
    if (asset.kind === "file" && asset.file) {
      if (!existsSync(join(PUBLIC_DIR, asset.file))) {
        issues.push({
          severity: "error",
          where: `asset "${asset.id}"`,
          message: `file "public/${asset.file}" does not exist`,
        });
      }
    }

    if (asset.kind === "svg-schematic" && !isSchematicId(asset.id)) {
      issues.push({
        severity: "error",
        where: `asset "${asset.id}"`,
        message:
          "no schematic component is registered in components/schematics/index.tsx",
      });
    }
  }

  for (const id of schematicIds) {
    if (!assets.some((asset) => asset.id === id)) {
      issues.push({
        severity: "warning",
        where: `schematic "${id}"`,
        message: "registered component has no matching asset record",
      });
    }
  }

  return issues;
}

const issues = [
  ...validateContent({ profile, projects, assets }),
  ...checkAssetsOnDisk(),
];

const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");

console.log(
  `Validating ${projects.length} projects, ${assets.length} assets, 1 profile.\n`,
);

for (const issue of errors) {
  console.error(`  ERROR    ${issue.where}: ${issue.message}`);
}
for (const issue of warnings) {
  console.warn(`  WARNING  ${issue.where}: ${issue.message}`);
}

if (errors.length > 0) {
  console.error(
    `\n${errors.length} error(s), ${warnings.length} warning(s). Content is not valid.`,
  );
  process.exit(1);
}

console.log(
  `Content is valid. ${warnings.length} warning(s) — see HANDOVER.md for the launch checklist.`,
);
