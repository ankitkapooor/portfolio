import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
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

/*
 * Bricolage Grotesque carries the display type: its optical-size axis turns
 * the large headings tight and characterful while staying legible small.
 * Instrument Sans is the reading face and pairs with Instrument Serif, which
 * supplies the italic accents. JetBrains Mono handles labels and data.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["opsz", "wdth"],
  fallback: ["-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial"],
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  axes: ["wdth"],
  fallback: ["-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

/*
 * Applies a saved theme choice before first paint, so a visitor who picked
 * light or dark never sees the other one flash. With no saved choice the
 * stylesheet follows prefers-color-scheme on its own.
 */
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

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
    <html lang="en" className={`${serif.variable} ${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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
