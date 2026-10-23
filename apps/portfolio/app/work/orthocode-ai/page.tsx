import type { Metadata } from "next";
import { StrategicCasePage } from "@/components/case/strategic-case-page";
import { orthocodeCase } from "@/content/cases/orthocode-ai";

/*
 * Pilot of the v2 strategic-case template. A static segment, so it takes
 * precedence over /work/[slug] without touching the five existing cases.
 */
export const metadata: Metadata = {
  title: `${orthocodeCase.title} — ${orthocodeCase.question}`,
  description: orthocodeCase.bet,
  alternates: { canonical: `/work/${orthocodeCase.slug}` },
  openGraph: {
    type: "article",
    title: `${orthocodeCase.title} — ${orthocodeCase.question}`,
    description: orthocodeCase.bet,
  },
};

export default function OrthoCodeCasePage() {
  return <StrategicCasePage data={orthocodeCase} />;
}
