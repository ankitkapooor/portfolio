"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./decision-atlas.module.css";

type AtlasProject = { slug: string; number: string; title: string; question: string; decisionDomain: string };

/** A small, self-contained project explorer; the cases also remain linked below. */
export function DecisionAtlas({ projects }: { projects: AtlasProject[] }) {
  const [active, setActive] = useState(0);
  const project = projects[active];
  return (
    <div className={styles.atlas}>
      <div className={styles.topline}><span>THE DECISION ATLAS</span><span>01 — 05</span></div>
      <div className={styles.drawing}>
        <svg viewBox="0 0 560 440" role="img" aria-label="An orbital map connecting five strategic questions around one idea: what has to be true?">
          <defs>
            <radialGradient id="atlas-glow"><stop stopColor="var(--surface)" stopOpacity=".8"/><stop offset="1" stopColor="var(--paper)" stopOpacity="0"/></radialGradient>
          </defs>
          <circle cx="280" cy="220" r="218" fill="url(#atlas-glow)" />
          <g className={styles.grid}>
            <path d="M40 220H520M280 20V420" />
            <circle cx="280" cy="220" r="190" strokeDasharray="2 8" />
            <circle cx="280" cy="220" r="132" />
            <path d="M50 30h12m-6-6v12M498 30h12m-6-6v12M50 410h12m-6-6v12M498 410h12m-6-6v12" />
          </g>
          <g className={styles.orbits}>
            {[-60, -40, -20, 0, 20, 40, 60].map((angle) => (
              <ellipse key={angle} cx="280" cy="220" rx="182" ry="76" transform={`rotate(${angle} 280 220)`} />
            ))}
            <ellipse cx="280" cy="220" rx="182" ry="76" transform="rotate(90 280 220)" />
          </g>
          <circle cx="280" cy="220" r="78" fill="var(--paper)" stroke="var(--accent)" strokeOpacity=".35" />
          <text x="280" y="203" className={styles.centerText}>What has to</text>
          <text x="280" y="235" className={styles.centerItalic}>be true?</text>
          {[[280,38],[456,163],[389,367],[171,367],[104,163]].map(([x,y], index) => (
            <g key={index} className={index === active ? styles.activeNode : styles.node}>
              <circle cx={x} cy={y} r="13" />
              <circle cx={x} cy={y} r="4" />
              <text x={x} y={y + (y > 300 ? 32 : -23)}>{["GROWTH", "COMPETITION", "DEFENSIBILITY", "EXECUTION", "ECONOMICS"][index]}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className={styles.controls} aria-label="Explore a strategic question">
        {projects.map((item, index) => (
          <button key={item.slug} type="button" aria-pressed={active === index} aria-label={`Explore ${item.title}`} onClick={() => setActive(index)}>
            {item.number}<span>{["Growth", "Competition", "Moats", "Execution", "Value"][index]}</span>
          </button>
        ))}
      </div>
      <div className={styles.readout} aria-live="polite" aria-atomic="true">
        <p>{project.question}</p>
        <Link href={`/work/${project.slug}`}>{project.title}<span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
