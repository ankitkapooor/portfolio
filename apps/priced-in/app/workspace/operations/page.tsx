"use client";

import { useAnalysis } from "@/components/analysis-provider";
import { AssumptionsRail } from "@/components/assumptions-rail";
import { formatCount, formatPercent, formatUsd } from "@/domain/format";
import type { OperatingTemplate } from "@/domain/finance/operating";

export default function OperationsPage() {
  const { document: analysis, computation, update } = useAnalysis();
  const scale = computation.assumptions.displayScale;
  const rows = computation.operating;
  const operating = analysis.operating;

  const setTemplate = (template: OperatingTemplate) =>
    update((current) => ({ ...current, operating: { ...current.operating, template } }));

  const setDriver = (index: number, value: number | null) =>
    update((current) => ({
      ...current,
      operating: {
        ...current.operating,
        ...(current.operating.template === "customers"
          ? {
              annualRevenuePerCustomerUsd: current.operating.annualRevenuePerCustomerUsd.map((entry, position) =>
                position === index ? value : entry,
              ),
            }
          : {
              averageRealizedPriceUsd: current.operating.averageRealizedPriceUsd.map((entry, position) =>
                position === index ? value : entry,
              ),
            }),
      },
    }));

  const setMarket = (index: number, value: number | null) =>
    update((current) => ({
      ...current,
      operating: {
        ...current.operating,
        marketRevenueUsd: current.operating.marketRevenueUsd.map((entry, position) => (position === index ? value : entry)),
      },
    }));

  const setMarketDate = (index: number, value: string) =>
    update((current) => ({
      ...current,
      operating: {
        ...current.operating,
        marketAsOf: current.operating.marketAsOf.map((entry, position) => (position === index ? value || null : entry)),
      },
    }));

  const driverValues =
    operating.template === "customers" ? operating.annualRevenuePerCustomerUsd : operating.averageRealizedPriceUsd;
  const driverLabel = operating.template === "customers" ? "Annual revenue per customer" : "Average realized price";
  const requiredLabel = operating.template === "customers" ? "Required customers" : "Required units";

  return (
    <div className="workspace-body">
      <div className="stack">
        <section className="card">
          <p className="eyebrow">Step four</p>
          <h1>What the forecast requires operationally</h1>
          <p className="lede">
            A revenue path is only a claim until you say what has to happen to produce it. Financial statements do not
            reveal customer counts, unit volumes or total market size, so those have to come from you — and where they
            are missing, this page says unavailable rather than inventing a number.
          </p>
        </section>

        {!rows ? (
          <div className="callout callout-alert">
            There is no supported forecast to translate. Fix the valuation inputs first.
          </div>
        ) : (
          <>
            <section className="card">
              <div className="card-title">
                <div>
                  <p className="eyebrow">Template</p>
                  <h2 style={{ marginBottom: 0 }}>Choose a decomposition</h2>
                </div>
                <div className="row">
                  <button
                    type="button"
                    className={operating.template === "customers" ? "button-primary" : undefined}
                    aria-pressed={operating.template === "customers"}
                    onClick={() => setTemplate("customers")}
                  >
                    Customers × revenue per customer
                  </button>
                  <button
                    type="button"
                    className={operating.template === "units" ? "button-primary" : undefined}
                    aria-pressed={operating.template === "units"}
                    onClick={() => setTemplate("units")}
                  >
                    Units × average realized price
                  </button>
                </div>
              </div>
              <p className="note">
                Under fixed pricing, {requiredLabel.toLowerCase()} = forecast revenue ÷ {driverLabel.toLowerCase()}. Leave a
                year blank and it stays unavailable.
              </p>

              <div className="table-scroll" role="region" aria-label="Operating driver inputs" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Year</th>
                      <th scope="col" className="num">Forecast revenue</th>
                      <th scope="col" className="num">{driverLabel} (USD)</th>
                      <th scope="col" className="num">Same-year market revenue (USD {scale})</th>
                      <th scope="col">Market size as of</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.year}>
                        <th scope="row">
                          {row.year}
                          <div className="footnote">{computation.forecastYearEnds[index]}</div>
                        </th>
                        <td className="num">{formatUsd(row.forecastRevenueUsd, scale)}</td>
                        <td className="num">
                          <input
                            type="number"
                            className="num"
                            aria-label={`${driverLabel} for year ${row.year}`}
                            value={driverValues[index] ?? ""}
                            placeholder="not supplied"
                            onChange={(event) =>
                              setDriver(index, event.target.value === "" ? null : Number(event.target.value))
                            }
                          />
                        </td>
                        <td className="num">
                          <input
                            type="number"
                            className="num"
                            aria-label={`Market revenue for year ${row.year}`}
                            value={
                              operating.marketRevenueUsd[index] === null
                                ? ""
                                : (operating.marketRevenueUsd[index] as number) / (scale === "millions" ? 1_000_000 : 1)
                            }
                            placeholder="not supplied"
                            onChange={(event) =>
                              setMarket(
                                index,
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value) * (scale === "millions" ? 1_000_000 : 1),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            aria-label={`Market size date for year ${row.year}`}
                            value={operating.marketAsOf[index] ?? ""}
                            onChange={(event) => setMarketDate(index, event.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="field" style={{ marginTop: "0.75rem" }}>
                <label htmlFor="market-definition">Market definition</label>
                <input
                  id="market-definition"
                  type="text"
                  value={operating.marketDefinition}
                  placeholder="e.g. North American third-party freight brokerage revenue"
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      operating: { ...current.operating, marketDefinition: event.target.value },
                    }))
                  }
                />
                <span className="field-hint">
                  A required share only means something if the market definition and the dates line up with the forecast
                  year.
                </span>
              </div>
            </section>

            <section className="card">
              <p className="eyebrow">Result</p>
              <h2>Operating bridge</h2>
              <div className="table-scroll" role="region" aria-label="Operating bridge results" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Year</th>
                      <th scope="col" className="num">Forecast revenue</th>
                      <th scope="col" className="num">{requiredLabel}</th>
                      <th scope="col" className="num">Required market share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.year}>
                        <th scope="row">{row.year}</th>
                        <td className="num">{formatUsd(row.forecastRevenueUsd, scale)}</td>
                        <td className="num">
                          {row.requiredDriver.available ? (
                            formatCount(row.requiredDriver.value, 0)
                          ) : (
                            <span className="badge">unavailable</span>
                          )}
                          {!row.requiredDriver.available ? (
                            <div className="footnote">{row.requiredDriver.reason}</div>
                          ) : null}
                        </td>
                        <td className="num">
                          {row.requiredMarketShare.available ? (
                            <>
                              {formatPercent(row.requiredMarketShare.share)}
                              {row.requiredMarketShare.exceedsMarket ? (
                                <div>
                                  <span className="badge badge-alert">exceeds the whole market</span>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <span className="badge">unavailable</span>
                              <div className="footnote">{row.requiredMarketShare.reason}</div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.some((row) => row.requiredMarketShare.available && row.requiredMarketShare.exceedsMarket) ? (
                <div className="callout callout-alert" style={{ marginTop: "0.75rem" }}>
                  At least one forecast year requires more revenue than the market you defined contains. That is an
                  inconsistency between the forecast and the market definition, and the chart is not clipped to hide it.
                </div>
              ) : null}

              <p className="footnote" style={{ marginTop: "0.6rem" }}>
                Required share = forecast revenue ÷ same-year market revenue. Both figures must describe the same market
                and the same period.
              </p>
            </section>
          </>
        )}
      </div>

      <AssumptionsRail />
    </div>
  );
}
