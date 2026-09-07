import type { Metadata } from "next";
import Link from "next/link";
import {
  ANALYSIS_STATUS,
  analysisSections,
  referenceRuns,
} from "@/content/analysis";
import { buildLedger } from "@/domain/portability";
import { snapshotHash } from "@/domain/engine";
import { findAction } from "@/domain/engine";
import { AssumptionNotice } from "@/ui/AssumptionNotice";
import { formatCustomers, formatMoney } from "@/ui/format";

export const metadata: Metadata = {
  title: "Analysis",
  description:
    "An explicitly labelled illustrative draft analysis of the seed scenario, grounded in two reproducible model runs.",
};

export default function AnalysisPage() {
  const runs = referenceRuns();
  const sections = analysisSections(runs);

  return (
    <div className="stack">
      <header>
        <p className="eyebrow">
          Analysis <span className="tag tag--draft">Status: {ANALYSIS_STATUS}</span>
        </p>
        <h1>Which clock runs out first for the incumbent?</h1>
      </header>

      <aside className="notice notice--danger" aria-label="Provenance">
        <p>
          <strong>Illustrative draft, not an authored publication.</strong> This analysis
          was written by the implementation agent as a worked example of the format the
          finished piece should take. It is not Ankit Kapoor&apos;s interpretation, it
          does not draw on his experience, and it reports no playtest: no playtests have
          been run. It reasons only about the fictional scenario in this build. Before it
          could carry an author&apos;s name it would need to be rewritten by that author,
          and its status changed from draft to published.
        </p>
      </aside>

      <AssumptionNotice compact />

      {sections.map((section) => (
        <section className="section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </section>
      ))}

      <section className="section" aria-labelledby="runs-heading">
        <h2 id="runs-heading">The model runs this analysis cites</h2>
        <p className="small muted">
          These are not stored results. Both runs are recomputed by the real engine every
          time this page renders, from the fixed action sequences shown. Play the same
          sequence as the incumbent under the reliability-shock preset and you will get the
          same ledger.
        </p>

        {runs.map((reference) => {
          const ledger = buildLedger(reference.run);
          return (
            <article className="card" key={reference.id} style={{ marginTop: "1rem" }}>
              <p className="eyebrow">
                run <span className="num">{reference.id}</span> — snapshot{" "}
                <span className="num">{snapshotHash(reference.run.state)}</span>
              </p>
              <h3>{reference.title}</h3>
              <p className="small">{reference.premise}</p>
              <p className="small">
                <strong>Action sequence:</strong>{" "}
                {reference.script
                  .map(
                    (actionId, index) =>
                      `Q${index + 1} ${findAction(reference.run.state, actionId).label}`,
                  )
                  .join(" → ")}
              </p>
              <div className="table-scroll">
                <table className="data">
                  <caption>
                    {reference.run.state.companies.incumbent.name} ledger, in USD
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Quarter</th>
                      <th scope="col">Opponent move</th>
                      <th scope="col" className="n">
                        Revenue
                      </th>
                      <th scope="col" className="n">
                        Operating cash flow
                      </th>
                      <th scope="col" className="n">
                        Ending cash
                      </th>
                      <th scope="col" className="n">
                        Enterprise teams
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((row, index) => (
                      <tr key={row.quarter}>
                        <th scope="row">Q{row.quarter}</th>
                        <td className="small">
                          {reference.run.rounds[index]?.opponentAction ?? "-"}
                        </td>
                        <td className="n">{formatMoney(row.incumbent.revenue)}</td>
                        <td className="n">
                          {formatMoney(row.incumbent.operatingCashFlow)}
                        </td>
                        <td className="n">{formatMoney(row.incumbent.endingCash)}</td>
                        <td className="n">
                          {formatCustomers(row.incumbent.customers.enterprise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })}
      </section>

      <section className="section">
        <h2>Evidence status</h2>
        <p>
          Illustrative. The evidence behind this page consists of the playable product, the
          documented rules, and the two reproducible runs above. There are no observed
          playtests, no usage statistics and no user counts, because none have been
          collected. If any are added later they will be reported with their sample size.
        </p>
        <div className="btn-row">
          <Link className="btn" href="/play">
            Try to beat these runs
          </Link>
          <Link className="btn btn--secondary" href="/methodology">
            Check the parameters
          </Link>
        </div>
      </section>
    </div>
  );
}
