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
