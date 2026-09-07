/**
 * Site-level configuration.
 *
 * `siteOrigin` is deliberately null until a real origin exists. Nothing in the
 * app substitutes a placeholder domain: canonical URLs and absolute Open Graph
 * URLs stay switched off, and robots.txt stays closed, until it is set.
 *
 * To configure it, either set NEXT_PUBLIC_SITE_ORIGIN at build time or replace
 * the fallback below with the real origin, e.g. "https://ankitkapoor.dev".
 */

function readOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim();
  if (!raw) return null;

  // Fail loudly rather than emitting a broken canonical URL.
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error(
      `NEXT_PUBLIC_SITE_ORIGIN must use https (received "${raw}").`,
    );
  }
  return url.origin;
}

export const siteOrigin: string | null = readOrigin();

/** Origin used for the sitemap, which requires absolute URLs. */
export const sitemapOrigin = siteOrigin ?? "http://localhost:3000";

export const siteName = "Ankit Kapoor — AI strategy";

export const siteDescription =
  "An editorial portfolio of three investigations into how AI changes competition, customer value, and business economics.";

export type NavItem = {
  label: string;
  href: string;
};

/** Primary navigation. Three items, per BRD section 4. */
export const primaryNav: readonly NavItem[] = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/#contact" },
] as const;

/** Method is a quiet footer link, not a competing primary item. */
export const footerNav: readonly NavItem[] = [
  { label: "Method", href: "/method" },
] as const;

/** Routes the sitemap should list. Project routes are appended from content. */
export const staticRoutes = ["/", "/about", "/method"] as const;
