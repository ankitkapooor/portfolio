import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Moat Test",
    template: "%s — The Moat Test",
  },
  description:
    "An investigation into what stays valuable when an AI feature is easy to reproduce, built on a synthetic benchmark whose limits are published alongside its results.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <a className="skipLink" href="#main">
          Skip to content
        </a>
        <header className="siteHeader">
          <div className="page siteHeaderInner">
            <Link href="/" className="siteMark">
              The Moat Test
            </Link>
            <nav className="siteNav" aria-label="Sections">
              <Link href="/investigations/meeting-assistants">Investigation</Link>
              <Link href="/lab/meeting-assistants">Lab</Link>
              <Link href="/evidence">Evidence</Link>
              <Link href="/methodology">Methodology</Link>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="siteFooter">
          <div className="page siteFooterInner">
            <p className="measure">
              Every transcript in this project is synthetic and depicts no real
              meeting. Gold annotations are drafts that no human has reviewed. No
              commercial product has been tested here.
            </p>
            <p>
              <Link href="/methodology">How this was measured</Link> ·{" "}
              <Link href="/evidence">Evidence ledger</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
