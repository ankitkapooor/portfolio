import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { siteDescription, siteName, siteOrigin } from "@/content/site";
import { profile } from "@/content/profile";
import "./globals.css";

/*
 * next/font self-hosts both families at build time: no runtime request to
 * Google, and no layout shift. Licence notices are recorded in
 * ASSET_LICENCES.md. `display: swap` plus the fallback stacks in
 * styles/tokens.css keep a coherent serif/sans hierarchy if the files fail.
 */
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
  fallback: ["Iowan Old Style", "Palatino", "Georgia", "serif"],
});

const sans = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  fallback: ["-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial"],
});

/*
 * `metadataBase` and canonical URLs stay unset until a real origin is
 * configured, so the site never publishes a placeholder domain as canonical.
 * See content/site.ts.
 */
export const metadata: Metadata = {
  ...(siteOrigin
    ? { metadataBase: new URL(siteOrigin), alternates: { canonical: "/" } }
    : {}),
  title: {
    default: siteName,
    template: `%s — ${profile.name}`,
  },
  description: siteDescription,
  authors: [{ name: profile.name }],
  creator: profile.name,
  openGraph: {
    type: "website",
    title: siteName,
    description: siteDescription,
    siteName,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a className="skipLink" href="#main">
          Skip to main content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
