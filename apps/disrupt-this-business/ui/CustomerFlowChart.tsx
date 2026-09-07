import { formatCustomers } from "@/ui/format";

export interface CustomerFlowRow {
  segmentId: string;
  label: string;
  incumbent: number;
  challenger: number;
  outside: number;
}

const WIDTH = 640;
const ROW_HEIGHT = 62;
const PAD = { top: 16, right: 12, bottom: 8, left: 128 };

/**
 * Where each segment's teams sit at the end of a quarter.
 *
 * Each band is distinguished by colour, by a fill pattern, and by an in-place
 * text label, so the chart still reads without colour perception.
 */
export function CustomerFlowChart({
  rows,
  id,
  incumbentName,
  challengerName,
}: {
  rows: CustomerFlowRow[];
  id: string;
  incumbentName: string;
  challengerName: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="muted small" role="status">
        No customer mix to show yet.
      </p>
    );
  }

  const height = PAD.top + PAD.bottom + rows.length * ROW_HEIGHT;
  const barWidth = WIDTH - PAD.left - PAD.right;

  const bands = [
    {
      key: "incumbent" as const,
      name: incumbentName,
      colour: "var(--incumbent)",
      fill: `url(#${id}-solid)`,
      pattern: "solid",
    },
    {
      key: "challenger" as const,
      name: challengerName,
      colour: "var(--challenger)",
      fill: `url(#${id}-hatch)`,
      pattern: "diagonal hatching",
    },
    {
      key: "outside" as const,
      name: "Outside option",
      colour: "var(--outside)",
      fill: `url(#${id}-dots)`,
      pattern: "dotted",
    },
  ];

  const description = rows
    .map(
      (row) =>
        `${row.label}: ${formatCustomers(row.incumbent)} with ${incumbentName}, ${formatCustomers(
          row.challenger,
        )} with ${challengerName}, ${formatCustomers(row.outside)} outside`,
    )
    .join(". ");

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>Customer mix by segment</title>
        <desc id={`${id}-desc`}>{description}. The full figures are in the table below.</desc>

        <defs>
          <pattern id={`${id}-solid`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="var(--incumbent)" />
          </pattern>
          <pattern
            id={`${id}-hatch`}
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="7" height="7" fill="var(--challenger)" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--surface)" strokeWidth="2.6" />
          </pattern>
          <pattern id={`${id}-dots`} width="7" height="7" patternUnits="userSpaceOnUse">
            <rect width="7" height="7" fill="var(--outside-soft)" />
            <circle cx="3.5" cy="3.5" r="1.5" fill="var(--outside)" />
          </pattern>
        </defs>

        {rows.map((row, rowIndex) => {
          const total = row.incumbent + row.challenger + row.outside || 1;
          const top = PAD.top + rowIndex * ROW_HEIGHT;
          let offset = 0;
          return (
            <g key={row.segmentId}>
              <text className="chart-series-label" x={0} y={top + 20} fill="var(--ink)">
                {row.label}
              </text>
              <text className="chart-label" x={0} y={top + 36}>
                {formatCustomers(total)} teams
              </text>
              {bands.map((band) => {
                const value = row[band.key];
                const width = (value / total) * barWidth;
                const x = PAD.left + offset;
                offset += width;
                return (
                  <g key={band.key}>
                    <rect
                      x={x}
                      y={top}
                      width={Math.max(width, 0)}
                      height={30}
                      fill={band.fill}
                      stroke="var(--surface)"
                      strokeWidth={1}
                    />
                    {width > 58 ? (
                      <text
                        className="chart-label"
                        x={x + 6}
                        y={top + 45}
                        fill="var(--ink-2)"
                      >
                        {formatCustomers(value)}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      <ul className="chart-legend">
        {bands.map((band) => (
          <li key={band.key}>
            <svg aria-hidden="true" viewBox="0 0 34 12">
              <rect
                x="1"
                y="1"
                width="32"
                height="10"
                fill={band.fill}
                stroke="var(--rule-strong)"
              />
            </svg>
            <span>
              {band.name} ({band.pattern})
            </span>
          </li>
        ))}
      </ul>

      <details className="chart-data">
        <summary>Show the figures behind this chart</summary>
        <div className="table-scroll">
          <table className="data">
            <caption>Customer equivalents by segment and current supplier</caption>
            <thead>
              <tr>
                <th scope="col">Segment</th>
                <th scope="col" className="n">
                  {incumbentName}
                </th>
                <th scope="col" className="n">
                  {challengerName}
                </th>
                <th scope="col" className="n">
                  Outside option
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.segmentId}>
                  <th scope="row">{row.label}</th>
                  <td className="n">{formatCustomers(row.incumbent)}</td>
                  <td className="n">{formatCustomers(row.challenger)}</td>
                  <td className="n">{formatCustomers(row.outside)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
