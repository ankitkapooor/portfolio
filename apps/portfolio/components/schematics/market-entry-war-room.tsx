import styles from "./schematics.module.css";

const WEIGHTS = [
  ["Market size", 22, 94],
  ["Affluence", 33, 93],
  ["Growth", 22, 74],
  ["Customer fit", 22, 99],
] as const;

const MARKETS = [
  ["01", "Austin–Round Rock", "TX", "90.5"],
  ["02", "Raleigh–Cary", "NC", "90.2"],
  ["03", "Dallas–Fort Worth", "TX", "89.2"],
  ["04", "Provo–Orem", "UT", "86.9"],
] as const;

export function MarketEntryWarRoomSchematic() {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 720 500"
      aria-hidden="true"
      focusable="false"
    >
      <text className={styles.tag} x="0" y="14">
        Premium fitness · built-in scenario
      </text>
      <text className={styles.tag} x="720" y="14" textAnchor="end">
        ACS 2024 / 2019 · 393 metros
      </text>

      <rect className={styles.panel} x="0.5" y="40.5" width="214" height="420" />
      <text className={styles.heading} x="18" y="72">
        Assumptions
      </text>
      <text className={styles.fine} x="18" y="94">
        Editable · effective weight shown
      </text>

      {WEIGHTS.map(([label, weight], index) => {
        const y = 132 + index * 58;
        return (
          <g key={label}>
            <text className={styles.meta} x="18" y={y}>
              {label}
            </text>
            <text className={styles.figure} x="196" y={y} textAnchor="end">
              {weight}%
            </text>
            <rect className={styles.fillRule} x="18" y={y + 13} width="178" height="5" />
            <rect
              className={styles.fillAccent}
              x="18"
              y={y + 13}
              width={Math.max(20, weight * 4.6)}
              height="5"
            />
          </g>
        );
      })}

      <rect className={styles.panelAccent} x="18.5" y="372.5" width="178" height="66" />
      <text className={styles.tagAccent} x="30" y="396">
        Model warning
      </text>
      <text className={styles.fine} x="30" y="417">
        Competition unavailable;
      </text>
      <text className={styles.fine} x="30" y="433">
        weight redistributed, not zeroed.
      </text>

      <text className={styles.tagAccent} x="244" y="66">
        Scenario result
      </text>
      <text className={styles.heading} x="244" y="96">
        Austin–Round Rock ranks first
      </text>
      <text className={styles.meta} x="244" y="119">
        Under these assumptions · 0.3 ahead of Raleigh–Cary
      </text>

      <rect className={styles.panel} x="244.5" y="140.5" width="458" height="150" />
      <text className={styles.tag} x="262" y="168">
        Market ranking
      </text>
      {MARKETS.map(([rank, market, state, score], index) => {
        const y = 198 + index * 25;
        return (
          <g key={market}>
            <text className={styles.fine} x="262" y={y}>{rank}</text>
            <text className={styles.meta} x="295" y={y}>{market}</text>
            <text className={styles.fine} x="580" y={y}>{state}</text>
            <text className={styles.figure} x="682" y={y} textAnchor="end">{score}</text>
            {index < MARKETS.length - 1 ? (
              <line className={styles.hairline} x1="262" y1={y + 9} x2="684" y2={y + 9} />
            ) : null}
          </g>
        );
      })}

      <rect className={styles.panel} x="244.5" y="310.5" width="278" height="150" />
      <text className={styles.tag} x="262" y="338">Factor contributions</text>
      {WEIGHTS.map(([label, , score], index) => {
        const y = 366 + index * 22;
        return (
          <g key={label}>
            <text className={styles.fine} x="262" y={y}>{label}</text>
            <rect className={styles.fillRule} x="364" y={y - 10} width="116" height="8" />
            <rect className={styles.fillAccent} x="364" y={y - 10} width={score * 1.16} height="8" />
            <text className={styles.figure} x="505" y={y} textAnchor="end">{score}</text>
          </g>
        );
      })}

      <rect className={styles.panel} x="542.5" y="310.5" width="160" height="150" />
      <text className={styles.tag} x="560" y="338">Raw evidence</text>
      <text className={styles.meta} x="560" y="370">Population</text>
      <text className={styles.figure} x="684" y="370" textAnchor="end">2.55M</text>
      <text className={styles.meta} x="560" y="399">Income</text>
      <text className={styles.figure} x="684" y="399" textAnchor="end">$99.9K</text>
      <text className={styles.meta} x="560" y="428">Pop. growth</text>
      <text className={styles.figure} x="684" y="428" textAnchor="end">+14.5%</text>
      <text className={styles.fine} x="560" y="449">US Census ACS 2024</text>
    </svg>
  );
}
