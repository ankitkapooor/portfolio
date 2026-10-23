"use client";

import { useEffect, type RefObject } from "react";

/**
 * Prepares an `.ink` SVG to write itself: measures every path's real length
 * (Safari ignores `pathLength` when dashing) and sets each stroke's dash and
 * timing, then marks the SVG visible the first time it is mostly on screen,
 * which starts the CSS animation in ink.module.css. With reduced motion the
 * strokes are left whole.
 *
 * `ready` lets callers wait until their paths are actually rendered;
 * `onVisible` runs once, when writing starts.
 */
export function useInk(ref: RefObject<SVGSVGElement | null>, ready = true, onVisible?: () => void) {
  useEffect(() => {
    const svg = ref.current;
    if (!svg || !ready) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      const style = getComputedStyle(svg);
      const total = Number.parseFloat(style.getPropertyValue("--total")) || 1;
      const delay = Number.parseFloat(style.getPropertyValue("--ink-delay")) || 0;
      const cap = Number.parseFloat(svg.getAttribute("stroke-width") ?? "0") || 0;
      // Plain values, not calc() on custom properties: Safari resolves those
      // timing calculations to zero and draws everything at once.
      for (const path of svg.querySelectorAll<SVGPathElement>("path")) {
        const length = path.getTotalLength() + 1;
        const p0 = Number.parseFloat(path.style.getPropertyValue("--p0")) || 0;
        const p1 = Number.parseFloat(path.style.getPropertyValue("--p1")) || 1;
        // A dash of the stroke's length, offset past its length and round
        // cap, draws nothing; the gap is long enough that no cap dots show.
        path.style.strokeDasharray = `${length.toFixed(1)} ${(length + cap * 2 + 10).toFixed(1)}`;
        path.style.strokeDashoffset = (length + cap).toFixed(1);
        path.style.animationDuration = `${Math.max(0.01, (p1 - p0) * total).toFixed(3)}s`;
        path.style.animationDelay = `${(delay + p0 * total).toFixed(3)}s`;
      }
    }
    svg.dataset.measured = "";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          svg.dataset.visible = "";
          observer.disconnect();
          onVisible?.();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(svg);
    return () => observer.disconnect();
    // onVisible is read once, when the observer fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ready]);
}
