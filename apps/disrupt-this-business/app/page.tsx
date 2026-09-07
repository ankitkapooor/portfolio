import Link from "next/link";
import { defaultScenario } from "@/content/scenarios";
import { AssumptionNotice } from "@/ui/AssumptionNotice";
import { formatMoney } from "@/ui/format";

export default function Home() {
  const incumbent = defaultScenario.companies.incumbent;
  const challenger = defaultScenario.companies.challenger;

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <p className="eyebrow">Competitive strategy exercise</p>
          <h1>Can you protect this business from AI disruption?</h1>
          <p className="lede">
            Run an established software company or the AI challenger attacking it. Four
            quarterly decisions, one commitment each. A deterministic engine resolves
            customer choice, revenue, delivery cost, investment and cash, and shows you
            the arithmetic behind every number.
          </p>
          <div className="btn-row">
            <Link className="btn" href="/play">
              Start with a briefing
            </Link>
            <Link className="btn btn--secondary" href="/methodology">
              Inspect the model
            </Link>
          </div>
          <p className="small muted" style={{ marginTop: "1rem" }}>
            No account, no sign-up, no email. One click to the role choice.
          </p>
        </div>

        <div className="card">
          <h2>How a quarter works</h2>
          <ol className="small">
            <li>Read the public intelligence for the quarter.</li>
            <li>Pick one commitment and preview its cost, capacity, timing and risk.</li>
            <li>Record an optional rationale.</li>
            <li>Lock the decision. Only then does the opponent&apos;s move appear.</li>
            <li>Read the resolution, line by line, with links to the rules.</li>
          </ol>
          <p className="small muted">
            Afterwards you can rewind any decision into a branch, or switch sides and play
            against the strategy you just recorded.
          </p>
        </div>
      </div>

      <AssumptionNotice />

      <section className="section">
        <h2>The two sides</h2>
        <div className="two-col">
          {[incumbent, challenger].map((company) => (
            <article className="card" key={company.role}>
              <p className="eyebrow">
                <span className={`tag tag--${company.role}`}>
                  {company.role === "incumbent" ? "Incumbent" : "Challenger"}
                </span>
              </p>
              <h3>{company.name}</h3>
              <p className="small">{company.proposition}</p>
              <dl className="definition-list small">
                <dt>Opening cash</dt>
                <dd>{formatMoney(company.cash)}</dd>
                <dt>Annual price, small / enterprise team</dt>
                <dd>
                  {formatMoney(company.prices.small)} /{" "}
                  {formatMoney(company.prices.enterprise)}
                </dd>
                <dt>Teams today</dt>
                <dd>
                  {company.initialCustomers.small} small,{" "}
                  {company.initialCustomers.enterprise} enterprise
                </dd>
                <dt>Delivery capacity</dt>
                <dd>{company.capacityPerQuarter} effort units per quarter</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>What the units mean</h2>
        <dl className="definition-list">
          <dt>Contribution</dt>
          <dd>
            Revenue less the variable cost of delivering to those customers. It does not
            include fixed operating cost.
          </dd>
          <dt>Customer retention</dt>
          <dd>
            The share of a supplier&apos;s customers who do not reconsider in a quarter,
            plus those who reconsider and choose the same supplier again.
          </dd>
          <dt>Cash</dt>
          <dd>
            Opening cash minus investment outlays plus operating cash flow. This exercise
            reports operating cash flow, not EBITDA and not audited profit, because the
            model is too simple to deserve either label.
          </dd>
          <dt>Quarter</dt>
          <dd>
            One decision period. Prices are annual per team, so quarterly revenue is the
            annual price divided by four.
          </dd>
        </dl>
      </section>

      <section className="section">
        <h2>Evidence status</h2>
        <p>
          This is a concept prototype. The playable product, its documented rules and its
          exported runs are the evidence. There are no playtest findings, usage
          statistics, or user counts to report, because no playtests have been run. The
          analysis page contains an explicitly labelled illustrative draft rather than
          observed results.
        </p>
      </section>
    </div>
  );
}
