import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
