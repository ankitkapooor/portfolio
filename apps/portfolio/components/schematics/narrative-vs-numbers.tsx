import styles from "./schematics.module.css";

const SIGNALS = [
  ["Capital expenditure", "+79.6%"],
  ["Property & equipment", "+52.7%"],
  ["CapEx share of revenue", "+12.03 pp"],
] as const;

export function NarrativeVsNumbersSchematic() {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 720 500"
      aria-hidden="true"
      focusable="false"
    >
      <text className={styles.tag} x="0" y="14">
        Microsoft · 10-K for year ended 30 June 2026
      </text>
      <text className={styles.tag} x="720" y="14" textAnchor="end">
        Public filing example
      </text>

      <rect className={styles.panel} x="0.5" y="40.5" width="330" height="268" />
      <line className={styles.strokeAccent} x1="0.5" y1="40.5" x2="0.5" y2="308.5" />
      <text className={styles.tagAccent} x="22" y="72">Management wrote</text>
      <text className={styles.heading} x="22" y="112">“We continue to identify</text>
      <text className={styles.heading} x="22" y="139">and evaluate opportunities to</text>
      <text className={styles.heading} x="22" y="166">expand our datacenter locations</text>
      <text className={styles.heading} x="22" y="193">and increase server capacity…”</text>
      <line className={styles.hairline} x1="22" y1="222" x2="308" y2="222" />
      <text className={styles.meta} x="22" y="249">Extracted as</text>
      <text className={styles.label} x="22" y="276">Capacity investment</text>
      <text className={styles.fine} x="22" y="296">Label · category · quote · confidence</text>

      <rect className={styles.panel} x="350.5" y="40.5" width="369" height="268" />
      <text className={styles.tag} x="372" y="72">The filings recorded</text>
      {SIGNALS.map(([label, value], index) => {
        const y = 116 + index * 54;
        return (
          <g key={label}>
            <text className={styles.meta} x="372" y={y}>{label}</text>
            <text className={styles.figure} x="696" y={y} textAnchor="end">{value}</text>
            <line className={styles.hairline} x1="372" y1={y + 16} x2="696" y2={y + 16} />
          </g>
        );
      })}
      <text className={styles.fine} x="372" y="288">Normalized from SEC XBRL facts</text>

      <rect className={styles.panel} x="0.5" y="330.5" width="720" height="130" />
      <text className={styles.tag} x="22" y="360">Claim-level evidence</text>
      <text className={styles.heading} x="22" y="405">100</text>
      <text className={styles.meta} x="22" y="431">alignment score</text>

      <line className={styles.hairline} x1="126" y1="354" x2="126" y2="439" />
      <text className={styles.meta} x="150" y="381">0.50 action</text>
      <text className={styles.meta} x="150" y="407">0.30 outcome</text>
      <text className={styles.meta} x="150" y="433">0.20 persistence</text>

      <line className={styles.hairline} x1="320" y1="354" x2="320" y2="439" />
      <text className={styles.label} x="346" y="382">Alignment is arithmetic.</text>
      <text className={styles.meta} x="346" y="410">Analytical confidence stays separate.</text>
      <text className={styles.fine} x="346" y="434">Two other claims in this filing score 48.6.</text>
    </svg>
  );
}
