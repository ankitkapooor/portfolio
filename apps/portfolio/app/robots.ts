import type { MetadataRoute } from "next";
import { siteOrigin } from "@/content/site";

/**
 * Robots policy tied to configuration, not to hope.
 *
 * Until a real origin is configured the site is not published, so crawling is
 * disallowed outright and no sitemap is advertised — a preview must not read
 * as a public launch. Configure NEXT_PUBLIC_SITE_ORIGIN and the policy opens.
 */
export default function robots(): MetadataRoute.Robots {
  if (!siteOrigin) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteOrigin}/sitemap.xml`,
    host: siteOrigin,
  };
}
