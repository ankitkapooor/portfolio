/**
 * Site-level configuration.
 *
 * `siteOrigin` is the address this site is served from. Canonical URLs,
 * absolute Open Graph URLs, and an open robots.txt all depend on it.
 *
 * It is a committed constant rather than a build-time-only variable so that a
 * deploy cannot silently lose it and ship a site that blocks every crawler.
 * NEXT_PUBLIC_SITE_ORIGIN overrides it, which is what a preview deployment on
 * its own hostname should do.
 *
 * The `| null` return is kept because callers still guard against an
 * unconfigured origin; with a default set, those guards no longer fire.
 */

const defaultOrigin = "https://ankitkapoor.me";

function readOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim() || defaultOrigin;

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

export const siteName = "Ankit Kapoor — AI Strategy & Decision Systems";

export const siteDescription =
  "Strategic decision systems by Ankit Kapoor: interactive work across growth, competition, defensibility, execution, and business economics.";

export type NavItem = {
  label: string;
  href: string;
};

/** Primary navigation. Method is central to the portfolio thesis. */
export const primaryNav: readonly NavItem[] = [
  { label: "Work", href: "/#work" },
  { label: "More Projects", href: "/more-projects" },
  { label: "Method", href: "/method" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/#contact" },
] as const;

export const footerNav: readonly NavItem[] = [
  { label: "More Projects", href: "/more-projects" },
] as const;

/** Routes the sitemap should list. Project routes are appended from content. */
export const staticRoutes = ["/", "/about", "/method", "/more-projects"] as const;
