import type { Metadata } from "next";
import { Chivo } from "next/font/google";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { siteDescription, siteName, siteOrigin } from "@/content/site";
import { profile } from "@/content/profile";
import "./globals.css";

/*
 * next/font self-hosts the family at build time: no runtime request to
 * Google, and no layout shift. Licence notices are recorded in
 * ASSET_LICENCES.md. Chivo is the one typeface for headings, text and
 * figures; the owner's handwriting is the only other voice on the page.
 */
const sans = Chivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  fallback: ["-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial"],
});

/* "Ankit Hand": the owner's handwriting as a font (tools/handwriting). */
const hand = localFont({
  src: "./fonts/AnkitHand-Regular.woff2",
  display: "swap",
  variable: "--font-hand",
  fallback: ["Bradley Hand", "Segoe Print", "cursive"],
});

/*
 * Runs before first paint: marks <html class="js"> (handwritten phrases hide
 * their plain-text fallback), and applies a saved theme choice so a visitor
 * who picked light or dark never sees the other one flash. With no saved choice the
 * stylesheet follows prefers-color-scheme on its own, light when the device states none.
 */
const themeScript = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

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
    <html lang="en" className={`${sans.variable} ${hand.variable}`} suppressHydrationWarning>
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
