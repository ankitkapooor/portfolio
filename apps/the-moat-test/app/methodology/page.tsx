import type { Metadata } from "next";
import Link from "next/link";
import { ACCEPTANCE_THRESHOLDS } from "@/domain/evaluation";
import { CRITICAL_DEFECT_LABELS } from "@/domain/evaluation/defects";
import { REVIEW_QUEUE_KIND_LABELS } from "@/domain/evaluation/report";
import {
  MAX_CASE_WORDS,
  MIN_CASE_WORDS,
} from "@/domain/schemas/corpus";
import { SUMMARY_MAX_CHARS } from "@/domain/schemas/extraction";
import { CASE_FAMILY_LABELS } from "@/domain/schemas/primitives";
import { TAGGED_BASELINE_SPEC } from "@/domain/baseline/tagged-transcript-baseline";
import { METHODS } from "@/domain/methods";
import { getProviderStatus } from "@/server/providers";
import { MAX_TRANSCRIPT_BYTES, MAX_TRANSCRIPT_CHARS } from "@/domain/schemas/transcript-input";
import { PUBLISHED_SPLITS, reportFor, reviewQueueFor, SPLIT_LABELS } from "@/lib/reports";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the corpus, the baseline, the metrics, and the acceptance criteria were built, and the commands that reproduce every published number.",
};

export default function MethodologyPage() {
  const provider = getProviderStatus();
  const heldOut = reportFor("held-out");

  const queueCounts = PUBLISHED_SPLITS.map((split) => {
    const queue = reviewQueueFor(split);
    const byKind = new Map<string, number>();
    for (const item of queue) {
      byKind.set(item.kind, (byKind.get(item.kind) ?? 0) + 1);
    }
    return { split, total: queue.length, byKind };
  });

  return (
    <div className="page prose">
      <h1 className="pageTitle">Methodology</h1>
      <p className="measure pageStandfirst">
        Everything published in the investigation comes from artifacts in{" "}
        <code>experiments/runs/</code> that four command-line tools produced. This
        page states what those tools do, what the numbers mean, and what they cannot
        mean.
      </p>

      <section aria-labelledby="corpus-heading">
        <h2 id="corpus-heading" className="pageSectionTitle">
          The corpus
        </h2>
        <p className="measure">
          24 transcripts of {MIN_CASE_WORDS}–{MAX_CASE_WORDS} words, written for this
          benchmark. Every one is synthetic: no real meeting, person, or company is
          represented, and no recording was used. They are split twelve development
          and twelve held-out, with two cases from each family in each split, and the
          splits share no transcript text.
        </p>
        <ul className="measure articleList">
          {Object.values(CASE_FAMILY_LABELS).map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
        <p className="measure note noteLimitation">
          Gold annotations were drafted by a coding agent, not by a person. Every case
          records <code>humanReviewed: false</code> and{" "}
          <code>reviewerId: null</code>. An agent writing its own answer key is not
          review, and no number on this site should be read as if it had been
          checked. See <Link href="/evidence/EV-003">EV-003</Link>.
        </p>
      </section>

      <section aria-labelledby="contract-heading">
        <h2 id="contract-heading" className="pageSectionTitle">
          The extraction contract
        </h2>
        <p className="measure">
          Every method must return the same closed shape: a summary of at most{" "}
          {SUMMARY_MAX_CHARS} characters, decisions with a status of current,
          superseded, or unresolved, actions whose owner may be null and whose date
          may remain the original phrasing, plus open questions and uncertainties.
          Each decision and action cites the transcript lines it came from. Unknown
          fields are rejected, so a model confidence score is a validation failure
          rather than a tolerated extra.
        </p>
      </section>

      <section aria-labelledby="baseline-heading">
        <h2 id="baseline-heading" className="pageSectionTitle">
          The baseline
        </h2>
        <p className="measure">
          {METHODS["tagged-transcript-baseline"].summary}{" "}
          <strong>{METHODS["tagged-transcript-baseline"].isNot}</strong> The rule set
          is frozen and its hash is recorded in every run, so changing a rule
          invalidates comparisons against archived runs rather than silently changing
          the numbers.
        </p>
        <pre className="specBlock">{TAGGED_BASELINE_SPEC}</pre>
      </section>

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="pageSectionTitle">
          How the metrics are defined
        </h2>
        <ul className="measure articleList">
          <li>
            Matching between predicted and gold items is one-to-one and greedy on
            normalised text. A duplicate prediction cannot match a second gold item,
            so repeating an answer cannot raise recall.
          </li>
          <li>
            A near miss is not scored. It is recorded as needing human adjudication
            and appears in the review queue.
          </li>
          <li>
            Precision is N/A when nothing was predicted; recall is N/A when the case
            has no gold actions. N/A is rendered as N/A with its reason, never as
            zero and never as infinity.
          </li>
          <li>
            Invented owners and dates resolved where the transcript supports none are
            reported as their own measures, not folded into accuracy.
          </li>
          <li>
            Citation coverage (did the item cite anything), citation validity (does
            the cited line exist), and citation support (does the line actually
            support the claim) are three measures. The third needs a reader and is
            reported as pending, not estimated.
          </li>
          <li>
            Cost per accepted case puts all measured spend in the numerator,
            including failed attempts and retries, and reads &ldquo;No accepted
            cases&rdquo; when nothing was accepted.
          </li>
          <li>
            There is no overall score. The measures have different denominators and
            no weighting is defensible, so none is applied.
          </li>
        </ul>
      </section>

      <section aria-labelledby="acceptance-heading">
        <h2 id="acceptance-heading" className="pageSectionTitle">
          Acceptance criteria
        </h2>
        <p className="measure">
          A case is accepted only if all of the following hold. One critical defect
          disqualifies a case however well it scored elsewhere.
        </p>
        <ul className="measure articleList">
          <li>
            Zero critical defects. This applies before anything else is considered.
          </li>
          <li>
            Action recall at least{" "}
            {ACCEPTANCE_THRESHOLDS.minActionRecall.toFixed(2)}, where the case has
            gold actions to recall.
          </li>
          <li>
            Owner accuracy {ACCEPTANCE_THRESHOLDS.minOwnerAccuracy.toFixed(2)}: every
            matched action whose gold owner is a named person must name that person.
          </li>
          <li>
            Where the case has no gold actions, extracting any action fails the case.
            The correct output for a meeting that produced nothing is nothing.
          </li>
          <li>Every extracted item must cite at least one transcript line.</li>
          <li>Every cited line id must exist in the transcript.</li>
        </ul>
        <p className="measure fieldLabel">What counts as a critical defect</p>
        <ul className="measure articleList">
          {Object.values(CRITICAL_DEFECT_LABELS).map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reproduce-heading">
        <h2 id="reproduce-heading" className="pageSectionTitle">
          Reproducing the numbers
        </h2>
        <p className="measure">
          Run these in order. The run directory is refused if it already exists, so an
          archived run cannot be overwritten in place.
        </p>
        <pre className="specBlock">{`npm run validate-content

npm run run-benchmark -- \\
  --method tagged-transcript-baseline \\
  --split held-out \\
  --corpus-version ${heldOut.corpusVersion} \\
  --max-cost 0

npm run evaluate-run -- --run ${heldOut.runId}

npm run build-report -- --run ${heldOut.runId}`}</pre>
        <p className="measure">
          <code>run-benchmark</code> records the corpus hash. If the corpus changes
          afterwards, <code>evaluate-run</code> marks the run not comparable and the
          results table says so instead of publishing a stale number.
        </p>
      </section>

      <section aria-labelledby="provider-heading">
        <h2 id="provider-heading" className="pageSectionTitle">
          Model provider
        </h2>
        <p className="measure note noteLimitation">
          {provider.configured
            ? `Configured: ${provider.providerId} / ${provider.model}.`
            : provider.reason}
        </p>
        <p className="measure">
          The provider interface and the frozen extraction prompt exist so that a live
          adapter can be added later. Nothing in this deployment simulates one: asking{" "}
          <code>run-benchmark</code> for the AI method reports that the provider is
          not configured and writes no run.
        </p>
      </section>

      <section aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="pageSectionTitle">
          Input limits
        </h2>
        <p className="measure">
          A pasted or uploaded transcript is rejected above{" "}
          {(MAX_TRANSCRIPT_BYTES / 1000).toFixed(0)} KB of UTF-8 or{" "}
          {MAX_TRANSCRIPT_CHARS.toLocaleString("en-GB")} characters, whichever binds
          first, and a file that is not valid UTF-8 is rejected rather than decoded
          with replacement characters. Both limits are checked, because a file can
          pass one and fail the other.
        </p>
      </section>

      <section aria-labelledby="review-heading">
        <h2 id="review-heading" className="pageSectionTitle">
          What a human still has to do
        </h2>
        <p className="measure">
          Every archived run writes a review queue. These items are not blocked on
          code; they are blocked on a person reading transcripts and making
          judgments.
        </p>
        <div className="tableScroll">
          <table className="table">
            <caption>
              Pending review items by run. Nothing in this queue has been actioned.
            </caption>
            <thead>
              <tr>
                <th scope="col">Run</th>
                {Object.values(REVIEW_QUEUE_KIND_LABELS).map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {queueCounts.map((row) => (
                <tr key={row.split}>
                  <th scope="row">{SPLIT_LABELS[row.split]}</th>
                  {Object.keys(REVIEW_QUEUE_KIND_LABELS).map((kind) => (
                    <td key={kind} className="numeric">
                      {row.byKind.get(kind) ?? 0}
                    </td>
                  ))}
                  <td className="numeric">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="licence-heading">
        <h2 id="licence-heading" className="pageSectionTitle">
          Corpus licence and provenance
        </h2>
        <p className="measure">
          The 24 transcripts were written for this benchmark and are released under
          CC0 1.0 so that anyone can reuse or contest them. They contain no recorded
          audio, no scraped text, and no personal data. Names are invented and any
          resemblance to a real person or company is accidental. The full note lives
          in <code>experiments/corpus/LICENCE.md</code>.
        </p>
      </section>
    </div>
  );
}
