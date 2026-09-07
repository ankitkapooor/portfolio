import Link from "next/link";
import { EVIDENCE } from "@/content/evidence";
import {
  EVIDENCE_TYPE_LABELS,
  EVIDENCE_TYPE_MARKS,
  EVIDENCE_TYPE_MEANINGS,
  type EvidenceType,
} from "@/domain/schemas/evidence";

const TYPE_ORDER: EvidenceType[] = [
  "measured",
  "public-source",
  "interview",
  "assumption",
  "hypothesis",
];

/**
 * The evidence ledger index (BRD section 9).
 *
 * Records are grouped by type and every group prints its count, including the
 * empty one: "Interview 0" is a more useful statement than an absent heading.
 */
export function EvidenceList() {
  return (
    <section className="evidenceList" aria-labelledby="evidence-list-heading">
      <h3 id="evidence-list-heading" className="visuallyHidden">
        Evidence ledger
      </h3>
      {TYPE_ORDER.map((type) => {
        const records = EVIDENCE.filter((record) => record.type === type);
        return (
          <div key={type} className="evidenceGroup">
            <h4 className="evidenceGroupHeading">
              <span className="evidenceMark" aria-hidden="true">
                {EVIDENCE_TYPE_MARKS[type]}
              </span>
              {EVIDENCE_TYPE_LABELS[type]}
              <span className="evidenceGroupCount">{records.length}</span>
            </h4>
            <p className="measure evidenceGroupMeaning">
              {EVIDENCE_TYPE_MEANINGS[type]}
            </p>
            {records.length === 0 ? (
              <p className="measure outputEmpty">
                No records of this type exist. None have been collected.
              </p>
            ) : (
              <ul className="evidenceItems">
                {records.map((record) => (
                  <li key={record.id}>
                    <Link href={`/evidence/${record.id}`} className="evidenceItemLink">
                      <span className="evidenceItemId">{record.id}</span>
                      <span className="evidenceItemTitle">{record.sourceTitle}</span>
                    </Link>
                    <p className="measure evidenceItemScope">{record.scope}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
