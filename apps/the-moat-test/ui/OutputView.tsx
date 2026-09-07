import type { ExtractionOutput } from "@/domain/schemas/extraction";
import type { ActionStatus, DecisionStatus } from "@/domain/schemas/primitives";

/**
 * Renders an extraction output.
 *
 * One component serves the article and both comparison panels, which is what makes
 * "identical type, width and formatting" (BRD section 8) true rather than intended.
 * It knows nothing about which method produced the output.
 */

const DECISION_STATUS_COPY: Record<DecisionStatus, string> = {
  current: "Stands",
  superseded: "Superseded",
  unresolved: "Unresolved",
};

const ACTION_STATUS_COPY: Record<ActionStatus, string> = {
  open: "Open",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Line id chips. The cited line's text is exposed to assistive technology. */
function Citations({
  ids,
  lineText,
}: {
  ids: readonly string[];
  lineText?: Record<string, string>;
}) {
  if (ids.length === 0) {
    return <span className="citationsEmpty">No line cited</span>;
  }
  return (
    <span className="citations">
      <span className="visuallyHidden">Cited transcript lines: </span>
      {ids.map((id) => (
        <span key={id} className="lineRef">
          {id}
          {lineText?.[id] ? (
            <span className="visuallyHidden"> — {lineText[id]}</span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

function formatDue(action: ExtractionOutput["actions"][number]): string {
  if (action.dueDate) return action.dueDate;
  if (action.dueDateText) return `${action.dueDateText} (not resolved to a date)`;
  return "No date";
}

export function OutputView({
  output,
  lineText,
  idPrefix,
}: {
  output: ExtractionOutput;
  /** Line id to line text, so citations can be read aloud in full. */
  lineText?: Record<string, string>;
  /** Keeps heading ids unique when two outputs sit side by side. */
  idPrefix: string;
}) {
  return (
    <div className="outputView">
      <section aria-labelledby={`${idPrefix}-summary`}>
        <h4 id={`${idPrefix}-summary`} className="outputHeading">
          Summary
        </h4>
        <p className="outputSummary">{output.summary}</p>
      </section>

      <section aria-labelledby={`${idPrefix}-decisions`}>
        <h4 id={`${idPrefix}-decisions`} className="outputHeading">
          Decisions <span className="outputCount">{output.decisions.length}</span>
        </h4>
        {output.decisions.length === 0 ? (
          <p className="outputEmpty">No decision was recorded.</p>
        ) : (
          <ul className="outputList">
            {output.decisions.map((decision) => (
              <li key={decision.id} className="outputItem">
                <p className="outputItemText">{decision.text}</p>
                <p className="outputItemMeta">
                  <span className="fieldLabel">Status</span>
                  <span className="fieldValue">
                    {DECISION_STATUS_COPY[decision.status]}
                  </span>
                  <Citations ids={decision.evidenceLineIds} lineText={lineText} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby={`${idPrefix}-actions`}>
        <h4 id={`${idPrefix}-actions`} className="outputHeading">
          Actions <span className="outputCount">{output.actions.length}</span>
        </h4>
        {output.actions.length === 0 ? (
          <p className="outputEmpty">No action item was recorded.</p>
        ) : (
          <ul className="outputList">
            {output.actions.map((action) => (
              <li key={action.id} className="outputItem">
                <p className="outputItemText">{action.task}</p>
                <p className="outputItemMeta">
                  <span className="fieldLabel">Owner</span>
                  <span
                    className={`fieldValue${action.owner === null ? " fieldValueNull" : ""}`}
                  >
                    {action.owner ?? "Not named in the transcript"}
                  </span>
                  <span className="fieldLabel">Due</span>
                  <span
                    className={`fieldValue${action.dueDate === null ? " fieldValueNull" : ""}`}
                  >
                    {formatDue(action)}
                  </span>
                  <span className="fieldLabel">Status</span>
                  <span className="fieldValue">
                    {ACTION_STATUS_COPY[action.status]}
                  </span>
                  <Citations ids={action.evidenceLineIds} lineText={lineText} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby={`${idPrefix}-questions`}>
        <h4 id={`${idPrefix}-questions`} className="outputHeading">
          Open questions{" "}
          <span className="outputCount">{output.openQuestions.length}</span>
        </h4>
        {output.openQuestions.length === 0 ? (
          <p className="outputEmpty">None recorded.</p>
        ) : (
          <ul className="outputList">
            {output.openQuestions.map((item) => (
              <li key={item.id} className="outputItem">
                <p className="outputItemText">{item.text}</p>
                <p className="outputItemMeta">
                  <Citations ids={item.evidenceLineIds} lineText={lineText} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby={`${idPrefix}-uncertainties`}>
        <h4 id={`${idPrefix}-uncertainties`} className="outputHeading">
          Uncertainties{" "}
          <span className="outputCount">{output.uncertainties.length}</span>
        </h4>
        {output.uncertainties.length === 0 ? (
          <p className="outputEmpty">None recorded.</p>
        ) : (
          <ul className="outputList">
            {output.uncertainties.map((item) => (
              <li key={item.id} className="outputItem">
                <p className="outputItemText">{item.text}</p>
                <p className="outputItemMeta">
                  <Citations ids={item.evidenceLineIds} lineText={lineText} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
