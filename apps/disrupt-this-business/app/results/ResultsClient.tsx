"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { findAction } from "@/domain/engine";
import { closingObservations, customerMix } from "@/domain/explain";
import { buildLedger, exportRunJson, exportRunMarkdown } from "@/domain/portability";
import { getEnvironment, getScenario } from "@/content/scenarios";
import type { GameRun, Role, RoundRecord } from "@/domain/schema";
import { AssumptionNotice } from "@/ui/AssumptionNotice";
import { CashChart } from "@/ui/CashChart";
import { CustomerFlowChart } from "@/ui/CustomerFlowChart";
import { EventLedger } from "@/ui/EventLedger";
import { FormulaLinks } from "@/ui/FormulaLinks";
import { formatCustomers, formatMoney, otherRole } from "@/ui/format";
import { useRunSession } from "@/ui/useRunSession";

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function DecisionEntry({
  run,
  record,
  onRewind,
  busy,
}: {
  run: GameRun;
  record: RoundRecord;
  onRewind: (quarter: number) => void;
  busy: boolean;
}) {
  const action = findAction(record.preparedState, record.playerAction);
  const opponentAction = findAction(record.preparedState, record.opponentAction);
  const before = record.preparedState.companies[run.role];
  const after = record.resultState.companies[run.role];
  const row = after.ledger[after.ledger.length - 1];
  const blocked = record.alternatives.filter((a) => !a.legal);

  return (
    <details
      className="card"
      style={{ marginTop: "0.8rem" }}
      data-testid={`decision-q${record.quarter}`}
    >
      <summary>
        <strong>Q{record.quarter}</strong> — {action.label}{" "}
        <span className="muted small">
          vs {opponentAction.label} ({record.opponentAction})
        </span>
      </summary>

      <dl className="definition-list">
        <dt>Intended objective</dt>
        <dd>
          {record.rationale.trim().length > 0 ? (
            record.rationale
          ) : (
            <span className="muted">Not recorded for this quarter.</span>
          )}
        </dd>
        <dt>Cash cost and activation</dt>
        <dd>
          {formatMoney(action.cash)}, {action.effort} effort,{" "}
          {action.delay === 0
            ? "effective in the same quarter"
            : `active from Q${record.quarter + action.delay}`}
          .
        </dd>
        <dt>Quantitative change for {after.name}</dt>
        <dd>
          Cash {formatMoney(before.cash)} to {formatMoney(after.cash)}. Revenue{" "}
          {formatMoney(row.revenue)}, variable cost {formatMoney(row.variableCost)}, fixed
          cost {formatMoney(row.fixedCost)}, operating cash flow{" "}
          {formatMoney(row.operatingCashFlow)}. Customers{" "}
          {formatCustomers(row.customers.small)} small and{" "}
          {formatCustomers(row.customers.enterprise)} enterprise.
        </dd>
        <dt>Considered alternatives</dt>
        <dd>
          {record.alternatives
            .filter((a) => a.legal && a.actionId !== record.playerAction)
            .map((a) => a.actionId)
            .join(", ") || "None: no other commitment was available."}
          {blocked.length > 0 ? (
            <ul className="small">
              {blocked.map((a) => (
                <li key={a.actionId}>
                  <strong>{a.actionId}</strong> was unavailable: {a.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </dd>
        <dt>Information visible at commitment</dt>
        <dd>
          <ul className="small">
            {record.informationVisible.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </dd>
        <dt>Snapshot</dt>
        <dd className="num small">{record.snapshotHash}</dd>
      </dl>

      {record.substitution ? (
        <p className="notice notice--quiet small">{record.substitution}</p>
      ) : null}

      <h4>Resolution ledger</h4>
      <EventLedger events={[...record.prepareEvents, ...record.events]} />

      <div className="btn-row" style={{ marginTop: "0.8rem" }}>
        <button
          className="btn btn--quiet"
          type="button"
          disabled={busy}
          onClick={() => onRewind(record.quarter)}
        >
          Replay Q{record.quarter} in a new branch
        </button>
      </div>
    </details>
  );
}

export default function ResultsClient() {
  const session = useRunSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [importText, setImportText] = useState("");
  const [importNotes, setImportNotes] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  if (session.status === "loading") {
    return (
      <p className="muted" role="status">
        Loading your saved session…
      </p>
    );
  }

  const runImport = async (text: string) => {
    setImportError(null);
    setImportNotes([]);
    if (text.trim().length === 0) {
      setImportError("Paste an exported run, or choose a .json file.");
      return;
    }
    setBusy(true);
    try {
      const notes = await session.importFromText(text);
      setImportNotes(notes);
      setImportText("");
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  const importPanel = (
    <section className="card" aria-labelledby="import-heading">
      <h2 id="import-heading">Import a run</h2>
      <p className="small muted">
        Imported files are schema-validated, then replayed through the engine. If a single
        ledger value fails to reproduce, the import is rejected rather than loaded.
        Maximum 1 MB, JSON only.
      </p>
      <label htmlFor="import-file">Choose an exported .json file</label>
      <input
        id="import-file"
        type="file"
        accept="application/json,.json"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          event.target.value = "";
          await runImport(text);
        }}
      />
      <label htmlFor="import-text" style={{ marginTop: "0.8rem" }}>
        Or paste the exported JSON
      </label>
      <textarea
        id="import-text"
        value={importText}
        onChange={(event) => setImportText(event.target.value)}
        placeholder='{"format":"disrupt-this-business/run", ...}'
      />
      <div className="btn-row" style={{ marginTop: "0.6rem" }}>
        <button
          className="btn btn--secondary"
          type="button"
          disabled={busy}
          onClick={() => runImport(importText)}
        >
          Import pasted run
        </button>
      </div>
      {importError ? (
        <p className="notice notice--danger small" role="alert" data-testid="import-error">
          {importError}
        </p>
      ) : null}
      {importNotes.length > 0 ? (
        <div
          className="notice notice--info small"
          role="status"
          data-testid="import-notes"
        >
          <p>
            <strong>Import verified.</strong>
          </p>
          <ul>
            {importNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );

  if (!session.run) {
    return (
      <div className="stack">
        <header>
          <p className="eyebrow">Results</p>
          <h1>No run to report yet</h1>
          <p className="lede">
            Results are generated from a played session. Start a game, or import a run
            that someone exported.
          </p>
        </header>
        <div className="btn-row">
          <Link className="btn" href="/play">
            Start a game
          </Link>
        </div>
        {importPanel}
      </div>
    );
  }

  const run = session.run;
  const scenario = getScenario(run.scenarioId);
  const environment = getEnvironment(scenario, run.environmentId);
  const ledger = buildLedger(run);
  const you = run.state.companies[run.role];
  const observations = closingObservations(run);
  const timestamp = () => new Date().toISOString();

  return (
    <div className="stack">
      <header>
        <p className="eyebrow">
          Results — run <span data-testid="run-id">{run.id}</span>
          {run.parentId ? ` (branched from ${run.parentId})` : ""}
        </p>
        <h1>
          {you.name} after {run.rounds.length} of {run.state.totalRounds} quarters
        </h1>
        <p className="lede">
          Environment preset <strong>{environment.label}</strong>. You played{" "}
          {run.role === "incumbent" ? "the incumbent" : "the challenger"}.{" "}
          {run.fixedOpponent
            ? "Comparison mode: against your recorded strategy, with the opponent replaying a fixed script."
            : "The opponent recomputed its rules-based policy each quarter."}
        </p>
      </header>

      <AssumptionNotice />

      {!run.state.finished ? (
        <p className="notice notice--info">
          This run is still in progress. Everything below reflects the quarters resolved so
          far. <Link href="/play">Continue playing</Link>.
        </p>
      ) : null}

      {session.error ? (
        <p className="notice notice--danger" role="alert">
          {session.error}
        </p>
      ) : null}

      {run.rounds.length === 0 ? (
        <p className="notice notice--quiet">
          No quarters have been locked yet, so there is no ledger to report.{" "}
          <Link href="/play">Lock a decision</Link> to produce one.
        </p>
      ) : (
        <>
          <section className="section" aria-labelledby="trajectory-heading">
            <h2 id="trajectory-heading">Trajectories</h2>
            <div className="two-col">
              <div className="card">
                <h3>Ending cash by quarter</h3>
                <CashChart
                  id="cash"
                  rows={ledger.map((row) => ({
                    quarter: row.quarter,
                    incumbent: row.incumbent.endingCash,
                    challenger: row.challenger.endingCash,
                  }))}
                  incumbentName={run.state.companies.incumbent.name}
                  challengerName={run.state.companies.challenger.name}
                />
              </div>
              <div className="card">
                <h3>Customer mix at the end</h3>
                <CustomerFlowChart
                  id="mix"
                  rows={customerMix(run)}
                  incumbentName={run.state.companies.incumbent.name}
                  challengerName={run.state.companies.challenger.name}
                />
              </div>
            </div>
          </section>

          <section className="section" aria-labelledby="liquidity-heading">
            <h2 id="liquidity-heading">Liquidity</h2>
            <div className="two-col">
              {([run.role, otherRole(run.role)] as Role[]).map((role) => {
                const company = run.state.companies[role];
                const last = company.ledger[company.ledger.length - 1];
                return (
                  <div className="card" key={role}>
                    <p className="eyebrow">
                      <span className={`tag tag--${role}`}>
                        {role === "incumbent" ? "Incumbent" : "Challenger"}
                      </span>
                      {role === run.role ? " you" : " opponent"}
                    </p>
                    <h3>{company.name}</h3>
                    <p className="num" style={{ fontSize: "1.6rem", margin: 0 }}>
                      {formatMoney(company.cash)}
                    </p>
                    <p className="small muted">Ending cash after Q{last.quarter}.</p>
                    {company.fundingRequired ? (
                      <p className="notice notice--danger small">
                        Funding required. Cash is negative and the model injects no
                        financing, so only free choices remain available.
                      </p>
                    ) : (
                      <p className="small">Solvent throughout. No funding gap recorded.</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="table-scroll" style={{ marginTop: "1rem" }}>
              <table className="data">
                <caption>
                  Full quarterly ledger for both companies, in USD. Both are kept even
                  though you only played one.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Quarter</th>
                    <th scope="col">Company</th>
                    <th scope="col" className="n">
                      Revenue
                    </th>
                    <th scope="col" className="n">
                      Variable cost
                    </th>
                    <th scope="col" className="n">
                      Fixed cost
                    </th>
                    <th scope="col" className="n">
                      Investment
                    </th>
                    <th scope="col" className="n">
                      Operating cash flow
                    </th>
                    <th scope="col" className="n">
                      Ending cash
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.flatMap((row) =>
                    (["incumbent", "challenger"] as Role[]).map((role) => (
                      <tr key={`${row.quarter}-${role}`}>
                        <th scope="row">Q{row.quarter}</th>
                        <td>{run.state.companies[role].name}</td>
                        <td className="n">{formatMoney(row[role].revenue)}</td>
                        <td className="n">{formatMoney(row[role].variableCost)}</td>
                        <td className="n">{formatMoney(row[role].fixedCost)}</td>
                        <td className="n">{formatMoney(row[role].investment)}</td>
                        <td className="n">{formatMoney(row[role].operatingCashFlow)}</td>
                        <td className="n">{formatMoney(row[role].endingCash)}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="section" aria-labelledby="observations-heading">
            <h2 id="observations-heading">Three observations from the rules</h2>
            <p className="small muted">
              Derived from this run&apos;s ledger and the documented parameters. Not
              advice, and not a claim about any real market.
            </p>
            {observations.map((observation) => (
              <article className="card" key={observation.title} style={{ marginTop: "0.8rem" }}>
                <h3>{observation.title}</h3>
                <p>{observation.body}</p>
                <FormulaLinks ids={observation.formulaIds} />
              </article>
            ))}
          </section>

          <section className="section" aria-labelledby="decisions-heading">
            <h2 id="decisions-heading">Your decision ledger</h2>
            <p className="small muted">
              Every entry records the objective you typed, the alternatives that were
              available or blocked, the cost, the activation date, the quantitative change
              and the rules behind it.
            </p>
            {run.rounds.map((record) => (
              <DecisionEntry
                key={record.quarter}
                run={run}
                record={record}
                busy={busy}
                onRewind={async (quarter) => {
                  setBusy(true);
                  const id = await session.branch(quarter);
                  setBusy(false);
                  if (id) router.push("/play");
                }}
              />
            ))}
          </section>
        </>
      )}

      <section className="section" aria-labelledby="next-heading">
        <h2 id="next-heading">What next</h2>
        <div className="btn-row">
          <button
            className="btn"
            type="button"
            disabled={busy || run.rounds.length === 0}
            onClick={async () => {
              setBusy(true);
              const id = await session.reverse();
              setBusy(false);
              if (id) router.push("/play");
            }}
          >
            Switch sides against your recorded strategy
          </button>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() =>
              download(
                `disrupt-this-business-${run.id}.json`,
                exportRunJson(run, timestamp()),
                "application/json",
              )
            }
          >
            Export JSON
          </button>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() =>
              download(
                `disrupt-this-business-${run.id}.md`,
                exportRunMarkdown(run, timestamp()),
                "text/markdown",
              )
            }
          >
            Export Markdown
          </button>
          <Link className="btn btn--secondary" href="/analysis">
            Read the author analysis
          </Link>
        </div>
        <p className="small muted" style={{ marginTop: "0.6rem" }}>
          Switching sides starts a fresh game from the same opening state and environment,
          with your recorded actions driving the other company. Rewinding a quarter keeps
          this run intact and creates a new branch that records this run as its parent.
        </p>
      </section>

      <details className="card" data-testid="export-details">
        <summary>
          <strong>Exported JSON preview</strong>
        </summary>
        <p className="small muted">
          Exactly what the download contains, except that the real export stamps{" "}
          <code>exportedAt</code> at the moment you click.
        </p>
        <pre
          className="num small"
          style={{ overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
          data-testid="export-preview"
        >
          {exportRunJson(run, "(set at download time)")}
        </pre>
      </details>

      {importPanel}

      {session.runs.length > 1 ? (
        <section className="section" aria-labelledby="runs-heading">
          <h2 id="runs-heading">Saved runs in this browser</h2>
          <ul className="run-list">
            {session.runs.map((saved) => (
              <li key={saved.id}>
                <span>
                  <strong>{saved.label}</strong>{" "}
                  <span className="muted small">
                    run {saved.id}
                    {saved.parentId ? `, parent ${saved.parentId}` : ""} —{" "}
                    {saved.rounds.length} quarter
                    {saved.rounds.length === 1 ? "" : "s"} — {saved.mode}
                  </span>
                </span>
                <button
                  className="btn btn--quiet"
                  type="button"
                  disabled={saved.id === run.id}
                  onClick={() => session.openRun(saved.id)}
                >
                  {saved.id === run.id ? "Active" : "Open"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
