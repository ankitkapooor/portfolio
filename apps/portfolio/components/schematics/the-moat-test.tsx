import styles from "./schematics.module.css";

/**
 * Concept preview for The Moat Test.
 *
 * Shows the source-to-output comparison the investigation is built around: one
 * transcript on the left, two extraction methods on the right, and a line
 * reference behind every claim. The excerpt strings are hand-authored
 * illustrative content — not the output of a recorded run — and the drawing
 * carries no accuracy figure or score.
 */

/** Transcript rows. `text` renders literally; otherwise a redacted bar. */
const TRANSCRIPT_ROWS: { id: string; text?: string; width: number }[] = [
  { id: "L1", width: 168 },
  { id: "L2", width: 132 },
  { id: "L3", text: "DECISION: ship Thursday", width: 0 },
  { id: "L4", width: 150 },
  { id: "L5", width: 108 },
  { id: "L6", text: "ACTION: Priya to draft", width: 0 },
  { id: "L7", width: 156 },
  { id: "L8", width: 120 },
];

const BASELINE_ROWS = [
  { claim: "ship Thursday", ref: "L3" },
  { claim: "Priya to draft", ref: "L6" },
];

const CHALLENGER_ROWS = [
  { claim: "Decision — ship Thursday, current", ref: "L3" },
  { claim: "Action — Priya, due unresolved", ref: "L6" },
  { claim: "Open question — who signs off?", ref: "L4-L5" },
  { claim: "Owner ambiguous, left null", ref: "L7" },
];

export function TheMoatTestSchematic() {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 720 500"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <marker
          id="moat-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className={styles.fillAccent} />
        </marker>
      </defs>

      <text className={styles.tag} x="0" y="14">
        One transcript, two methods
      </text>
      <text className={styles.tag} x="720" y="14" textAnchor="end">
        Illustrative excerpt
      </text>

      {/* ---- Source transcript ---- */}
      <rect className={styles.panel} x="0.5" y="40.5" width="255" height="376" />
      <text className={styles.label} x="16" y="70">
        Transcript
      </text>
      <text className={styles.fine} x="16" y="90">
        Speaker labels, stable line IDs
      </text>

      {TRANSCRIPT_ROWS.map((row, index) => {
        const y = 118 + index * 36;
        const tagged = row.text !== undefined;
        return (
          <g key={row.id}>
            <text
              className={styles.fine}
              x="16"
              y={y + 4}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {row.id}
            </text>
            {tagged ? (
              <text className={styles.meta} x="46" y={y + 4}>
                {row.text}
              </text>
            ) : (
              <rect
                className={styles.fillRule}
                x="46"
                y={y - 4}
                width={row.width}
                height="8"
              />
            )}
            {tagged ? (
              <line
                className={styles.strokeAccent}
                x1="16"
                y1={y + 12}
                x2="240"
                y2={y + 12}
                strokeDasharray="2 3"
              />
            ) : null}
          </g>
        );
      })}

      {/* ---- Connectors from the two tagged lines to both panels ---- */}
      <path
        className={styles.strokeAccent}
        d="M 256 190 C 282 190, 282 150, 308 150"
        markerEnd="url(#moat-arrow)"
      />
      <path
        className={styles.strokeAccent}
        d="M 256 298 C 282 298, 282 330, 308 330"
        markerEnd="url(#moat-arrow)"
      />

      {/* ---- Baseline output ---- */}
      <rect
        className={styles.panel}
        x="312.5"
        y="40.5"
        width="407"
        height="164"
      />
      <text className={styles.label} x="332" y="70">
        Baseline: tagged lines only
      </text>
      <text className={styles.fine} x="332" y="90">
        Deterministic string match. The floor to beat.
      </text>
      {BASELINE_ROWS.map((row, index) => {
        const y = 124 + index * 30;
        return (
          <g key={row.ref}>
            <circle className={styles.fillInk} cx="338" cy={y - 4} r="2.5" />
            <text className={styles.meta} x="350" y={y}>
              {row.claim}
            </text>
            <text className={styles.figure} x="704" y={y} textAnchor="end">
              {row.ref}
            </text>
          </g>
        );
      })}
      <text className={styles.fine} x="332" y="190">
        Untagged lines: ignored entirely
      </text>

      {/* ---- Challenger output ---- */}
      <rect
        className={styles.panel}
        x="312.5"
        y="224.5"
        width="407"
        height="192"
      />
      <line
        className={styles.strokeAccent}
        x1="312.5"
        y1="224.5"
        x2="312.5"
        y2="416.5"
      />
      <text className={styles.label} x="332" y="254">
        Challenger: model extraction
      </text>
      <text className={styles.fine} x="332" y="274">
        Owner, status, and a line reference per claim
      </text>
      {CHALLENGER_ROWS.map((row, index) => {
        const y = 306 + index * 30;
        return (
          <g key={row.ref}>
            <circle className={styles.fillAccent} cx="338" cy={y - 4} r="2.5" />
            <text className={styles.meta} x="350" y={y}>
              {row.claim}
            </text>
            <text className={styles.figure} x="704" y={y} textAnchor="end">
              {row.ref}
            </text>
          </g>
        );
      })}

      {/* ---- Footer ---- */}
      <line className={styles.hairline} x1="0" y1="446" x2="720" y2="446" />
      <text className={styles.meta} x="0" y="474">
        Both panels stay blind until the reveal. No accuracy figure exists yet.
      </text>
    </svg>
  );
}
