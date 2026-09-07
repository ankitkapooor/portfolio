import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVIDENCE, evidenceById } from "@/content/evidence";
import {
  EVIDENCE_TYPE_LABELS,
  EVIDENCE_TYPE_MARKS,
  EVIDENCE_TYPE_MEANINGS,
} from "@/domain/schemas/evidence";

const REVIEWER_STATUS_COPY = {
  unreviewed: "Unreviewed. Nobody has checked this record.",
  "pending-review": "Pending review. Written down, not yet checked by a person.",
  reviewed: "Reviewed.",
} as const;

export function generateStaticParams() {
  return EVIDENCE.map((record) => ({ id: record.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/evidence/[id]">): Promise<Metadata> {
  const { id } = await params;
  const record = evidenceById(id);
  if (!record) return { title: "Evidence record not found" };
  return {
    title: `${record.id} — ${record.sourceTitle}`,
    description: record.scope,
  };
}

export default async function EvidenceRecordPage({
  params,
}: PageProps<"/evidence/[id]">) {
  const { id } = await params;
  const record = evidenceById(id);
  if (!record) notFound();

  return (
    <div className="page prose">
      <p className="articleKicker">
        <Link href="/evidence">Evidence ledger</Link>
      </p>
      <h1 className="pageTitle">{record.sourceTitle}</h1>
      <p className="badgeRow">
        <span className="pill">
          <span className="evidenceMark" aria-hidden="true">
            {EVIDENCE_TYPE_MARKS[record.type]}
          </span>
          <span className="pillMark">{EVIDENCE_TYPE_LABELS[record.type]}</span>
        </span>
        <span className="pill">
          <span className="pillMark">{record.id}</span>
        </span>
      </p>
      <p className="measure pageStandfirst">
        {EVIDENCE_TYPE_MEANINGS[record.type]}
      </p>

      <dl className="recordFields">
        <div>
          <dt>Scope</dt>
          <dd className="measure">{record.scope}</dd>
        </div>
        <div>
          <dt>Observation</dt>
          <dd className="measure">{record.observation}</dd>
        </div>
        <div>
          <dt>Limitations</dt>
          <dd className="measure">{record.limitations}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd className="measure">
            {record.sourceUrl ? (
              <a href={record.sourceUrl} rel="noreferrer noopener">
                {record.sourceUrl}
              </a>
            ) : null}
            {record.artifactPath ? (
              <code className="artifactPath">{record.artifactPath}</code>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Source date</dt>
          <dd>{record.sourceDate}</dd>
        </div>
        <div>
          <dt>Retrieved</dt>
          <dd>{record.retrievedAt}</dd>
        </div>
        <div>
          <dt>Reviewer status</dt>
          <dd className="measure">{REVIEWER_STATUS_COPY[record.reviewerStatus]}</dd>
        </div>
      </dl>

      <p className="measure">
        <Link href="/methodology">How measured records are produced</Link>
      </p>
    </div>
  );
}
