import { describe, expect, it } from "vitest";
import {
  footerNav,
  primaryNav,
  siteOrigin,
  sitemapOrigin,
  staticRoutes,
} from "@/content/site";
import { projects, projectPath } from "@/content/projects";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

/**
 * Navigation, routing, and the metadata routes. The point is that every link
 * the site offers resolves to a page this app actually builds, and that the
 * robots/canonical policy stays tied to configuration rather than to a
 * placeholder domain.
 */

/** Every route the app renders. */
const ROUTES = [
  "/",
  "/about",
  "/method",
  ...projects.map((project) => projectPath(project)),
];

describe("primary navigation", () => {
  it("is exactly Work, About, Contact", () => {
    expect(primaryNav.map((item) => item.label)).toEqual([
      "Work",
      "About",
      "Contact",
    ]);
  });

  it("points Work and Contact at home anchors that work from any route", () => {
    expect(primaryNav.find((item) => item.label === "Work")?.href).toBe("/#work");
    expect(primaryNav.find((item) => item.label === "Contact")?.href).toBe(
      "/#contact",
    );
  });

  it("keeps Method as a quiet footer link, not a primary item", () => {
    expect(primaryNav.map((item) => item.label)).not.toContain("Method");
    expect(footerNav.map((item) => item.label)).toContain("Method");
  });

  it("resolves every navigation href to a real route", () => {
    for (const item of [...primaryNav, ...footerNav]) {
      const path = item.href.split("#")[0] || "/";
      expect(ROUTES, item.href).toContain(path);
    }
  });

  it("uses a single /work taxonomy with no /projects duplicate", () => {
    const hrefs = [...primaryNav, ...footerNav].map((item) => item.href);
    for (const href of [...hrefs, ...ROUTES]) {
      expect(href).not.toContain("/projects");
    }
    for (const project of projects) {
      expect(projectPath(project).startsWith("/work/")).toBe(true);
    }
  });
});

describe("sitemap", () => {
  const entries = sitemap();

  it("lists every route exactly once", () => {
    const paths = entries.map((entry) => new URL(entry.url).pathname);
    expect(paths.toSorted()).toEqual(ROUTES.toSorted());
  });

  it("emits absolute URLs on the configured origin", () => {
    for (const entry of entries) {
      expect(entry.url.startsWith(sitemapOrigin), entry.url).toBe(true);
      expect(() => new URL(entry.url)).not.toThrow();
    }
  });

  it("never publishes a placeholder domain", () => {
    for (const entry of entries) {
      expect(entry.url).not.toContain("example.com");
    }
  });

  it("carries a valid last-modified date on every entry", () => {
    for (const entry of entries) {
      expect(String(entry.lastModified)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("ranks the homepage above the cases, and the cases above the rest", () => {
    const byPath = new Map(
      entries.map((entry) => [new URL(entry.url).pathname, entry.priority]),
    );
    expect(byPath.get("/")).toBe(1);
    expect(byPath.get("/work/priced-in")).toBe(0.8);
    expect(byPath.get("/about")).toBe(0.6);
  });
});

describe("robots policy", () => {
  const policy = robots();

  it("opens crawling and advertises the sitemap, now that an origin is configured", () => {
    // The site is deployed, so the policy that kept an unpublished preview out
    // of search results no longer applies.
    expect(siteOrigin).toBe("https://ankitkapoor.me");
    expect(policy.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(policy.sitemap).toBe("https://ankitkapoor.me/sitemap.xml");
  });
});

describe("static route list", () => {
  it("matches the non-project routes the app builds", () => {
    expect([...staticRoutes]).toEqual(["/", "/about", "/method"]);
  });
});
