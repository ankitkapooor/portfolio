import type { CSSProperties } from "react";
import { handAscent, handBox, handPhrases } from "@/content/handwriting";
import { HandStrokes } from "./hand-strokes";
import styles from "./hand.module.css";

/**
 * Text in the owner's handwriting font, "Ankit Hand".
 *
 * With `draw="none"` this is simply text set in the font. With `draw="view"`,
 * phrases listed in content/handwriting.ts write themselves once they scroll
 * into view:
 * pen paths traced through the font's own letters reveal the real text stroke
 * by stroke, so the finished result is exactly the font. Phrases without
 * traced paths fall back to plain text in the font.
 *
 * The real text is always in the DOM for screen readers, search, and
 * copy-paste. Without JavaScript, the font text shows in place.
 */
export function Hand({
  text,
  draw = "none",
  delay = 0,
  className,
}: {
  text: string;
  draw?: "view" | "none";
  delay?: number;
  className?: string;
}) {
  const phrase = handPhrases[text];
  if (draw === "none" || !phrase) return <span className={`hand ${className ?? ""}`}>{text}</span>;

  return (
    <span
      className={`${styles.phrase} ${className ?? ""}`}
      style={
        {
          width: `${phrase.w / 1000}em`,
          height: `${handBox / 1000}em`,
          verticalAlign: `${-(handBox - handAscent) / 1000}em`,
        } as CSSProperties
      }
    >
      <span className="visuallyHidden">{text}</span>
      <span className={`hand ${styles.fallback}`} aria-hidden="true">
        {text}
      </span>
      <HandStrokes id={phrase.id} text={text} width={phrase.w} delay={delay} />
    </span>
  );
}

/** Splits on " → " so each side of a role change writes itself. */
export function HandText({ text, draw = "none", className }: { text: string; draw?: "view" | "none"; className?: string }) {
  const pieces = text.split(" → ");
  return (
    <span className={className}>
      {pieces.map((piece, index) => (
        <span key={piece}>
          {index > 0 ? <span className="hand"> → </span> : null}
          <Hand text={piece} draw={draw} delay={index * 0.6} />
        </span>
      ))}
    </span>
  );
}
