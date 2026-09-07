import styles from "./schematics.module.css";

/**
 * Concept preview for Disrupt This Business.
 *
 * Shows the decision scene: two opposed strategic positions, the two customer
 * segments that choose between them, and the four-quarter commit/reveal/resolve
 * loop that ends in a role reversal. Structure only — no outcome, no score, no
 * currency figure. Segment counts are fictional scenario parameters and are
 * labelled as such inside the drawing.
 */

const SEAT_COLUMNS = [0, 1, 2, 3];
const SEAT_ROWS = [0, 1, 2];
const BUNDLE_WIDTHS = [152, 116, 84];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export function DisruptThisBusinessSchematic() {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 720 500"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <marker
          id="dtb-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className={styles.fillInk} />
        </marker>
        <marker
          id="dtb-arrow-accent"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className={styles.fillAccent} />
        </marker>
      </defs>

      <text className={styles.tag} x="0" y="14">
        Two positions, one market
      </text>
      <text className={styles.tag} x="720" y="14" textAnchor="end">
        Fictional scenario
      </text>

      {/* ---- Position A: sell seats ---- */}
      <rect className={styles.panel} x="0.5" y="40.5" width="207" height="252" />
      <text className={styles.tag} x="16" y="70">
        Position A
      </text>
      <text className={styles.label} x="16" y="96">
        Sell seats
      </text>
      {SEAT_ROWS.map((row) =>
        SEAT_COLUMNS.map((column) => (
          <rect
            key={`seat-${row}-${column}`}
            className={styles.fillRule}
            x={16 + column * 40}
            y={116 + row * 28}
            width={32}
            height={20}
          />
        )),
      )}
      <text className={styles.meta} x="16" y="222">
        Priced per team, per year
      </text>
      <text className={styles.meta} x="16" y="244">
        Support cost rises with each team
      </text>
      <text className={styles.fine} x="16" y="274">
        Installed base is the advantage
      </text>

      {/* ---- The market ---- */}
      <text className={styles.tag} x="360" y="70" textAnchor="middle">
        Every quarter, each segment chooses
      </text>

      <rect className={styles.panel} x="240.5" y="86.5" width="239" height="82" />
      <text className={styles.label} x="360" y="120" textAnchor="middle">
        800 small teams
      </text>
      <text className={styles.fine} x="360" y="144" textAnchor="middle">
        Price sensitive, cheap to switch
      </text>

      <rect className={styles.panel} x="240.5" y="184.5" width="239" height="82" />
      <text className={styles.label} x="360" y="218" textAnchor="middle">
        200 enterprise teams
      </text>
      <text className={styles.fine} x="360" y="242" textAnchor="middle">
        Reliability first, costly to switch
      </text>

      {[127, 225].map((y) => (
        <g key={`flow-${y}`}>
          <line
            className={styles.stroke}
            x1="212"
            y1={y}
            x2="236"
            y2={y}
            markerStart="url(#dtb-arrow)"
            markerEnd="url(#dtb-arrow)"
          />
          <line
            className={styles.stroke}
            x1="484"
            y1={y}
            x2="508"
            y2={y}
            markerStart="url(#dtb-arrow)"
            markerEnd="url(#dtb-arrow)"
          />
        </g>
      ))}

      {/* ---- Position B: sell completed work ---- */}
      <rect
        className={styles.panel}
        x="512.5"
        y="40.5"
        width="207"
        height="252"
      />
      <line
        className={styles.strokeAccent}
        x1="512.5"
        y1="40.5"
        x2="512.5"
        y2="292.5"
      />
      <text className={styles.tagAccent} x="528" y="70">
        Position B
      </text>
      <text className={styles.label} x="528" y="96">
        Sell completed work
      </text>
      {BUNDLE_WIDTHS.map((width, index) => (
        <rect
          key={`bundle-${index}`}
          className={styles.fillAccent}
          fillOpacity={0.85 - index * 0.25}
          x={528}
          y={116 + index * 28}
          width={width}
          height={20}
        />
      ))}
      <text className={styles.meta} x="528" y="222">
        Priced per delivered bundle
      </text>
      <text className={styles.meta} x="528" y="244">
        Cost falls as delivery automates
      </text>
      <text className={styles.fine} x="528" y="274">
        Unit cost is the advantage
      </text>

      {/* ---- Four quarterly commitments ---- */}
      <text className={styles.tag} x="0" y="342">
        Four quarterly commitments
      </text>
      <line className={styles.hairline} x1="16" y1="384" x2="704" y2="384" />

      {QUARTERS.map((quarter, index) => {
        const x = 100 + index * 140;
        return (
          <g key={quarter}>
            <circle className={styles.fillInk} cx={x} cy="384" r="6" />
            <text className={styles.meta} x={x} y="410" textAnchor="middle">
              {quarter}
            </text>
          </g>
        );
      })}
      <circle
        className={styles.panelAccent}
        style={{ fill: "var(--paper)" }}
        cx="660"
        cy="384"
        r="9"
      />
      <text className={styles.meta} x="660" y="410" textAnchor="middle">
        Result
      </text>

      <text className={styles.meta} x="16" y="366">
        Commit one move, reveal the opponent&rsquo;s, resolve from stated rules
      </text>

      <path
        className={styles.strokeAccent}
        d="M 660 398 C 660 460, 100 460, 100 398"
        markerEnd="url(#dtb-arrow-accent)"
      />
      <text className={styles.fine} x="380" y="480" textAnchor="middle">
        Then switch sides and attack the strategy you just recorded
      </text>
    </svg>
  );
}
