import Link from "next/link";
import { formulaIndex } from "@/content/methodology";

/**
 * Turns the engine's formula ids into links to their documented definition.
 * This is the mechanism behind "every result links to a parameter or formula".
 */
export function FormulaLinks({ ids }: { ids: string[] }) {
  const unique = Array.from(new Set(ids)).filter((id) => id in formulaIndex);
  if (unique.length === 0) return null;
  return (
    <p className="event-list__formulas">
      <span className="visually-hidden">Documented rules behind this line:</span>
      {unique.map((id) => (
        <Link
          key={id}
          className="formula-chip"
          href={`/methodology#${id}`}
          title={formulaIndex[id].title}
        >
          {id}
        </Link>
      ))}
    </p>
  );
}
