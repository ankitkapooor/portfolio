import type { Metadata } from "next";
import Link from "next/link";
import { ENGINE_VERSION, SEGMENT_IDS, TRAIT_IDS } from "@/domain/schema";
import { defaultScenario } from "@/content/scenarios";
import { formulas, modelLimitations } from "@/content/methodology";
import { OPPONENT_LOOKAHEAD } from "@/domain/opponent";
import { AssumptionNotice } from "@/ui/AssumptionNotice";
import { formatMoney, formatTrait } from "@/ui/format";

export const metadata: Metadata = {
  title: "Model",
  description:
    "Every parameter, formula, opponent rule and limitation behind the exercise.",
};

const RESOLUTION_ORDER = [
  "Activate previously completed projects.",
  "Reveal the scheduled public environment event, exactly once.",
  "Accept both commitments simultaneously, judged against the start-of-decision information.",
  "Deduct investment cash.",
  "Apply immediate actions (price cut, research).",
  "Recalculate traits and prices against their bounds.",
  "Allocate customer transitions.",
  "Recognise quarterly revenue and operating cash costs.",
  "Mark negative ending cash as funding required.",
  "Create the explanation records you see in the ledger.",
];

export default function MethodologyPage() {
  const scenario = defaultScenario;
  const roles = ["incumbent", "challenger"] as const;

  return (
    <div className="stack">
      <header>
        <p className="eyebrow">
          Model — scenario {scenario.id} v{scenario.version}, engine v{ENGINE_VERSION}
        </p>
        <h1>How every number is produced</h1>
        <p className="lede">
          The engine is a set of pure functions with no randomness, no hidden state and no
          language model. Given the same inputs it always produces the same outputs, which
          is why an exported run can be replayed and checked.
        </p>
      </header>

      <AssumptionNotice compact />

      <section className="section" aria-labelledby="params-heading">
        <h2 id="params-heading">Company parameters</h2>
        <div className="table-scroll">
          <table className="data">
            <caption>
              Opening position for both companies. Editable in{" "}
              <code>content/scenarios/relayworks-taskpilot.ts</code>.
            </caption>
            <thead>
              <tr>
                <th scope="col">Parameter</th>
                {roles.map((role) => (
                  <th scope="col" className="n" key={role}>
                    {scenario.companies[role].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Cash</th>
                {roles.map((role) => (
                  <td className="n" key={role}>
                    {formatMoney(scenario.companies[role].cash)}
                  </td>
                ))}
              </tr>
              {SEGMENT_IDS.map((segmentId) => (
                <tr key={`price-${segmentId}`}>
                  <th scope="row">Annual price, {segmentId}</th>
                  {roles.map((role) => (
                    <td className="n" key={role}>
                      {formatMoney(scenario.companies[role].prices[segmentId])}
                    </td>
                  ))}
                </tr>
              ))}
              {SEGMENT_IDS.map((segmentId) => (
                <tr key={`vc-${segmentId}`}>
                  <th scope="row">Variable cost per quarter, {segmentId}</th>
                  {roles.map((role) => (
                    <td className="n" key={role}>
                      {formatMoney(scenario.companies[role].variableCost[segmentId])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">Fixed operating cash cost per quarter</th>
                {roles.map((role) => (
                  <td className="n" key={role}>
                    {formatMoney(scenario.companies[role].fixedCost)}
                  </td>
                ))}
              </tr>
              {TRAIT_IDS.map((trait) => (
                <tr key={trait}>
                  <th scope="row">{trait}</th>
                  {roles.map((role) => (
                    <td className="n" key={role}>
                      {formatTrait(scenario.companies[role].traits[trait])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">Delivery capacity per quarter</th>
                {roles.map((role) => (
                  <td className="n" key={role}>
                    {scenario.companies[role].capacityPerQuarter} effort units
                  </td>
                ))}
              </tr>
              {SEGMENT_IDS.map((segmentId) => (
                <tr key={`cust-${segmentId}`}>
                  <th scope="row">Starting {segmentId} teams</th>
                  {roles.map((role) => (
                    <td className="n" key={role}>
                      {scenario.companies[role].initialCustomers[segmentId]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">
          Traits are dimensionless scenario parameters bounded to [0,1], not empirical
          company scores. An initial reliability of 0.90 is a preference proxy, not a claim
          that 90% of real tasks succeed. Outcomes pricing is a fixed annualised bundle at
          the segment&apos;s assumed usage, so per-seat and per-task prices are only
          comparable after that normalisation.
        </p>
      </section>

      <section className="section" aria-labelledby="segments-heading">
        <h2 id="segments-heading">Segments</h2>
        <div className="table-scroll">
          <table className="data">
            <caption>
              Demand is fixed at {scenario.segments.reduce((s, x) => s + x.size, 0)} teams.
              Segment expansion is a later extension, not an automatic revenue bonus.
            </caption>
            <thead>
              <tr>
                <th scope="col">Parameter</th>
                {scenario.segments.map((segment) => (
                  <th scope="col" className="n" key={segment.id}>
                    {segment.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Teams</th>
                {scenario.segments.map((s) => (
                  <td className="n" key={s.id}>
                    {s.size}
                  </td>
                ))}
              </tr>
              {(["reliability", "automation", "integration", "reach", "price"] as const).map(
                (weight) => (
                  <tr key={weight}>
                    <th scope="row">
                      {weight === "price" ? "price penalty weight" : `${weight} weight`}
                    </th>
                    {scenario.segments.map((s) => (
                      <td className="n" key={s.id}>
                        {s.weights[weight].toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ),
              )}
              <tr>
                <th scope="row">Reference annual price</th>
                {scenario.segments.map((s) => (
                  <td className="n" key={s.id}>
                    {formatMoney(s.referencePrice)}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Relationship bonus</th>
                {scenario.segments.map((s) => (
                  <td className="n" key={s.id}>
                    {s.relationshipBonus.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Quarterly reconsideration rate</th>
                {scenario.segments.map((s) => (
                  <td className="n" key={s.id}>
                    {(s.reconsiderationRate * 100).toFixed(0)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small">
          Outside-option utility {scenario.outsideUtility.toFixed(2)}. Choice temperature{" "}
          {scenario.choiceTemperature.toFixed(2)}. Prices may not fall below{" "}
          {(scenario.priceFloorShare * 100).toFixed(0)}% of the role&apos;s original list
          price.
        </p>
      </section>

      <section className="section" aria-labelledby="catalog-heading">
        <h2 id="catalog-heading">Decision catalog</h2>
        <div className="table-scroll">
          <table className="data">
            <caption>
              One commitment per quarter. The order of this table is the opponent&apos;s
              final tie-break.
            </caption>
            <thead>
              <tr>
                <th scope="col">Commitment</th>
                <th scope="col" className="n">
                  Cash
                </th>
                <th scope="col" className="n">
                  Effort
                </th>
                <th scope="col" className="n">
                  Delay
                </th>
                <th scope="col">Effect</th>
              </tr>
            </thead>
            <tbody>
              {scenario.actions.map((action) => (
                <tr key={action.id}>
                  <th scope="row">{action.label}</th>
                  <td className="n">{formatMoney(action.cash)}</td>
                  <td className="n">{action.effort}</td>
                  <td className="n">
                    {action.delay === 0
                      ? "immediate"
                      : `${action.delay} quarter${action.delay === 1 ? "" : "s"}`}
                  </td>
                  <td>{action.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">
          Outcome-bundle conversion is allowed once per company and already applies to{" "}
          {scenario.companies.challenger.name} at the start, so that role cannot buy it.
          Research is the round&apos;s primary commitment, creating a real opportunity
          cost. Projects completing after Q{scenario.totalRounds} remain in the ledger as
          committed work with no terminal benefit.
        </p>
      </section>

      <section className="section" aria-labelledby="order-heading">
        <h2 id="order-heading">Resolution order</h2>
        <p>
          <code>prepareRound(previousState, environment)</code> performs the first two
          steps and freezes the result. Both sides then choose from that same frozen state.{" "}
          <code>resolveRound(preparedState, playerAction, opponentAction)</code> performs
          the rest and returns the next state plus an ordered event ledger.
        </p>
        <ol>
          {RESOLUTION_ORDER.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="formulas-heading">
        <h2 id="formulas-heading">Formulas and parameters</h2>
        <p className="small muted">
          Each ledger line in the game links to one of these ids.
        </p>
        {formulas.map((formula) => (
          <article className="card" id={formula.id} key={formula.id} style={{ marginTop: "0.7rem" }}>
            <h3>
              <span className="formula-chip">{formula.id}</span> {formula.title}
            </h3>
            <p className="small">{formula.statement}</p>
            {formula.note ? <p className="small muted">{formula.note}</p> : null}
          </article>
        ))}
      </section>

      <section className="section" aria-labelledby="environments-heading">
        <h2 id="environments-heading">Environment presets</h2>
        {scenario.environments.map((environment) => (
          <article className="card" key={environment.id} style={{ marginTop: "0.7rem" }}>
            <h3>{environment.label}</h3>
            <p className="small">{environment.description}</p>
            {environment.disclosedEvents.length > 0 ? (
              <ul className="small">
                {environment.disclosedEvents.map((disclosed) => (
                  <li key={disclosed}>{disclosed}</li>
                ))}
              </ul>
            ) : (
              <p className="small muted">No events. Nothing changes for four quarters.</p>
            )}
          </article>
        ))}
        <p className="small muted">
          The quarter an event fires is deliberately not listed here. It becomes visible
          when the event happens, or a quarter early if you commission research.
        </p>
      </section>

      <section className="section" aria-labelledby="opponent-heading">
        <h2 id="opponent-heading">The opponent</h2>
        <p>
          The P0 opponent is deliberately simple, and it is important that you know how
          simple. Each quarter it:
        </p>
        <ol>
          <li>enumerates its legal actions in the catalog order above;</li>
          <li>
            forecasts up to {OPPONENT_LOOKAHEAD} quarters for each one, assuming you hold
            and no further public events occur;
          </li>
          <li>picks the action with the highest forecast ending cash;</li>
          <li>
            breaks ties on higher ending customer count, and then on catalog order.
          </li>
        </ol>
        <p>
          The look-ahead is clipped to the quarters that remain. The opponent commits from
          the same information snapshot as you: it is handed a public snapshot with your
          research and the hidden event schedule stripped out, so it cannot read your
          unlocked action or see what is coming. It has no memory, no model of you, and no
          notion of long-term positioning. Beating it is not evidence that a strategy is
          good.
        </p>
      </section>

      <section className="section" aria-labelledby="branch-heading">
        <h2 id="branch-heading">Rewind, branching and role reversal</h2>
        <p>
          Rewinding a quarter creates a new run from that pre-decision snapshot. Earlier
          decisions and the external event sequence are preserved, the original run is left
          untouched, and the new run records the original as its parent. The opponent
          policy is recomputed from the branched state rather than replaying its old moves.
        </p>
        <p>
          Switching sides starts a fresh game from the original opening state and
          environment, with your complete recorded action sequence driving the other
          company. Those actions are replayed when legal. When one becomes illegal the
          script holds and states why; it is never silently upgraded to a stronger move.
          That session is labelled a fixed-opponent comparison. Outcomes are only
          comparable within the same scenario, and there is no universal strategy score.
        </p>
      </section>

      <section className="section" aria-labelledby="narration-heading">
        <h2 id="narration-heading">Explanations</h2>
        <p>
          Every explanation in this build is generated from the engine&apos;s own event
          ledger by the rules on this page. There is no AI narration endpoint, no API key
          and no network call, so there is no narration failure that could interrupt play.
          Optional generated dialogue is a later phase; it would sit behind a server
          adapter, would never be able to write to game state, and the rule-based text here
          would remain the fallback.
        </p>
      </section>

      <section className="section" aria-labelledby="limits-heading">
        <h2 id="limits-heading">Limitations</h2>
        <ul>
          {modelLimitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>

      <div className="btn-row">
        <Link className="btn" href="/play">
          Play with these rules
        </Link>
        <Link className="btn btn--secondary" href="/analysis">
          Read the author analysis
        </Link>
      </div>
    </div>
  );
}
