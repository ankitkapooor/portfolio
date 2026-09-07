import Link from "next/link";

/**
 * The honesty label. Rendered wherever scenario numbers appear so nobody can
 * mistake a design assumption for a measurement.
 */
export function AssumptionNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="notice" aria-label="Assumption notice">
      <p>
        <strong>Fictional design assumptions.</strong> RelayWorks and TaskPilot are
        invented scenario labels. Every price, cost, trait, event and outcome in this
        exercise was made up to make the trade-offs legible. Nothing here measures a real
        market or predicts a real company.
        {compact ? null : (
          <>
            {" "}
            The full parameter set and every formula are on the{" "}
            <Link href="/methodology">model page</Link>.
          </>
        )}
      </p>
    </aside>
  );
}
