import { formatMoney, formatMoneyShort } from "@/ui/format";

export interface CashChartRow {
  quarter: number;
  incumbent: number;
  challenger: number;
}

const WIDTH = 640;
const HEIGHT = 250;
const PAD = { top: 18, right: 104, bottom: 36, left: 62 };

/**
 * Ending cash by quarter for both companies.
 *
 * Not a decorative gauge: it is a plotted ledger with a text equivalent below.
 * The two series differ by colour, stroke pattern, marker shape and an end
 * label, so colour alone never carries the distinction.
 */
export function CashChart({
  rows,
  id,
  incumbentName,
  challengerName,
}: {
  rows: CashChartRow[];
  id: string;
  incumbentName: string;
  challengerName: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="muted small" role="status">
        No quarters have resolved yet, so there is nothing to plot.
      </p>
    );
  }

  const values = rows.flatMap((r) => [r.incumbent, r.challenger]);
  const rawMax = Math.max(...values, 0);
  const rawMin = Math.min(...values, 0);
  const span = rawMax - rawMin || 1;
  const max = rawMax + span * 0.12;
  const min = rawMin - span * 0.12;

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left + (rows.length === 1 ? plotWidth / 2 : (index / (rows.length - 1)) * plotWidth);
  const y = (value: number) =>
    PAD.top + plotHeight - ((value - min) / (max - min)) * plotHeight;

  const ticks = [min, min + (max - min) / 2, max];
  const series = [
    {
      key: "incumbent" as const,
      name: incumbentName,
      colour: "var(--incumbent)",
      dash: undefined as string | undefined,
      marker: "circle" as const,
    },
    {
      key: "challenger" as const,
      name: challengerName,
      colour: "var(--challenger)",
      dash: "7 4",
      marker: "square" as const,
    },
  ];

  const last = rows[rows.length - 1];
  const description = series
    .map(
      (s) =>
        `${s.name} ends Q${last.quarter} on ${formatMoney(last[s.key])}, starting from ${formatMoney(
          rows[0][s.key],
        )} in Q${rows[0].quarter}`,
    )
    .join(". ");

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>Ending cash by quarter</title>
        <desc id={`${id}-desc`}>{description}. The full figures are in the table below.</desc>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className="chart-grid"
              x1={PAD.left}
              x2={PAD.left + plotWidth}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text className="chart-label" x={PAD.left - 8} y={y(tick) + 3} textAnchor="end">
              {formatMoneyShort(tick)}
            </text>
          </g>
        ))}

        {min < 0 && max > 0 ? (
          <line
            className="chart-axis"
            x1={PAD.left}
            x2={PAD.left + plotWidth}
            y1={y(0)}
            y2={y(0)}
            strokeWidth={1.5}
          />
        ) : null}

        <line
          className="chart-axis"
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={PAD.top + plotHeight}
        />

        {rows.map((row, index) => (
          <text
            key={row.quarter}
            className="chart-label"
            x={x(index)}
            y={HEIGHT - 14}
            textAnchor="middle"
          >
            Q{row.quarter}
          </text>
        ))}

        {series.map((s) => (
          <g key={s.key}>
            <polyline
              fill="none"
              stroke={s.colour}
              strokeWidth={2.5}
              strokeDasharray={s.dash}
              strokeLinejoin="round"
              points={rows.map((row, index) => `${x(index)},${y(row[s.key])}`).join(" ")}
            />
            {rows.map((row, index) =>
              s.marker === "circle" ? (
                <circle
                  key={row.quarter}
                  cx={x(index)}
                  cy={y(row[s.key])}
                  r={4}
                  fill="var(--surface)"
                  stroke={s.colour}
                  strokeWidth={2.5}
                />
              ) : (
                <rect
                  key={row.quarter}
                  x={x(index) - 3.6}
                  y={y(row[s.key]) - 3.6}
                  width={7.2}
                  height={7.2}
                  fill="var(--surface)"
                  stroke={s.colour}
                  strokeWidth={2.5}
                />
              ),
            )}
            <text
              className="chart-series-label"
              x={PAD.left + plotWidth + 10}
              y={y(last[s.key]) + 4}
              fill={s.colour}
            >
              {s.name}
            </text>
          </g>
        ))}
      </svg>

      <ul className="chart-legend">
        {series.map((s) => (
          <li key={s.key}>
            <svg aria-hidden="true" viewBox="0 0 34 12">
              <line
                x1="1"
                y1="6"
                x2="33"
                y2="6"
                stroke={s.colour}
                strokeWidth="2.5"
                strokeDasharray={s.dash}
              />
              {s.marker === "circle" ? (
                <circle cx="17" cy="6" r="4" fill="var(--surface)" stroke={s.colour} strokeWidth="2.5" />
              ) : (
                <rect x="13.4" y="2.4" width="7.2" height="7.2" fill="var(--surface)" stroke={s.colour} strokeWidth="2.5" />
              )}
            </svg>
            <span>
              {s.name} ({s.marker === "circle" ? "solid line, round markers" : "dashed line, square markers"})
            </span>
          </li>
        ))}
      </ul>

      <details className="chart-data">
        <summary>Show the figures behind this chart</summary>
        <div className="table-scroll">
          <table className="data">
            <caption>Ending cash by quarter, in USD</caption>
            <thead>
              <tr>
                <th scope="col">Quarter</th>
                <th scope="col" className="n">
                  {incumbentName}
                </th>
                <th scope="col" className="n">
                  {challengerName}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.quarter}>
                  <th scope="row">Q{row.quarter}</th>
                  <td className="n">{formatMoney(row.incumbent)}</td>
                  <td className="n">{formatMoney(row.challenger)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
