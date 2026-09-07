import styles from "./schematics.module.css";

/**
 * Concept preview for Priced In.
 *
 * Shows a labelled hypothetical expectations map: revenue growth against
 * operating margin, with a band marking the combinations that would satisfy
 * one hypothetical enterprise-value target, and the operating bridge that
 * translates a chosen combination into operating requirements.
 *
 * Both axes are unitless and unnumbered, and the target is hypothetical. The
 * drawing shows no company, price, forecast, or return.
 */

const GRID_X = [190, 284, 378, 472, 566];
const GRID_Y = [131, 190, 249, 308];

const BRIDGE_ROWS = [
  "Customers the business must add",
  "Price it must hold per customer",
  "Contribution the AI initiative must make",
];

export function PricedInSchematic() {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 720 500"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <marker
          id="priced-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className={styles.fillInk} />
        </marker>
        <marker
          id="priced-arrow-accent"
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
        Expectations map
      </text>
      <text className={styles.tag} x="720" y="14" textAnchor="end">
        Hypothetical target
      </text>

      <text className={styles.heading} x="96" y="46">
        What would have to be true?
      </text>

      {/* ---- Grid ---- */}
      {GRID_X.map((x) => (
        <line
          key={`gx-${x}`}
          className={styles.hairline}
          x1={x}
          y1="72"
          x2={x}
          y2="368"
        />
      ))}
      {GRID_Y.map((y) => (
        <line
          key={`gy-${y}`}
          className={styles.hairline}
          x1="96"
          y1={y}
          x2="660"
          y2={y}
        />
      ))}

      {/* ---- Satisfying band for one hypothetical target ---- */}
      <path
        className={styles.fillAccent}
        fillOpacity="0.14"
        d="M 120 96 C 262 206, 382 296, 652 336 L 652 362 C 372 316, 252 236, 120 136 Z"
      />
      <path
        className={styles.strokeAccent}
        d="M 120 96 C 262 206, 382 296, 652 336"
      />
      <path
        className={styles.strokeAccent}
        strokeDasharray="3 4"
        d="M 120 136 C 252 236, 372 316, 652 362"
      />

      {/* ---- Axes ---- */}
      <line
        className={styles.stroke}
        x1="96"
        y1="368"
        x2="672"
        y2="368"
        markerEnd="url(#priced-arrow)"
      />
      <line
        className={styles.stroke}
        x1="96"
        y1="368"
        x2="96"
        y2="60"
        markerEnd="url(#priced-arrow)"
      />
      <text className={styles.label} x="96" y="394">
        Revenue growth
      </text>
      <text className={styles.fine} x="672" y="394" textAnchor="end">
        Higher
      </text>
      <text
        className={styles.label}
        transform="translate(74 368) rotate(-90)"
        x="0"
        y="0"
      >
        Operating margin
      </text>
      <text
        className={styles.fine}
        transform="translate(74 72) rotate(-90)"
        x="0"
        y="0"
      >
        Higher
      </text>

      {/* ---- Two annotated combinations ---- */}
      <circle className={styles.fillInk} cx="212" cy="172" r="5" />
      <line className={styles.hairline} x1="222" y1="172" x2="286" y2="120" />
      <text className={styles.meta} x="292" y="112">
        Modest growth,
      </text>
      <text className={styles.meta} x="292" y="130">
        high margin
      </text>

      <circle
        className={styles.panelAccent}
        style={{ fill: "var(--paper)" }}
        cx="548"
        cy="322"
        r="7"
      />
      <line className={styles.hairline} x1="540" y1="312" x2="470" y2="262" />
      <text className={styles.meta} x="464" y="256" textAnchor="end">
        Fast growth,
      </text>
      <text className={styles.meta} x="464" y="274" textAnchor="end">
        thin margin
      </text>

      <text className={styles.fine} x="120" y="88">
        Every point on the band satisfies the same target
      </text>

      {/* ---- Notes ---- */}
      <text className={styles.fine} x="0" y="440">
        Axes are unitless.
      </text>
      <text className={styles.fine} x="0" y="460">
        The target is hypothetical.
      </text>
      <text className={styles.fine} x="0" y="480">
        No company, price, or forecast.
      </text>

      {/* ---- Operating bridge ---- */}
      <path
        className={styles.strokeAccent}
        d="M 548 332 C 548 380, 470 384, 470 414"
        markerEnd="url(#priced-arrow-accent)"
      />
      <rect
        className={styles.panel}
        x="312.5"
        y="418.5"
        width="407"
        height="80"
      />
      <text className={styles.tagAccent} x="330" y="440">
        Operating bridge
      </text>
      {BRIDGE_ROWS.map((row, index) => (
        <text
          key={row}
          className={styles.meta}
          x="330"
          y={458 + index * 17}
        >
          {row}
        </text>
      ))}
    </svg>
  );
}
