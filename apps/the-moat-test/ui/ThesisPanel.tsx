import { THESIS } from "@/content/thesis";
import type { Claim } from "@/domain/schemas/evidence";
import { EvidenceRefs } from "./EvidenceRefs";

/**
 * The authored commercial thesis (BRD section 9).
 *
 * It is labelled a draft because it is one. Prototype inference cost and production
 * total cost of ownership are separate fields and are never added together, and the
 * disconfirming evidence sits on the same page as the recommendation rather than in
 * a footnote.
 */

function ClaimBlock({ claim, label }: { claim: Claim; label: string }) {
  return (
    <div className="claimBlock">
      <h4 className="claimLabel">{label}</h4>
      <p className="measure">
        {claim.text}
        <EvidenceRefs ids={claim.evidenceIds} />
      </p>
    </div>
  );
}

export function ThesisPanel() {
  const thesis = THESIS;
  const economics = thesis.estimatedEconomics;

  return (
    <section className="thesisPanel" aria-labelledby="thesis-heading">
      <header className="resultsHeader">
        <h3 id="thesis-heading">Commercial thesis</h3>
        <span className="pill pillIllustrative">
          <span className="pillMark">
            {thesis.status === "draft" ? "Draft position" : "Reviewed"}
          </span>
        </span>
      </header>
      <p className="measure resultsIntro">
        An argument by the author, not a finding. Every claim below cites a record in
        the evidence ledger, and several of those records are hypotheses that say so.
      </p>

      <ClaimBlock claim={thesis.targetCustomer} label="Who this is for" />
      <ClaimBlock claim={thesis.recommendedPosition} label="Recommended position" />

      <div className="claimBlock">
        <h4 className="claimLabel">Alternatives rejected</h4>
        <dl className="rejectedList measure">
          {thesis.alternativesRejected.map((item) => (
            <div key={item.option} className="rejectedItem">
              <dt>{item.option}</dt>
              <dd>
                {item.reason}
                <EvidenceRefs ids={item.evidenceIds} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="claimBlock">
        <h4 className="claimLabel">Economics</h4>
        <p className="measure">
          {economics.prototypeInferenceCost.text}
          <EvidenceRefs ids={economics.prototypeInferenceCost.evidenceIds} />
        </p>
        <p className="measure">
          {economics.productionTco.text}
          <EvidenceRefs ids={economics.productionTco.evidenceIds} />
        </p>
        <p className="measure fieldLabel">
          Excluded from the prototype cost figure
        </p>
        <ul className="measure articleList">
          {economics.excludedFromPrototypeCost.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="claimBlock">
        <h4 className="claimLabel">Missing capabilities</h4>
        <ul className="measure articleList">
          {thesis.missingCapabilities.map((claim) => (
            <li key={claim.id}>
              {claim.text}
              <EvidenceRefs ids={claim.evidenceIds} />
            </li>
          ))}
        </ul>
      </div>

      <div className="claimBlock claimBlockDisconfirming">
        <h4 className="claimLabel">Evidence against this position</h4>
        <ul className="measure articleList">
          {thesis.disconfirmingEvidence.map((claim) => (
            <li key={claim.id}>
              {claim.text}
              <EvidenceRefs ids={claim.evidenceIds} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
