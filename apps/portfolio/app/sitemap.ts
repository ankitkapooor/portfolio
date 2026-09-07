import type { MetadataRoute } from "next";
import { sitemapOrigin, staticRoutes } from "@/content/site";
import { projects, projectPath } from "@/content/projects";

/**
 * Sitemap entries need absolute URLs, so this uses `sitemapOrigin`, which
 * falls back to the local dev origin until a real one is configured. It never
 * substitutes a placeholder public domain.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const newestUpdate = projects
    .map((project) => project.updatedAt)
    .toSorted()
    .at(-1);

  const pages = staticRoutes.map((route) => ({
    url: new URL(route, sitemapOrigin).toString(),
    lastModified: newestUpdate,
    changeFrequency: "monthly" as const,
    priority: route === "/" ? 1 : 0.6,
  }));

  const cases = projects.map((project) => ({
    url: new URL(projectPath(project), sitemapOrigin).toString(),
    lastModified: project.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...pages, ...cases];
}
