import type { Metadata } from "next";
import { EVIDENCE } from "@/content/evidence";
import { EvidenceList } from "@/ui/EvidenceList";

export const metadata: Metadata = {
  title: "Evidence ledger",
  description:
    "Every claim published in this investigation links to a record here, typed so that a hypothesis cannot be mistaken for a measurement.",
};

export default function EvidenceIndexPage() {
  return (
    <div className="page prose">
      <h1 className="pageTitle">Evidence ledger</h1>
      <p className="measure pageStandfirst">
        {EVIDENCE.length} records. Every published claim cites one by id, and a claim
        that cites an id which is not in this ledger fails{" "}
        <code>npm run validate-content</code> rather than being published quietly.
      </p>
      <p className="measure note noteLimitation">
        A record documents what was observed and what that observation cannot
        support. An entry existing here does not make the claim above it true; it
        makes the basis for the claim checkable.
      </p>
      <EvidenceList />
    </div>
  );
}
