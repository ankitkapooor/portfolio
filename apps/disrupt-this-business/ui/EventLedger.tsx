import type { EngineEvent } from "@/domain/schema";
import { FormulaLinks } from "@/ui/FormulaLinks";

/**
 * The ordered event ledger for a quarter, in resolution order.
 * Every line carries its own explanation and links to the rules behind it.
 */
export function EventLedger({
  events,
  emptyMessage = "No ledger lines yet.",
}: {
  events: EngineEvent[];
  emptyMessage?: string;
}) {
  if (events.length === 0) {
    return (
      <p className="muted small" role="status">
        {emptyMessage}
      </p>
    );
  }
  return (
    <ol className="event-list">
      {events.map((event) => (
        <li key={event.id}>
          <p className="event-list__headline">
            {event.role ? (
              <span className={`tag tag--${event.role}`}>
                {event.role === "incumbent" ? "Incumbent" : "Challenger"}
              </span>
            ) : (
              <span className="tag">Market</span>
            )}{" "}
            {event.headline}
          </p>
          <p className="event-list__detail">{event.detail}</p>
          <FormulaLinks ids={event.formulaIds} />
        </li>
      ))}
    </ol>
  );
}
