"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { handAscent, handBox } from "@/content/handwriting";
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

/**
 * The font text, revealed through a mask of pen paths that draw in writing
 * order. "view" phrases start the first time they are mostly on screen.
 */
export function HandStrokes({
  id,
  text,
  width,
  draw,
  delay,
}: {
  id: string;
  text: string;
  width: number;
  draw: "load" | "view";
  delay: number;
}) {
  const [data, setData] = useState<StrokeFile | null>(null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const maskId = useId();

  useEffect(() => {
    let live = true;
    load(id)
      .then((file) => live && setData(file))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    const svg = svgRef.current;
    if (draw !== "view" || !svg) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, [draw, data]);

  if (failed) {
    return (
      <span className={`hand ${styles.fallbackShown}`} aria-hidden="true">
        {text}
      </span>
    );
  }
  if (!data) return null;

  return (
    <svg
      ref={svgRef}
      className={`${ink.ink} ${styles.svg}`}
      viewBox={`0 0 ${width} ${handBox}`}
      aria-hidden="true"
      data-draw={draw}
      data-io=""
      data-visible={visible ? "" : undefined}
      style={{ "--sig-delay": `${delay}s`, "--total": `${data.t}s` } as CSSProperties}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="-200" y="-200" width={width + 400} height={handBox + 400}>
        <g fill="none" stroke="#fff" strokeWidth={data.m} strokeLinecap="round" strokeLinejoin="round">
          {data.s.map(([d, p0, p1], index) => (
            <path key={index} d={d} pathLength={1} style={{ "--p0": p0, "--p1": p1 } as CSSProperties} />
          ))}
        </g>
      </mask>
      <text x="0" y={handAscent} fontSize="1000" className={styles.svgText} mask={`url(#${maskId})`}>
        {text}
      </text>
    </svg>
  );
}
