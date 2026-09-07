import { familyBreakdown } from "@/lib/reports";
import { DataModeBadge } from "./Badges";

/**
 * Where the method fails, by case family (BRD section 4, section 6).
 *
 * Omission and commission are separate columns on purpose: a method that misses
 * everything and a method that invents things fail in ways a buyer weighs
 * differently, and one column cannot express both.
 */
export function FailureTable() {
  const families = familyBreakdown("held-out");

  return (
    <section className="resultsBlock" aria-labelledby="failure-table-heading">
      <header className="resultsHeader">
        <h3 id="failure-table-heading">Failures by case family, held-out split</h3>
        <DataModeBadge mode="recorded-experiment" />
      </header>

      <div className="tableScroll">
        <table className="table">
          <caption>
            Two held-out cases per family. Missed items are failures of omission;
            invented items are failures of commission.
          </caption>
          <thead>
            <tr>
              <th scope="col">Case family</th>
              <th scope="col">Actions recovered</th>
              <th scope="col">Owners correct</th>
              <th scope="col">Decisions missed</th>
              <th scope="col">Items invented</th>
              <th scope="col">Critical defects</th>
            </tr>
          </thead>
          <tbody>
            {families.map((family) => {
              const invented =
                family.counts.inventedOwner + family.counts.decisionsInvented;
              return (
                <tr key={family.family}>
                  <th scope="row">{family.label}</th>
                  <td className="numeric">
                    {family.counts.matchedActions} of {family.counts.goldActions}
                  </td>
                  <td className="numeric">
                    {family.counts.ownerDenominator === 0
                      ? "N/A"
                      : `${family.counts.ownerCorrect} of ${family.counts.ownerDenominator}`}
                  </td>
                  <td className="numeric">
                    {family.counts.decisionsMissed} of{" "}
                    {family.counts.goldDecisions}
                  </td>
                  <td className="numeric">{invented}</td>
                  <td className="numeric">{family.criticalDefects}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="measure resultsIntro">
        &ldquo;N/A&rdquo; in the owner column means no matched action in that family
        has a named gold owner, so there is nothing to be accurate about. It is not
        a score of zero.
      </p>
    </section>
  );
}
