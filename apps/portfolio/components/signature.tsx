import type { CSSProperties } from "react";
import { signatureStroke, signatureStrokes, signatureViewBox } from "@/content/signature";
import styles from "./signature.module.css";

const total = Math.max(...signatureStrokes.map(([, start, duration]) => start + duration));

/**
 * The owner's signature as stroked SVG paths, so it takes the current text
 * colour in either theme. `draw="load"` writes itself on page load,
 * `draw="view"` writes itself as it scrolls into view, and `draw="none"` is
 * static. Reduced motion always shows the finished signature. Pass an empty
 * `label` where the signature is purely decorative.
 */
export function Signature({
  className,
  draw = "none",
  label = "Ankit Kapoor's signature",
  delay = 0,
}: {
  className?: string;
  draw?: "load" | "view" | "none";
  label?: string;
  delay?: number;
}) {
  return (
    <svg
      className={`${styles.signature} ${className ?? ""}`}
      viewBox={signatureViewBox}
      data-draw={draw}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      fill="none"
      stroke="currentColor"
      strokeWidth={signatureStroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ "--sig-delay": `${delay}s` } as CSSProperties}
    >
      {signatureStrokes.map(([d, start, duration], index) => (
        <path
          key={index}
          d={d}
          pathLength={1}
          style={
            {
              "--start": `${start}s`,
              "--dur": `${duration}s`,
              // Unitless share of the timeline, for the scroll-driven variant.
              "--p0": start / total,
              "--p1": Math.min(1, (start + duration) / total),
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}
