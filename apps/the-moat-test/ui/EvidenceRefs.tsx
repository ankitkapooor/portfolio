import Link from "next/link";
import { evidenceById } from "@/content/evidence";
import { EVIDENCE_TYPE_LABELS } from "@/domain/schemas/evidence";

/**
 * Inline citation. The evidence type is in the link text, so a reader can see that
 * a claim rests on a hypothesis without opening the record.
 */
export function EvidenceRefs({ ids }: { ids: readonly string[] }) {
  if (ids.length === 0) return null;
  return (
    <span className="evidenceRefs">
      {ids.map((id) => {
        const record = evidenceById(id);
        if (!record) {
          // validate-content fails on an unknown id, so this is unreachable in a
          // shipped build. Rendering it loudly beats rendering a dead link.
          return (
            <span key={id} className="evidenceRefBroken">
              {id} (missing record)
            </span>
          );
        }
        return (
          <Link key={id} href={`/evidence/${id}`} className="evidenceRef">
            {id}
            <span className="evidenceRefType">
              {EVIDENCE_TYPE_LABELS[record.type]}
            </span>
          </Link>
        );
      })}
    </span>
  );
}
