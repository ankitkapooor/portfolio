"use client";

import { useEffect, useState } from "react";
import { useAnalysis } from "./analysis-provider";
import { BasisBadge, CountField, DateField, MoneyField, RateField } from "./fields";
import { formatUsd } from "@/domain/format";
import type { AssumptionSet } from "@/domain/analysis/schema";

function useIsWideScreen(): boolean {
  // Starts true so the server-rendered markup contains the rail content.
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 60rem)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return wide;
}

function setAll(length: number, value: number): number[] {
  return new Array<number>(length).fill(value);
}

function describeVector(values: number[]): string | undefined {
  const unique = new Set(values.map((value) => value.toFixed(6)));
  if (unique.size <= 1) return undefined;
  return `Varies by year: ${values.map((value) => `${(value * 100).toFixed(1)}%`).join(", ")}`;
}

export function AssumptionsRail() {
  const { document: analysis, computation, updateAssumptions } = useAnalysis();
  const a = computation.assumptions;
  const scale = a.displayScale;
  const wide = useIsWideScreen();
  const provenance = analysis.provenance;

  const patch = (change: Partial<AssumptionSet>) => updateAssumptions((current) => ({ ...current, ...change }));
  const patchForecast = (change: Partial<AssumptionSet["forecast"]>) =>
    updateAssumptions((current) => ({ ...current, forecast: { ...current.forecast, ...change } }));
  const patchTerminal = (change: Partial<AssumptionSet["terminal"]>) =>
    updateAssumptions((current) => ({ ...current, terminal: { ...current.terminal, ...change } }));
  const patchBridge = (change: Partial<AssumptionSet["bridge"]>) =>
    updateAssumptions((current) => ({ ...current, bridge: { ...current.bridge, ...change } }));

  return (
    <aside className="rail">
      <details className="rail-sheet" open={wide}>
        <summary>Assumptions and inputs</summary>
        <div className="rail-inner">
          <section className="rail-section">
            <p className="eyebrow">Valuation target</p>
            <div className="field">
              <span className="field-label">Target basis</span>
              <select
                value={a.target.mode}
                onChange={(event) =>
                  patch({ target: { ...a.target, mode: event.target.value as "price" | "enterpriseValue" } })
                }
              >
                <option value="price">Market price per share</option>
                <option value="enterpriseValue">Enterprise value directly</option>
              </select>
              <span className="field-hint">A price is optional. An enterprise-value target omits per-share output.</span>
            </div>

            {a.target.mode === "price" ? (
              <>
                <CountField
                  label="Market price per share"
                  badge={<BasisBadge basis={provenance["target.marketPricePerShare"]?.basis ?? "assumed"} />}
                  value={a.target.marketPricePerShare ?? 0}
                  suffix="USD"
                  hint="Manually entered and dated. This release has no live quote feed."
                  onCommit={(value) => patch({ target: { ...a.target, marketPricePerShare: value } })}
                />
                <DateField
                  label="Price as of"
                  value={a.target.priceAsOf ?? ""}
                  onCommit={(value) => patch({ target: { ...a.target, priceAsOf: value } })}
                />
              </>
            ) : (
              <MoneyField
                label="Target enterprise value"
                badge={<BasisBadge basis="assumed" />}
                usd={a.target.enterpriseValueUsd ?? 0}
                scale={scale}
                onCommit={(value) => patch({ target: { ...a.target, enterpriseValueUsd: value } })}
              />
            )}

            <p className="footnote">
              {computation.target.ok
                ? `Target enterprise value ${formatUsd(computation.target.value, scale)}`
                : computation.target.issues[0]?.message}
            </p>
          </section>

          <section className="rail-section">
            <p className="eyebrow">Baseline (year zero)</p>
            <MoneyField
              label="Baseline revenue"
              badge={<BasisBadge basis={provenance["baseline.revenueUsd"]?.basis} />}
              usd={a.baseline.revenueUsd}
              scale={scale}
              hint={provenance["baseline.revenueUsd"]?.sourceLocator ?? provenance["baseline.revenueUsd"]?.note}
              onCommit={(value) => patch({ baseline: { ...a.baseline, revenueUsd: value } })}
            />
            <MoneyField
              label="Baseline operating NWC"
              badge={<BasisBadge basis={provenance["baseline.operatingNwcUsd"]?.basis} />}
              usd={a.baseline.operatingNwcUsd}
              scale={scale}
              hint="Operating assets less operating liabilities. Cash and debt are excluded."
              onCommit={(value) => patch({ baseline: { ...a.baseline, operatingNwcUsd: value } })}
            />
          </section>

          <section className="rail-section">
            <p className="eyebrow">Forecast, {a.forecast.years} years</p>
            <RateField
              label="Annual revenue growth"
              badge={<BasisBadge basis="assumed" />}
              rate={a.forecast.growthRates[0]}
              hint={describeVector(a.forecast.growthRates) ?? "Applies to every forecast year."}
              onCommit={(value) => patchForecast({ growthRates: setAll(a.forecast.years, value) })}
            />
            <details>
              <summary className="field-hint" style={{ cursor: "pointer", marginBottom: "0.5rem" }}>
                Set growth year by year
              </summary>
              {a.forecast.growthRates.map((rate, index) => (
                <RateField
                  key={index}
                  label={`Year ${index + 1} growth`}
                  rate={rate}
                  onCommit={(value) =>
                    patchForecast({
                      growthRates: a.forecast.growthRates.map((existing, position) =>
                        position === index ? value : existing,
                      ),
                    })
                  }
                />
              ))}
            </details>
            <RateField
              label="Starting operating margin"
              badge={<BasisBadge basis={provenance["forecast.startingMargin"]?.basis} />}
              rate={a.forecast.startingMargin}
              hint="Year zero margin. The path to the target margin is linear."
              onCommit={(value) => patchForecast({ startingMargin: value })}
            />
            <RateField
              label={`Year ${a.forecast.years} operating margin`}
              badge={<BasisBadge basis="assumed" />}
              rate={a.forecast.targetMargin}
              onCommit={(value) => patchForecast({ targetMargin: value })}
            />
            <RateField
              label="Cash tax rate"
              badge={<BasisBadge basis="assumed" />}
              rate={a.forecast.taxRate}
              hint="Cash tax is max(EBIT, 0) times this rate. No loss carryforward is modelled."
              onCommit={(value) => patchForecast({ taxRate: Math.min(1, Math.max(0, value)) })}
            />
          </section>

          <section className="rail-section">
            <p className="eyebrow">Capital intensity</p>
            <RateField
              label="D&A as a share of revenue"
              badge={<BasisBadge basis={provenance["forecast.daRatios"]?.basis} />}
              rate={a.forecast.daRatios[0]}
              hint={describeVector(a.forecast.daRatios)}
              onCommit={(value) => patchForecast({ daRatios: setAll(a.forecast.years, value) })}
            />
            <RateField
              label="Capex as a share of revenue"
              badge={<BasisBadge basis={provenance["forecast.capexRatios"]?.basis} />}
              rate={a.forecast.capexRatios[0]}
              hint={describeVector(a.forecast.capexRatios)}
              onCommit={(value) => patchForecast({ capexRatios: setAll(a.forecast.years, value) })}
            />
            <RateField
              label="Operating NWC as a share of revenue"
              badge={<BasisBadge basis={provenance["forecast.nwcRatios"]?.basis} />}
              rate={a.forecast.nwcRatios[0]}
              hint={describeVector(a.forecast.nwcRatios) ?? "Growth pulls working capital with it. There is no cost-free growth switch."}
              onCommit={(value) => patchForecast({ nwcRatios: setAll(a.forecast.years, value) })}
            />
          </section>

          <section className="rail-section">
            <p className="eyebrow">Discounting and terminal period</p>
            <RateField
              label="WACC"
              badge={<BasisBadge basis={provenance["terminal.wacc"]?.basis} />}
              rate={a.terminal.wacc}
              hint="Entered by you. Not derived from a beta or a bond yield."
              onCommit={(value) => patchTerminal({ wacc: value })}
            />
            <RateField
              label="Terminal growth"
              badge={<BasisBadge basis="assumed" />}
              rate={a.terminal.terminalGrowth}
              hint="Must be zero or positive and below WACC."
              onCommit={(value) => patchTerminal({ terminalGrowth: value })}
            />
            <RateField
              label="Terminal ROIC"
              badge={<BasisBadge basis="assumed" />}
              rate={a.terminal.terminalRoic}
              hint="Must exceed terminal growth. Sets terminal reinvestment."
              onCommit={(value) => patchTerminal({ terminalRoic: value })}
            />
          </section>

          <section className="rail-section">
            <p className="eyebrow">Equity bridge, as of {a.bridgeAsOf}</p>
            <MoneyField
              label="Excess cash"
              badge={<BasisBadge basis={provenance["bridge.excessCashUsd"]?.basis} />}
              usd={a.bridge.excessCashUsd}
              scale={scale}
              hint={provenance["bridge.excessCashUsd"]?.note ?? "Excess cash only. Required operating cash stays out."}
              onCommit={(value) => patchBridge({ excessCashUsd: value })}
            />
            <MoneyField
              label="Required operating cash"
              badge={<BasisBadge basis="assumed" />}
              usd={a.requiredOperatingCashUsd}
              scale={scale}
              hint="Recorded for disclosure. It is excluded from the bridge, not subtracted twice."
              onCommit={(value) => patch({ requiredOperatingCashUsd: value })}
            />
            <MoneyField
              label="Non-operating assets"
              badge={<BasisBadge basis="assumed" />}
              usd={a.bridge.nonOperatingAssetsUsd}
              scale={scale}
              onCommit={(value) => patchBridge({ nonOperatingAssetsUsd: value })}
            />
            <MoneyField
              label="Financial debt"
              badge={<BasisBadge basis={provenance["bridge.financialDebtUsd"]?.basis} />}
              usd={a.bridge.financialDebtUsd}
              scale={scale}
              hint="Operating lease liabilities are not included under the P0 convention."
              onCommit={(value) => patchBridge({ financialDebtUsd: value })}
            />
            <MoneyField
              label="Preferred equity"
              badge={<BasisBadge basis="assumed" />}
              usd={a.bridge.preferredEquityUsd}
              scale={scale}
              onCommit={(value) => patchBridge({ preferredEquityUsd: value })}
            />
            <MoneyField
              label="Minority interest"
              badge={<BasisBadge basis="assumed" />}
              usd={a.bridge.minorityInterestUsd}
              scale={scale}
              onCommit={(value) => patchBridge({ minorityInterestUsd: value })}
            />
            <CountField
              label="Reviewed diluted shares"
              badge={<BasisBadge basis={provenance["bridge.dilutedShares"]?.basis} />}
              value={a.bridge.dilutedShares}
              suffix="shares"
              hint={a.sharesBasis}
              onCommit={(value) => patchBridge({ dilutedShares: value })}
            />
            <DateField label="Shares as of" value={a.sharesAsOf} onCommit={(value) => patch({ sharesAsOf: value })} />
          </section>

          <section className="rail-section">
            <p className="eyebrow">Expectations map bounds</p>
            <RateField
              label="Lowest growth on the map"
              rate={a.mapBounds.growthMin}
              onCommit={(value) => patch({ mapBounds: { ...a.mapBounds, growthMin: value } })}
            />
            <RateField
              label="Highest growth on the map"
              rate={a.mapBounds.growthMax}
              onCommit={(value) => patch({ mapBounds: { ...a.mapBounds, growthMax: value } })}
            />
            <RateField
              label="Lowest margin on the map"
              rate={a.mapBounds.marginMin}
              onCommit={(value) => patch({ mapBounds: { ...a.mapBounds, marginMin: value } })}
            />
            <RateField
              label="Highest margin on the map"
              rate={a.mapBounds.marginMax}
              onCommit={(value) => patch({ mapBounds: { ...a.mapBounds, marginMax: value } })}
            />
            <p className="footnote">These are interface ranges for exploration, not a company forecast.</p>
          </section>

          <section className="rail-section">
            <p className="eyebrow">Dates</p>
            <DateField label="Analysis as of" value={a.asOfDate} onCommit={(value) => patch({ asOfDate: value })} />
            <DateField label="Bridge as of" value={a.bridgeAsOf} onCommit={(value) => patch({ bridgeAsOf: value })} />
          </section>
        </div>
      </details>
    </aside>
  );
}
