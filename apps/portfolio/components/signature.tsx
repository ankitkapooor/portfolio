"use client";

import { useRef, type CSSProperties } from "react";
import { signatureStroke, signatureStrokes, signatureViewBox } from "@/content/signature";
import { useInk } from "./use-ink";
import styles from "./ink.module.css";

const total = Math.max(...signatureStrokes.map(([, start, duration]) => start + duration));

/**
 * The owner's signature as stroked SVG paths, so it takes the current text
 * colour in either theme. `draw="view"` writes itself the first time it
 * scrolls into view; `draw="none"` is static. Reduced motion and no
 * JavaScript show the finished signature. Pass an empty `label` where the
 * signature is purely decorative.
 */
export function Signature({
  className,
  draw = "none",
  label = "Ankit Kapoor's signature",
  delay = 0,
}: {
  className?: string;
  draw?: "view" | "none";
  label?: string;
  delay?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useInk(ref, draw === "view");

  return (
    <svg
      ref={ref}
      className={`${styles.ink} ${className ?? ""}`}
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
      style={{ "--ink-delay": `${delay}s`, "--total": `${total}s` } as CSSProperties}
    >
      {signatureStrokes.map(([d, start, duration], index) => (
        <path
          key={index}
          d={d}
          style={
            {
              "--p0": start / total,
              "--p1": Math.min(1, (start + duration) / total),
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}
