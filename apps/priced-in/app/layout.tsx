import { Manrope, Instrument_Serif } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const sans = Manrope({ variable: "--font-ui-sans", subsets: ["latin"], display: "swap" });
const serif = Instrument_Serif({ variable: "--font-ui-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  title: "Priced In — what must this company become to justify its valuation?",
  description:
    "An educational reverse-DCF workbench. Import financial statements, review every normalized figure against its source, and explore the growth and margin combinations consistent with a valuation target.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <div className="project-family">
          <div className="project-family-inner">
            <a href="https://ankitkapoor.me/#work">
              ankit.kapoor <span aria-hidden="true">↗</span>
            </a>
            <span>05 / ECONOMICS</span>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
