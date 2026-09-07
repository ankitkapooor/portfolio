"use client";

import { useMemo, useState } from "react";
import type { GridCell, GridResult } from "@/domain/finance/grid";
import { formatPercent, formatUsd } from "@/domain/format";
import type { Scale } from "@/domain/intake/metrics";

const BANDS = [
  { limit: -0.25, fill: "var(--gap-neg-3)", label: "25% or more below target" },
  { limit: -0.1, fill: "var(--gap-neg-2)", label: "10% to 25% below" },
  { limit: -0.01, fill: "var(--gap-neg-1)", label: "1% to 10% below" },
  { limit: 0.01, fill: "var(--gap-zero)", label: "Within 1% of target" },
  { limit: 0.1, fill: "var(--gap-pos-1)", label: "1% to 10% above" },
  { limit: 0.25, fill: "var(--gap-pos-2)", label: "10% to 25% above" },
  { limit: Infinity, fill: "var(--gap-pos-3)", label: "25% or more above target" },
];

function bandFor(percentGap: number): (typeof BANDS)[number] {
  return BANDS.find((band) => percentGap <= band.limit) ?? BANDS[BANDS.length - 1];
}

const PLOT = { left: 62, top: 12, right: 12, bottom: 46, width: 620, height: 500 };

interface Props {
  grid: GridResult;
  scale: Scale;
  stale: boolean;
  selected: { growthIndex: number; marginIndex: number } | null;
  onSelect: (growthIndex: number, marginIndex: number) => void;
}

export function ExpectationsMap({ grid, scale, stale, selected, onSelect }: Props) {
  const [showTable, setShowTable] = useState(false);
  const steps = grid.steps;
  const innerWidth = PLOT.width - PLOT.left - PLOT.right;
  const innerHeight = PLOT.height - PLOT.top - PLOT.bottom;
  const cellWidth = innerWidth / steps;
  const cellHeight = innerHeight / steps;

  const cellAt = (growthIndex: number, marginIndex: number): GridCell | undefined =>
    grid.cells[marginIndex * steps + growthIndex];

  const selectedCell = selected ? cellAt(selected.growthIndex, selected.marginIndex) : undefined;

  const tickIndexes = useMemo(() => {
    const every = Math.max(1, Math.round(steps / 8));
    const out: number[] = [];
    for (let i = 0; i < steps; i += every) out.push(i);
    if (out[out.length - 1] !== steps - 1) out.push(steps - 1);
    return out;
  }, [steps]);

  const move = (deltaGrowth: number, deltaMargin: number) => {
    const current = selected ?? { growthIndex: Math.floor(steps / 2), marginIndex: Math.floor(steps / 2) };
    const growthIndex = Math.min(steps - 1, Math.max(0, current.growthIndex + deltaGrowth));
    const marginIndex = Math.min(steps - 1, Math.max(0, current.marginIndex + deltaMargin));
    onSelect(growthIndex, marginIndex);
  };

  return (
    <div className="map-frame">
      <div className="card-title">
        <div>
          <p className="eyebrow">Expectations map</p>
          <h3 style={{ marginBottom: 0 }}>Combinations consistent with this target under the other assumptions shown</h3>
        </div>
        <div className="row">
          {stale ? <span className="badge badge-stale">Previous run, recomputing</span> : null}
          <button type="button" onClick={() => setShowTable((current) => !current)} aria-expanded={showTable}>
            {showTable ? "Hide data table" : "Show data table"}
          </button>
        </div>
      </div>

      <svg
        className="map-svg"
        viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
        role="img"
        tabIndex={0}
        aria-label={`Value gap for ${steps} growth rates by ${steps} year-five margins. Use the arrow keys to move the selection, or open the data table below.`}
        onKeyDown={(event) => {
          const keys: Record<string, [number, number]> = {
            ArrowRight: [1, 0],
            ArrowLeft: [-1, 0],
            ArrowUp: [0, 1],
            ArrowDown: [0, -1],
          };
          const delta = keys[event.key];
          if (!delta) return;
          event.preventDefault();
          move(delta[0], delta[1]);
        }}
        style={stale ? { opacity: 0.55 } : undefined}
      >
        <defs>
          <pattern id="unsupported-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--surface-sunken)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--rule-strong)" strokeWidth="2" />
          </pattern>
        </defs>

        {grid.cells.map((cell, index) => {
          const growthIndex = index % steps;
          const marginIndex = Math.floor(index / steps);
          const x = PLOT.left + growthIndex * cellWidth;
          const y = PLOT.top + innerHeight - (marginIndex + 1) * cellHeight;
          const unsupported = cell.percentGap === null;
          const band = unsupported ? null : bandFor(cell.percentGap as number);
          const nearTarget = !unsupported && Math.abs(cell.percentGap as number) <= 0.01;
          const isSelected = selected?.growthIndex === growthIndex && selected?.marginIndex === marginIndex;
          return (
            <rect
              key={index}
              className={`map-cell${isSelected ? " map-cell-selected" : ""}`}
              x={x}
              y={y}
              width={cellWidth + 0.5}
              height={cellHeight + 0.5}
              fill={unsupported ? "url(#unsupported-hatch)" : band?.fill}
              stroke={isSelected ? "var(--ink)" : nearTarget ? "var(--ink)" : undefined}
              strokeWidth={isSelected ? 2 : nearTarget ? 0.8 : undefined}
              strokeDasharray={!isSelected && nearTarget ? "2 2" : undefined}
              onClick={() => onSelect(growthIndex, marginIndex)}
            >
              <title>
                {`Growth ${formatPercent(cell.growth)}, year-five margin ${formatPercent(cell.margin)}: ${
                  unsupported ? `unsupported — ${cell.unsupportedReason}` : `${formatPercent(cell.percentGap)} value gap`
                }`}
              </title>
            </rect>
          );
        })}

        {tickIndexes.map((index) => (
          <text
            key={`gx-${index}`}
            className="map-axis-label"
            x={PLOT.left + index * cellWidth + cellWidth / 2}
            y={PLOT.top + innerHeight + 16}
            textAnchor="middle"
          >
            {formatPercent(grid.growthAxis[index], 0)}
          </text>
        ))}
        {tickIndexes.map((index) => (
          <text
            key={`my-${index}`}
            className="map-axis-label"
            x={PLOT.left - 8}
            y={PLOT.top + innerHeight - index * cellHeight - cellHeight / 2 + 4}
            textAnchor="end"
          >
            {formatPercent(grid.marginAxis[index], 0)}
          </text>
        ))}

        <text
          className="map-axis-title"
          x={PLOT.left + innerWidth / 2}
          y={PLOT.height - 8}
          textAnchor="middle"
        >
          Constant annual revenue growth
        </text>
        <text
          className="map-axis-title"
          transform={`translate(14, ${PLOT.top + innerHeight / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          Year-five operating margin
        </text>
      </svg>

      <ul className="legend">
        {BANDS.map((band) => (
          <li key={band.label} className="legend-item">
            <span className="legend-swatch" style={{ background: band.fill }} aria-hidden />
            {band.label}
          </li>
        ))}
        <li className="legend-item">
          <span className="legend-swatch" style={{ background: "var(--surface-sunken)" }} aria-hidden />
          Unsupported combination (labelled, never coloured as a valid number)
        </li>
      </ul>

      <p className="note" aria-live="polite">
        {selectedCell ? (
          <>
            Selected: growth {formatPercent(selectedCell.growth)}, year-five margin {formatPercent(selectedCell.margin)}.{" "}
            {selectedCell.enterpriseValueUsd === null ? (
              <>Unsupported: {selectedCell.unsupportedReason}</>
            ) : (
              <>
                Modeled enterprise value {formatUsd(selectedCell.enterpriseValueUsd, scale)}, value gap{" "}
                {formatUsd(selectedCell.gapUsd, scale)} ({formatPercent(selectedCell.percentGap)}).
              </>
            )}
          </>
        ) : (
          "No cell selected. Click a cell, or focus the map and use the arrow keys."
        )}
      </p>

      <p className="footnote">
        {grid.nearTargetCount} of {grid.cells.length} combinations land within one percent of the target.{" "}
        {grid.unsupportedCount > 0 ? `${grid.unsupportedCount} are unsupported and are hatched rather than coloured. ` : ""}
        Value gap = modeled enterprise value minus target enterprise value. No single cell is the market&rsquo;s forecast.
      </p>

      {showTable ? (
        <div className="table-scroll" role="region" aria-label="Expectations map as a data table" tabIndex={0} style={{ maxHeight: "26rem", marginTop: "0.75rem" }}>
          <table>
            <caption>
              Percent value gap by constant annual growth (columns) and year-five operating margin (rows). Blank cells are
              unsupported combinations.
            </caption>
            <thead>
              <tr>
                <th scope="col">Margin \ Growth</th>
                {grid.growthAxis.map((growth, index) => (
                  <th key={index} scope="col" className="num">
                    {formatPercent(growth, 2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...grid.marginAxis].map((margin, marginIndex) => (
                <tr key={marginIndex}>
                  <th scope="row" className="num">
                    {formatPercent(margin, 2)}
                  </th>
                  {grid.growthAxis.map((_, growthIndex) => {
                    const cell = cellAt(growthIndex, marginIndex);
                    return (
                      <td key={growthIndex} className="num">
                        {cell?.percentGap === null || cell === undefined ? (
                          <span title={cell?.unsupportedReason ?? "Unsupported"}>unsupported</span>
                        ) : (
                          formatPercent(cell.percentGap, 1)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
