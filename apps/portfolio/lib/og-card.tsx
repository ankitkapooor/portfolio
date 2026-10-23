import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { signatureStroke, signatureStrokes, signatureViewBox } from "@/content/signature";

/** Open Graph / link-preview card: the owner's signature, and nothing louder. */
export const ogSize = { width: 1200, height: 630 };

const PAPER = "#0B0B0C";
const INK = "#F2F1EE";
const MUTED = "#A3A3A8";
const ACCENT = "#FF7A45";

const [, , vbWidth, vbHeight] = signatureViewBox.split(" ").map(Number);

/**
 * Renders the card at build time. `caption` (a project name on case pages)
 * is set in the owner's handwriting font under the signature.
 */
export async function signatureCard({ caption }: { caption?: string } = {}) {
  // ImageResponse needs a TTF/OTF/WOFF buffer; next/font's WOFF2 can't be used.
  const hand = await readFile(join(process.cwd(), "app/fonts/AnkitHand-Regular.ttf"));

  const sigWidth = caption ? 640 : 900;
  const sigHeight = Math.round((sigWidth * vbHeight) / vbWidth);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: PAPER,
          color: INK,
          fontFamily: "Ankit Hand",
          position: "relative",
          // Lift the signature and caption clear of the domain line.
          paddingBottom: caption ? 70 : 0,
        }}
      >
        <svg
          width={sigWidth}
          height={sigHeight}
          viewBox={signatureViewBox}
          fill="none"
          stroke={INK}
          strokeWidth={signatureStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {signatureStrokes.map(([d], index) => (
            <path key={index} d={d} />
          ))}
        </svg>
        {caption ? (
          <div style={{ display: "flex", marginTop: 24, fontSize: 54, color: ACCENT }}>{caption}</div>
        ) : null}
        <div
          style={{
            position: "absolute",
            bottom: 44,
            display: "flex",
            fontSize: 30,
            color: MUTED,
          }}
        >
          ankitkapoor.me
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Ankit Hand", data: hand, style: "normal", weight: 400 }],
    },
  );
}
