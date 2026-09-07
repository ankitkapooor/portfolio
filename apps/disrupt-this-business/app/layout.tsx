import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { defaultScenario } from "@/content/scenarios";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Disrupt This Business",
    template: "%s — Disrupt This Business",
  },
  description:
    "A four-quarter competitive strategy exercise about AI disruption, run on a deterministic and fully documented economic engine. All scenario companies and economics are fictional design assumptions.",
};

/** Optional link back to a portfolio. Absent unless configured. */
const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <header className="site-header">
          <div className="site-header__inner">
            <Link className="site-header__mark" href="/">
              Disrupt This Business
            </Link>
            <nav className="site-nav" aria-label="Primary">
              <Link href="/play">Play</Link>
              <Link href="/results">Results</Link>
              <Link href="/methodology">Model</Link>
              <Link href="/analysis">Analysis</Link>
            </nav>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="shell">{children}</div>
        </main>
        <footer className="site-footer">
          <div className="site-footer__inner">
            <p>
              Scenario <strong>{defaultScenario.id}</strong> version{" "}
              {defaultScenario.version}. A fictional scenario built to make strategic
              trade-offs inspectable. It is not a forecasting system and makes no claim
              about any real company.
            </p>
            <p>
              Runs are saved in this browser only. Nothing is uploaded, and no account is
              required.
              {portfolioUrl ? (
                <>
                  {" "}
                  <a href={portfolioUrl}>Return to the portfolio</a>.
                </>
              ) : null}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
