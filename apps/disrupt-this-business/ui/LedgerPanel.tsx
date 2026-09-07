import type { GameState, Role } from "@/domain/schema";
import { SEGMENT_IDS, TRAIT_IDS } from "@/domain/schema";
import { freeCapacity } from "@/domain/engine";
import { formatCustomers, formatMoney, formatTrait } from "@/ui/format";

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div className="metric-row">
      <dt>{label}</dt>
      <dd data-tone={tone}>{value}</dd>
    </div>
  );
}

/**
 * The compact business ledger that sits beside the decision.
 * Figures use a fixed-width column so a changing number causes no layout shift.
 */
export function LedgerPanel({
  state,
  playerRole,
  quarter,
}: {
  state: GameState;
  playerRole: Role;
  quarter: number;
}) {
  const roles: Role[] = ["incumbent", "challenger"];
  return (
    <div>
      {roles.map((role) => {
        const company = state.companies[role];
        const last = company.ledger[company.ledger.length - 1];
        return (
          <section className="ledger-company" data-role={role} key={role}>
            <h3>
              <span className={`tag tag--${role}`}>
                {role === "incumbent" ? "Incumbent" : "Challenger"}
              </span>{" "}
              {company.name}
              {role === playerRole ? (
                <span className="muted small"> — you</span>
              ) : null}
            </h3>
            <dl className="definition-list" style={{ marginTop: "0.4rem" }}>
              <Metric
                label="Cash"
                value={formatMoney(company.cash)}
                tone={company.cash < 0 ? "danger" : undefined}
              />
              <Metric
                label={last ? `Q${last.quarter} revenue` : "Revenue"}
                value={last ? formatMoney(last.revenue) : "not yet resolved"}
              />
              <Metric
                label={last ? `Q${last.quarter} operating cash flow` : "Operating cash flow"}
                value={last ? formatMoney(last.operatingCashFlow) : "not yet resolved"}
                tone={last && last.operatingCashFlow < 0 ? "danger" : undefined}
              />
              {SEGMENT_IDS.map((segmentId) => (
                <Metric
                  key={segmentId}
                  label={`${segmentId === "small" ? "Small" : "Enterprise"} teams`}
                  value={formatCustomers(state.customers[segmentId][role])}
                />
              ))}
              {SEGMENT_IDS.map((segmentId) => (
                <Metric
                  key={`price-${segmentId}`}
                  label={`${segmentId === "small" ? "Small" : "Enterprise"} annual price`}
                  value={formatMoney(company.prices[segmentId])}
                />
              ))}
              <Metric
                label={`Free effort in Q${quarter}`}
                value={`${freeCapacity(state, role, quarter)} of ${company.capacityPerQuarter}`}
              />
              {TRAIT_IDS.map((trait) => (
                <Metric
                  key={trait}
                  label={trait.charAt(0).toUpperCase() + trait.slice(1)}
                  value={formatTrait(company.traits[trait])}
                />
              ))}
            </dl>
            {company.fundingRequired ? (
              <p className="notice notice--danger small" style={{ marginTop: "0.6rem" }}>
                Funding required. Ending cash is negative and there is no financing in
                this model, so paid commitments are blocked.
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
