"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { handBox } from "@/content/handwriting";
import { useInk } from "./use-ink";
import ink from "./ink.module.css";
import styles from "./hand.module.css";

/** t: seconds of writing, m: mask pen width, s: [path, start, end] as fractions of t. */
type StrokeFile = { t: number; m: number; s: [string, number, number][] };

// One request per phrase per page view, shared by every instance.
const cache = new Map<string, Promise<StrokeFile>>();
function load(id: string) {
  let pending = cache.get(id);
  if (!pending) {
    pending = fetch(`/hand/${id}.json`).then((response) => {
      if (!response.ok) throw new Error(`hand/${id}: ${response.status}`);
      return response.json() as Promise<StrokeFile>;
    });
    cache.set(id, pending);
  }
  return pending;
}

/** The traced pen is this fraction of the reveal width stored in the file. */
const PEN_FROM_MASK = 1 / 2.1;

/**
 * Writes a phrase with pen strokes traced through the font's own letters,
 * starting the first time it is mostly on screen, then settles into the real
 * font text so the finished phrase is exactly the font.
 *
 * Visible strokes rather than an SVG mask: Safari neither animates nor
 * reliably renders masked text, while stroke animation works everywhere.
 */
export function HandStrokes({ id, text, width, delay }: { id: string; text: string; width: number; delay: number }) {
  const [data, setData] = useState<StrokeFile | null>(null);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useInk(svgRef, data !== null, () => {
    if (!data) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = window.setTimeout(() => setDone(true), reduce ? 0 : (delay + data.t) * 1000 + 80);
  });

  useEffect(() => {
    let live = true;
    load(id)
      .then((file) => live && setData(file))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
      window.clearTimeout(timer.current);
    };
  }, [id]);

  if (failed) {
    return (
      <span className={`hand ${styles.final}`} data-shown="" aria-hidden="true">
        {text}
      </span>
    );
  }
  if (!data) return null;

  return (
    <>
      <svg
        ref={svgRef}
        className={`${ink.ink} ${styles.svg}`}
        viewBox={`0 0 ${width} ${handBox}`}
        aria-hidden="true"
        data-draw="view"
        data-done={done ? "" : undefined}
        fill="none"
        stroke="currentColor"
        strokeWidth={Math.round(data.m * PEN_FROM_MASK)}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ "--ink-delay": `${delay}s`, "--total": `${data.t}s` } as CSSProperties}
      >
        {data.s.map(([d, p0, p1], index) => (
          <path key={index} d={d} style={{ "--p0": p0, "--p1": p1 } as CSSProperties} />
        ))}
      </svg>
      <span className={`hand ${styles.final}`} data-shown={done ? "" : undefined} aria-hidden="true">
        {text}
      </span>
    </>
  );
}
