import { ogSize, signatureCard } from "@/lib/og-card";

export const alt = "Ankit Kapoor's handwritten signature, with ankitkapoor.me below it.";
export const size = ogSize;
export const contentType = "image/png";

/** Required by `output: "export"`: the card is rendered once, at build time. */
export const dynamic = "force-static";

/** The link preview for the site: the owner's signature. */
export default function Image() {
  return signatureCard();
}
