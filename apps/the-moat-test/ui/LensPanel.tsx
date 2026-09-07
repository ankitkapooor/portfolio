"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  LENSES,
  LENS_IDS,
  REQUIREMENT_EVIDENCE_LABELS,
  type LensId,
} from "@/content/lenses";

/**
 * Customer lenses (BRD section 8).
 *
 * Changing the lens changes which requirements matter and which are unevidenced.
 * It does not touch a measured number, and there is no weighted score and no
 * BUY/BUILD stamp: a verdict computed from arbitrary weights would be a decision
 * this investigation has not earned.
 */

const EVIDENCE_MARK = {
  measured: "M",
  hypothesis: "H",
  "no-evidence": "—",
} as const;

export function LensPanel({
  measuredSummary,
}: {
  /** The measured headline, passed in so the panel cannot recompute it. */
  measuredSummary: string;
}) {
  const [lensId, setLensId] = useState<LensId>("small-team");
  const [deselected, setDeselected] = useState<Record<string, boolean>>({});
  const groupName = useId();

  const lens = LENSES[lensId];
  const selected = lens.requirements.filter(
    (requirement) => !(deselected[`${lensId}:${requirement.id}`] ?? !requirement.defaultSelected),
  );
  const measuredCount = selected.filter((r) => r.evidence === "measured").length;
  const unevidencedCount = selected.filter((r) => r.evidence === "no-evidence").length;

  const toggle = (requirementId: string, checked: boolean) => {
    setDeselected((current) => ({
      ...current,
      [`${lensId}:${requirementId}`]: !checked,
    }));
  };

  return (
    <section className="lensPanel" aria-labelledby="lens-panel-heading">
      <header className="resultsHeader">
        <h3 id="lens-panel-heading">Requirements by customer</h3>
      </header>

      <fieldset className="lensChooser">
        <legend>Read this as</legend>
        {LENS_IDS.map((id) => (
          <label key={id} className="lensOption">
            <input
              type="radio"
              name={groupName}
              value={id}
              checked={lensId === id}
              onChange={() => setLensId(id)}
            />
            <span className="lensOptionName">{LENSES[id].name}</span>
            <span className="lensOptionWho">{LENSES[id].who}</span>
          </label>
        ))}
      </fieldset>

      <div className="lensBody">
        <div>
          <h4 className="panelHeading">What has to be true</h4>
          <ul className="lensRequirements">
            {lens.requirements.map((requirement) => {
              const key = `${lensId}:${requirement.id}`;
              const checked =
                !(deselected[key] ?? !requirement.defaultSelected);
              return (
                <li key={requirement.id} className="lensRequirement">
                  <label className="lensRequirementLabel">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        toggle(requirement.id, event.target.checked)
                      }
                    />
                    <span className="lensRequirementName">{requirement.label}</span>
                  </label>
                  <p className="lensRequirementNote">{requirement.note}</p>
                  <p className="lensRequirementEvidence">
                    <span
                      className={`evidenceMark evidenceMark-${requirement.evidence}`}
                      aria-hidden="true"
                    >
                      {EVIDENCE_MARK[requirement.evidence]}
                    </span>
                    {REQUIREMENT_EVIDENCE_LABELS[requirement.evidence]}
                    {requirement.evidenceIds.map((id) => (
                      <Link key={id} href={`/evidence/${id}`} className="lensEvidenceRef">
                        {id}
                      </Link>
                    ))}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h4 className="panelHeading">Where the evidence runs out</h4>
          <p className="lensTally" role="status">
            Of the {selected.length} requirements you have kept, {measuredCount}{" "}
            {measuredCount === 1 ? "has" : "have"} been measured here and{" "}
            {unevidencedCount} {unevidencedCount === 1 ? "has" : "have"} not been
            investigated at all. That is a count, not a score, and it does not
            resolve into a recommendation.
          </p>
          <ul className="articleList">
            {lens.gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="note noteLimitation lensInvariant" data-testid="lens-invariant">
        The lens changes nothing that was measured. Held-out results are unchanged
        regardless of which customer you read as: {measuredSummary}
      </p>
    </section>
  );
}
