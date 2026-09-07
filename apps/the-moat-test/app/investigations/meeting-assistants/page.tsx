import type { Metadata } from "next";
import Link from "next/link";
import { MEETING_ASSISTANTS } from "@/content/investigations/meeting-assistants";
import { SECTION_STATUS_LABELS } from "@/domain/schemas/investigation";
import { formatMetric } from "@/domain/evaluation";
import { reportFor } from "@/lib/reports";
import { Blocks, type SlotName } from "@/ui/Blocks";
import { BaselineExample } from "@/ui/BaselineExample";
import { DataModeBadge, DraftGoldBadge, SyntheticBadge } from "@/ui/Badges";
import { EvidenceList } from "@/ui/EvidenceList";
import { FailureTable } from "@/ui/FailureTable";
import { LensPanel } from "@/ui/LensPanel";
import { ResultsTable } from "@/ui/ResultsTable";
import { ThesisPanel } from "@/ui/ThesisPanel";

const investigation = MEETING_ASSISTANTS;

export const metadata: Metadata = {
  title: investigation.title,
  description: investigation.summary,
};

export default function InvestigationPage() {
  const heldOut = reportFor("held-out");
  const measuredSummary = `action precision ${formatMetric(
    heldOut.metrics.actionPrecision,
  )}, action recall ${formatMetric(heldOut.metrics.actionRecall)}, and ${
    heldOut.acceptedCases
  } of ${heldOut.attemptedCases} cases accepted.`;

  const slots: Partial<Record<SlotName, React.ReactNode>> = {
    "baseline-example": <BaselineExample />,
    "results-table": <ResultsTable />,
    "failure-table": <FailureTable />,
    "lens-panel": <LensPanel measuredSummary={measuredSummary} />,
    thesis: <ThesisPanel />,
    "evidence-list": <EvidenceList />,
  };

  return (
    <article className="page article">
      {/*
        First viewport, per BRD section 4: what is being tested, what you can try,
        and whether what you are about to read is illustrative or measured.
      */}
      <header className="articleHeader">
        <p className="articleKicker">{investigation.capability}</p>
        <h1 className="articleTitle">{investigation.title}</h1>
        <p className="articleQuestion measure">{investigation.question}</p>

        <dl className="articleFacts">
          <div>
            <dt>What is being tested</dt>
            <dd>
              Whether structured meeting extraction is difficult enough to be worth
              paying for, measured on 24 synthetic transcripts with one deterministic
              method.
            </dd>
          </div>
          <div>
            <dt>What you can try</dt>
            <dd>
              <Link href="/lab/meeting-assistants">
                Run the baseline on a sample or your own transcript
              </Link>{" "}
              and compare it blind against an illustrative structured output.
            </dd>
          </div>
          <div>
            <dt>Is this illustrative or measured</dt>
            <dd>
              <span className="badgeRow">
                <DataModeBadge mode="recorded-experiment" />
                <span>
                  The benchmark in section 5 is a real archived run of a real method.
                </span>
              </span>
              <span className="badgeRow">
                <DataModeBadge mode="illustrative-demo" />
                <span>
                  The challenger output in the lab is hand-authored. No model has
                  been called anywhere in this project.
                </span>
              </span>
            </dd>
          </div>
        </dl>

        <p className="badgeRow">
          <SyntheticBadge />
          <DraftGoldBadge />
          <span className="articleUpdated">Updated {investigation.updatedAt}</span>
        </p>

        <p className="measure articleEvidenceStatus">
          {investigation.evidenceStatus}
        </p>
      </header>

      <nav className="sectionIndex" aria-labelledby="section-index-heading">
        <h2 id="section-index-heading" className="sectionIndexHeading">
          Contents
        </h2>
        <ol className="sectionIndexList">
          {investigation.sections.map((section) => (
            <li key={section.key}>
              <a href={`#${section.key}`}>
                <span className="sectionIndexNumber">{section.number}</span>
                <span className="sectionIndexTitle">{section.title}</span>
              </a>
              <span
                className={`sectionStatus sectionStatus-${section.status}`}
                data-status={section.status}
              >
                {SECTION_STATUS_LABELS[section.status]}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {investigation.sections.map((section) => (
        <section
          key={section.key}
          id={section.key}
          className="articleSection"
          aria-labelledby={`${section.key}-heading`}
        >
          <header className="articleSectionHeader">
            <p className="articleSectionNumber" aria-hidden="true">
              {section.number}
            </p>
            <h2 id={`${section.key}-heading`} className="articleSectionTitle">
              <span className="visuallyHidden">Section {section.number}. </span>
              {section.title}
            </h2>
            <span
              className={`sectionStatus sectionStatus-${section.status}`}
              data-status={section.status}
            >
              {SECTION_STATUS_LABELS[section.status]}
            </span>
          </header>
          <p className="measure articleStandfirst">{section.standfirst}</p>
          <Blocks blocks={section.blocks} slots={slots} />
        </section>
      ))}

      <footer className="articleFooter">
        <h2 className="articleSectionTitle">Limitations of this investigation</h2>
        <ul className="measure articleList">
          {investigation.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
        <p className="measure">
          <Link href="/methodology">Read the methodology</Link> for how the corpus,
          the baseline, and the metrics were built, and for the commands that
          reproduce every number above.
        </p>
      </footer>
    </article>
  );
}
