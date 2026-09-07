"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { evaluateActions, findAction } from "@/domain/engine";
import { explainRound } from "@/domain/explain";
import type {
  ActionId,
  EnvironmentId,
  GameRun,
  Role,
  RoundRecord,
} from "@/domain/schema";
import { defaultScenario } from "@/content/scenarios";
import { AssumptionNotice } from "@/ui/AssumptionNotice";
import { EventLedger } from "@/ui/EventLedger";
import { FormulaLinks } from "@/ui/FormulaLinks";
import { LedgerPanel } from "@/ui/LedgerPanel";
import { formatMoney, otherRole, roleLabel } from "@/ui/format";
import { useRunSession } from "@/ui/useRunSession";

const RATIONALE_LIMIT = 2000;

/* ------------------------------------------------------------------ */
/* Briefing: role and environment choice                               */
/* ------------------------------------------------------------------ */

function Briefing({
  onStart,
  busy,
}: {
  onStart: (role: Role, environmentId: EnvironmentId) => void;
  busy: boolean;
}) {
  const [role, setRole] = useState<Role>("incumbent");
  const [environmentId, setEnvironmentId] = useState<EnvironmentId>("foundation");

  return (
    <div className="stack">
      <header>
        <p className="eyebrow">Briefing</p>
        <h1>Choose a side</h1>
        <p className="lede">
          {defaultScenario.premise} Four quarterly decisions, one commitment each. All
          money is USD, all prices are annual per team, and every period is a quarter.
        </p>
      </header>

      <AssumptionNotice />

      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          onStart(role, environmentId);
        }}
      >
        <fieldset>
          <legend>Your role</legend>
          <div className="choice-grid">
            {(["incumbent", "challenger"] as Role[]).map((option) => {
              const company = defaultScenario.companies[option];
              return (
                <label className="choice" key={option}>
                  <input
                    type="radio"
                    name="role"
                    value={option}
                    checked={role === option}
                    onChange={() => setRole(option)}
                  />
                  <span className={`tag tag--${option}`}>{roleLabel[option]}</span>{" "}
                  <span className="choice__title">{company.name}</span>
                  <span className="choice__body">
                    {company.proposition} Opening cash {formatMoney(company.cash)},{" "}
                    {company.capacityPerQuarter} effort units per quarter,{" "}
                    {company.initialCustomers.small + company.initialCustomers.enterprise}{" "}
                    teams today.
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend>Environment preset</legend>
          <p className="small muted">
            Chosen before play and described as a scenario. The set of possible events is
            disclosed below; the quarter each one fires stays hidden until it happens or
            you buy research.
          </p>
          <div className="choice-grid">
            {defaultScenario.environments.map((environment) => (
              <label className="choice" key={environment.id}>
                <input
                  type="radio"
                  name="environment"
                  value={environment.id}
                  checked={environmentId === environment.id}
                  onChange={() => setEnvironmentId(environment.id)}
                />
                <span className="choice__title">{environment.label}</span>
                <span className="choice__body">
                  {environment.description}
                  {environment.disclosedEvents.length > 0 ? (
                    <>
                      {" "}
                      Possible effects: {environment.disclosedEvents.join(" ")}
                    </>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="btn-row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Starting…" : "Start quarter one"}
          </button>
          <Link className="btn btn--secondary" href="/methodology">
            Inspect the model first
          </Link>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal panel shown immediately after a lock                         */
/* ------------------------------------------------------------------ */

function Reveal({
  run,
  record,
  onContinue,
}: {
  run: GameRun;
  record: RoundRecord;
  onContinue: () => void;
}) {
  const explanation = explainRound(record);
  const opponent = otherRole(run.role);
  const opponentName = run.state.companies[opponent].name;
  const opponentAction = findAction(record.preparedState, record.opponentAction);
  const playerAction = findAction(record.preparedState, record.playerAction);

  return (
    <section className="stack" aria-labelledby="reveal-heading">
      <header>
        <p className="eyebrow">Q{record.quarter} resolved</p>
        <h2 id="reveal-heading">Opponent reveal and resolution</h2>
      </header>

      <div className="two-col">
        <div className="card">
          <p className="eyebrow">You committed</p>
          <h3>{playerAction.label}</h3>
          <p className="small">{playerAction.summary}</p>
        </div>
        <div className="card">
          <p className="eyebrow">{opponentName} committed</p>
          <h3>{opponentAction.label}</h3>
          <p className="small">{opponentAction.summary}</p>
          <p className="small muted">{record.opponentExplanation}</p>
          {record.substitution ? (
            <p className="notice notice--quiet small">{record.substitution}</p>
          ) : null}
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Explanation ({explanation.source})</p>
        <h3>{explanation.headline}</h3>
        <p>{explanation.tradeoff}</p>
        <p className="small muted">
          Generated from {explanation.evidenceIds.length} ledger entries by the rules
          below. No language model is involved anywhere in this build.
        </p>
        <FormulaLinks ids={explanation.formulaIds} />
      </div>

      <div className="card">
        <h3>Resolution order</h3>
        <EventLedger events={[...record.prepareEvents, ...record.events]} />
      </div>

      <div className="btn-row">
        <button className="btn" type="button" onClick={onContinue}>
          {run.state.finished ? "See the results" : `Continue to Q${record.quarter + 1}`}
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The round workspace                                                 */
/* ------------------------------------------------------------------ */

function Workspace({
  run,
  onLock,
  busy,
  error,
}: {
  run: GameRun;
  onLock: (actionId: ActionId, rationale: string) => void;
  busy: boolean;
  error: string | null;
}) {
  const [selected, setSelected] = useState<ActionId | null>(null);
  const [rationale, setRationale] = useState("");

  const prepared = run.pending;
  const state = prepared?.state ?? run.state;
  const quarter = state.quarter;
  const verdicts = useMemo(
    () => (prepared ? evaluateActions(prepared.state, run.role) : []),
    [prepared, run.role],
  );
  const chosen = selected
    ? verdicts.find((v) => v.actionId === selected) ?? null
    : null;
  const chosenDefinition = selected ? findAction(state, selected) : null;

  if (!prepared) return null;

  const company = state.companies[run.role];
  const opponentName = state.companies[otherRole(run.role)].name;
  const research = state.researchNotes[run.role];

  return (
    <div className="play-grid">
      <nav className="round-rail" aria-label="Quarters">
        <p className="eyebrow">Quarters</p>
        <ol>
          {Array.from({ length: state.totalRounds }, (_, i) => i + 1).map((q) => {
            const played = run.rounds.find((r) => r.quarter === q);
            const stateName = played ? "done" : q === quarter ? "current" : "upcoming";
            return (
              <li key={q}>
                <span className="round-chip" data-state={stateName}>
                  Q{q}
                  <span className="num">
                    {played
                      ? findAction(played.preparedState, played.playerAction).label
                      : q === quarter
                        ? "deciding now"
                        : "not reached"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="stack">
        <header>
          <p className="eyebrow">
            Quarter {quarter} of {state.totalRounds} — you run {company.name}
          </p>
          <h1>What do you commit this quarter?</h1>
          <p className="lede">
            One commitment per quarter. Unspent cash stays cash, and unused delivery
            capacity does not carry over.
          </p>
        </header>

        <section className="card" aria-labelledby="intel-heading">
          <h2 id="intel-heading">Public intelligence</h2>
          <EventLedger
            events={prepared.events}
            emptyMessage="Nothing activated and no public event fired at the start of this quarter."
          />
          <h3 style={{ marginTop: "1rem" }}>Research you have bought</h3>
          {research.length === 0 ? (
            <p className="muted small">
              None. Commissioning research costs {formatMoney(50_000)} and uses the
              quarter&apos;s only commitment, so it competes directly with building
              something.
            </p>
          ) : (
            <ul className="small">
              {research.map((note) => (
                <li key={`${note.purchasedInQuarter}-${note.aboutQuarter}`}>
                  <strong>
                    Bought Q{note.purchasedInQuarter}, about Q{note.aboutQuarter}:
                  </strong>{" "}
                  {note.headline}. {note.detail}
                </li>
              ))}
            </ul>
          )}
          <p className="small muted">
            {opponentName}&apos;s committed move for this quarter is hidden until you lock
            yours.
          </p>
        </section>

        <section aria-labelledby="decision-heading">
          <h2 id="decision-heading">Decision catalog</h2>
          <div className="action-list" role="group" aria-describedby="decision-help">
            {verdicts.map((verdict) => {
              const action = findAction(state, verdict.actionId);
              const isSelected = selected === verdict.actionId;
              return (
                <button
                  key={verdict.actionId}
                  type="button"
                  className="action-card"
                  aria-pressed={isSelected}
                  disabled={!verdict.legal}
                  onClick={() => setSelected(verdict.actionId)}
                >
                  <span className="action-card__title">{action.label}</span>
                  <span className="action-card__meta">
                    <span>{formatMoney(action.cash)}</span>
                    <span>
                      {action.effort} effort
                      {action.delay > 1 ? ` x ${action.delay} quarters` : ""}
                    </span>
                    <span>
                      {action.delay === 0
                        ? "effective now"
                        : `active Q${verdict.activationQuarter}`}
                    </span>
                  </span>
                  <span className="small">{action.summary}</span>
                  {verdict.legal ? null : (
                    <span className="action-card__why">{verdict.reason}</span>
                  )}
                  {isSelected ? (
                    <span className="action-card__selected">Selected</span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p id="decision-help" className="small muted">
            Unavailable choices stay visible with the reason they are blocked.
          </p>
        </section>

        <section className="card" aria-labelledby="preview-heading" aria-live="polite">
          <h2 id="preview-heading">Decision preview</h2>
          {!chosen || !chosenDefinition ? (
            <p className="muted">
              Select a commitment to preview its cash cost, capacity use, activation date
              and what is uncertain about it.
            </p>
          ) : (
            <>
              <h3>{chosenDefinition.label}</h3>
              <dl className="definition-list">
                <dt>Immediate cash outlay</dt>
                <dd>
                  {formatMoney(chosenDefinition.cash)} — irreversible, taken this quarter.
                  Cash would fall from {formatMoney(company.cash)} to{" "}
                  {formatMoney(company.cash - chosenDefinition.cash)} before this
                  quarter&apos;s operating flow.
                </dd>
                <dt>Capacity used</dt>
                <dd>
                  {chosenDefinition.effort} of {company.capacityPerQuarter} effort units
                  {chosenDefinition.effort === 0
                    ? ", so no delivery capacity is reserved."
                    : chosenDefinition.delay > 1
                      ? `, reserved in Q${quarter} and Q${quarter + chosenDefinition.delay - 1}.`
                      : `, reserved in Q${quarter}.`}
                </dd>
                <dt>Timing</dt>
                <dd>
                  {chosenDefinition.delay === 0
                    ? "Effective this quarter, before customers reallocate."
                    : `Activates at the start of Q${chosen.activationQuarter}${
                        chosen.activationQuarter > state.totalRounds
                          ? ", which is after the last quarter, so it stays committed work with no terminal benefit."
                          : "."
                      }`}
                </dd>
                <dt>Uncertainty</dt>
                <dd>{chosenDefinition.uncertainty}</dd>
              </dl>
              <FormulaLinks ids={chosenDefinition.formulaIds} />
            </>
          )}
        </section>

        <section className="card" aria-labelledby="rationale-heading">
          <h2 id="rationale-heading">Rationale (optional)</h2>
          <label htmlFor="rationale">
            What are you trying to achieve, and what are you giving up?
          </label>
          <textarea
            id="rationale"
            value={rationale}
            maxLength={RATIONALE_LIMIT}
            onChange={(event) => setRationale(event.target.value)}
            placeholder="Recorded in the decision ledger and exported with the run."
          />
          <p className="small muted">
            {rationale.length} / {RATIONALE_LIMIT} characters. Stored and displayed as
            plain text. It is never read by the engine and cannot change any result.
          </p>
        </section>

        {error ? (
          <p className="notice notice--danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="btn-row">
          <button
            className="btn"
            type="button"
            disabled={!selected || busy}
            onClick={() => selected && onLock(selected, rationale)}
          >
            {busy ? "Resolving…" : `Lock Q${quarter} and reveal ${opponentName}`}
          </button>
          {selected ? null : (
            <span className="small muted">Select a commitment to lock the quarter.</span>
          )}
        </div>
      </div>

      <aside className="card" aria-labelledby="ledger-heading">
        <h2 id="ledger-heading">Business ledger</h2>
        <p className="small muted">
          USD. Prices are annual per team. Contribution is revenue less variable delivery
          cost; cash is what is left after fixed costs and investment.
        </p>
        <LedgerPanel state={state} playerRole={run.role} quarter={quarter} />
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function PlayClient() {
  const session = useRunSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [revealQuarter, setRevealQuarter] = useState<number | null>(null);

  if (session.status === "loading") {
    return (
      <p className="muted" role="status">
        Loading your saved session…
      </p>
    );
  }

  const storageWarning = session.storageError ? (
    <p className="notice notice--danger" role="alert">
      {session.storageError} The game still works, but this session will not survive a
      refresh.
    </p>
  ) : null;

  if (!session.run) {
    return (
      <div className="stack">
        {storageWarning}
        <Briefing
          busy={busy}
          onStart={async (role, environmentId) => {
            setBusy(true);
            await session.start(role, environmentId);
            setBusy(false);
          }}
        />
      </div>
    );
  }

  const run = session.run;
  const revealed =
    revealQuarter === null
      ? null
      : (run.rounds.find((r) => r.quarter === revealQuarter) ?? null);

  return (
    <div className="stack">
      {storageWarning}

      <div className="status-line">
        <span>
          <span
            className="status-dot"
            data-tone={
              session.saveStatus === "error"
                ? "error"
                : session.saveStatus === "saved"
                  ? "saved"
                  : undefined
            }
          />
          {session.saveStatus === "saving"
            ? "Saving…"
            : session.saveStatus === "saved"
              ? "Saved locally"
              : session.saveStatus === "error"
                ? "Not saved"
                : "Loaded from local storage"}
        </span>
        <span>run {run.id}</span>
        <span>{run.label}</span>
        <span>
          scenario {run.scenarioId} v{run.scenarioVersion} / engine {run.engineVersion}
        </span>
        {run.fixedOpponent ? <span>Against your recorded strategy</span> : null}
      </div>

      {run.mode !== "standard" ? (
        <p className="notice notice--info small" data-testid="run-mode-notice">
          {run.mode === "branch"
            ? `Branch of run ${run.parentId}. Earlier decisions and the event sequence are preserved; the opponent policy is recomputed from here.`
            : `Role reversal against run ${run.parentId}. The opponent replays your recorded action script exactly, substituting hold with a stated reason when a move becomes illegal.`}
        </p>
      ) : null}

      {revealed ? (
        <Reveal
          run={run}
          record={revealed}
          onContinue={() => {
            setRevealQuarter(null);
            if (run.state.finished) router.push("/results");
          }}
        />
      ) : run.pending ? (
        <Workspace
          run={run}
          busy={busy}
          error={session.error}
          onLock={async (actionId, rationale) => {
            setBusy(true);
            const quarter = run.pending?.state.quarter ?? null;
            await session.commit(actionId, rationale);
            setBusy(false);
            setRevealQuarter(quarter);
          }}
        />
      ) : (
        <section className="stack">
          <header>
            <p className="eyebrow">Session complete</p>
            <h1>All four quarters are resolved</h1>
          </header>
          <div className="btn-row">
            <Link className="btn" href="/results">
              Read the results
            </Link>
          </div>
        </section>
      )}

      <div className="btn-row">
        <Link className="btn btn--quiet" href="/results">
          Results and export
        </Link>
        <Link className="btn btn--quiet" href="/methodology">
          Model and formulas
        </Link>
        <button
          className="btn btn--quiet"
          type="button"
          onClick={async () => {
            const ok = window.confirm(
              "Delete every saved run from this browser? This cannot be undone.",
            );
            if (!ok) return;
            await session.reset();
            setRevealQuarter(null);
          }}
        >
          Reset all saved runs
        </button>
      </div>
    </div>
  );
}
