import Link from "next/link";
import { MEETING_ASSISTANTS } from "@/content/investigations/meeting-assistants";
import { formatMetric } from "@/domain/evaluation";
import { EVIDENCE } from "@/content/evidence";
import { reportFor } from "@/lib/reports";
import { DataModeBadge, DraftGoldBadge, SyntheticBadge } from "@/ui/Badges";

export default function HomePage() {
  const investigation = MEETING_ASSISTANTS;
  const heldOut = reportFor("held-out");
  const measuredCount = EVIDENCE.filter((r) => r.type === "measured").length;
  const hypothesisCount = EVIDENCE.filter((r) => r.type === "hypothesis").length;

  return (
    <div className="page home">
      <section className="homeIntro">
        <h1 className="homeTitle">
          What is still worth building when the feature is easy to copy?
        </h1>
        <p className="measure homeStandfirst">
          The Moat Test takes one AI product category at a time, builds the part
          everyone assumes is the product, measures where it fails, and publishes the
          limits of the measurement next to the result.
        </p>
        <p className="badgeRow">
          <SyntheticBadge />
          <DraftGoldBadge />
        </p>
      </section>

      <section className="homeFeature" aria-labelledby="feature-heading">
        <p className="articleKicker">Investigation 01 · {investigation.capability}</p>
        <h2 id="feature-heading" className="homeFeatureTitle">
          <Link href={`/investigations/${investigation.slug}`}>
            {investigation.title}: {investigation.question}
          </Link>
        </h2>
        <p className="measure homeFeatureSummary">{investigation.summary}</p>

        <dl className="homeFacts">
          <div>
            <dt>Held-out action precision</dt>
            <dd className="numeric">
              {formatMetric(heldOut.metrics.actionPrecision)}
            </dd>
          </div>
          <div>
            <dt>Held-out action recall</dt>
            <dd className="numeric">
              {formatMetric(heldOut.metrics.actionRecall)}
            </dd>
          </div>
          <div>
            <dt>Cases accepted</dt>
            <dd className="numeric">
              {heldOut.acceptedCases} of {heldOut.attemptedCases}
            </dd>
          </div>
          <div>
            <dt>Critical defects</dt>
            <dd className="numeric">{heldOut.criticalDefectCount}</dd>
          </div>
        </dl>
        <p className="measure homeFactsNote">
          One deterministic method, one archived run, twelve held-out synthetic
          transcripts. There is no overall score because the measures do not share a
          denominator.
        </p>

        <p className="homeActions">
          <Link className="button" href={`/investigations/${investigation.slug}`}>
            Read the investigation
          </Link>
          <Link className="button buttonSecondary" href={`/lab/${investigation.slug}`}>
            Try it in the lab
          </Link>
        </p>
      </section>

      <section className="homeHonesty" aria-labelledby="honesty-heading">
        <h2 id="honesty-heading">What this is not</h2>
        <ul className="measure articleList">
          <li>
            Not a product review. No commercial meeting assistant has been tested and
            no vendor is named anywhere in the results.
          </li>
          <li>
            Not a model evaluation. No model provider is configured in this
            deployment and no model has been called.
          </li>
          <li>
            Not user research. No interviews have been conducted, so the ledger holds{" "}
            {hypothesisCount} hypotheses and zero interview records.
          </li>
          <li>
            Not peer-reviewed. The gold annotations were drafted by a coding agent and
            are waiting for a human to check them.
          </li>
        </ul>
        <p className="measure">
          The <Link href="/evidence">evidence ledger</Link> holds {EVIDENCE.length}{" "}
          records, {measuredCount} of them measured. Every claim in the investigation
          links to one, and a claim citing a record that does not exist fails content
          validation before it can be published.
        </p>
      </section>

      <section className="homeIllustrative" aria-labelledby="modes-heading">
        <h2 id="modes-heading">How to read the labels</h2>
        <dl className="modeLegend">
          <div>
            <dt>
              <DataModeBadge mode="recorded-experiment" />
            </dt>
            <dd>
              Output from an actual execution of a named method, preserved with its
              run metadata and scored against the corpus.
            </dd>
          </div>
          <div>
            <dt>
              <DataModeBadge mode="illustrative-demo" />
            </dt>
            <dd>
              Hand-authored by the author to show the shape of the output contract. It
              is not a result and carries no performance claim.
            </dd>
          </div>
          <div>
            <dt>
              <DataModeBadge mode="live-trial" />
            </dt>
            <dd>
              Would be output from a configured model provider. None is configured, so
              this mode never appears.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
