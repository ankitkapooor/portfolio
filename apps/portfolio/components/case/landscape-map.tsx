"use client";

import { useState, type CSSProperties } from "react";
import type { StrategicCase } from "@/lib/case-schema";
import styles from "./strategic-case.module.css";

type Landscape = StrategicCase["landscape"];

/**
 * Positioning map. Each category is a real button; the detail panel explains
 * why it sits where it does. Before hydration the panel shows the case's own
 * position, and the full list of positions is always available in words.
 */
export function LandscapeMap({
  landscape,
  sourceOrder,
}: {
  landscape: Landscape;
  sourceOrder: Record<string, number>;
}) {
  const selfId = landscape.players.find((player) => player.self)?.id ?? landscape.players[0].id;
  const [selected, setSelected] = useState(selfId);
  const current = landscape.players.find((player) => player.id === selected) ?? landscape.players[0];
  const [xTitle, xLow, xHigh] = landscape.xAxis;
  const [yTitle, yLow, yHigh] = landscape.yAxis;

  return (
    <div className={`${styles.map} ${styles.reveal}`}>
      <div className={styles.mapFigure}>
        <div className={styles.plotFrame}>
          <p className={styles.yTitle}>{yTitle} ↑</p>
          <div className={styles.plot} role="group" aria-label={`Positioning map: ${xTitle} by ${yTitle}`}>
            <span className={styles.whiteSpace} aria-hidden="true">
              <span>Open space</span>
            </span>
            <span className={styles.axisV} aria-hidden="true" />
            <span className={styles.axisH} aria-hidden="true" />
            <span className={`${styles.tick} ${styles.tickYHigh}`} aria-hidden="true">{yHigh}</span>
            <span className={`${styles.tick} ${styles.tickYLow}`} aria-hidden="true">{yLow}</span>
            {landscape.players.map((player, index) => (
              <button
                key={player.id}
                type="button"
                className={styles.dot}
                data-self={player.self ? "true" : undefined}
                data-side={player.x > 0.55 ? "left" : "right"}
                aria-pressed={selected === player.id}
                onClick={() => setSelected(player.id)}
                style={
                  {
                    left: `${player.x * 100}%`,
                    bottom: `${player.y * 100}%`,
                    "--i": index,
                  } as CSSProperties
                }
              >
                <span className={styles.dotMark} aria-hidden="true" />
                <span className={styles.dotLabel}>{player.name}</span>
              </button>
            ))}
          </div>
          <div className={styles.xTicks} aria-hidden="true">
            <span>{xLow}</span>
            <span className={styles.xTitle}>{xTitle} →</span>
            <span>{xHigh}</span>
          </div>
        </div>
        <p className={styles.caveat}>{landscape.caveat}</p>
      </div>

      <div className={styles.mapPanel} aria-live="polite" data-self={current.self ? "true" : undefined}>
        <p className={styles.panelKicker}>{current.self ? "This project" : "Alternative"}</p>
        <h3 className={styles.panelTitle}>{current.name}</h3>
        <p className={styles.panelExamples}>{current.examples}</p>
        <dl className={styles.panelList}>
          <div>
            <dt>Wins on</dt>
            <dd>{current.wins}</dd>
          </div>
          <div>
            <dt>Leaves open</dt>
            <dd>
              {current.gap}
              {current.sourceRefs.length > 0 ? (
                <span className={styles.cite}>
                  {current.sourceRefs.map((ref) => (
                    <a key={ref} href={`#${ref}`} aria-label={`Source ${sourceOrder[ref]}`}>
                      {sourceOrder[ref]}
                    </a>
                  ))}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>
        <p className={styles.whiteSpaceNote}>{landscape.whiteSpace}</p>
      </div>

      <details className={styles.mapText}>
        <summary>All positions, in words</summary>
        <ul>
          {landscape.players.map((player) => (
            <li key={player.id}>
              <strong>{player.name}</strong> ({player.examples}). {xTitle}: {player.x >= 0.5 ? xHigh : xLow}. {yTitle}:{" "}
              {player.y >= 0.5 ? yHigh : yLow}. Wins on: {player.wins} Leaves open: {player.gap}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
