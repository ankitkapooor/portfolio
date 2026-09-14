import type { Metadata } from "next";
import { approachSteps } from "@/content/approach";
import {
  evidenceStatusLabels,
  statusDescriptions,
  statusLabels,
  type EvidenceStatus,
  type ProjectStatus,
} from "@/lib/content-validation";
import { siteOrigin } from "@/content/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Method",
  description:
    "How each project is investigated, and what the status and evidence labels on this site mean.",
  ...(siteOrigin ? { alternates: { canonical: "/method" } } : {}),
};

const STATUS_ORDER: ProjectStatus[] = ["concept", "prototype", "published"];

const EVIDENCE_ORDER: EvidenceStatus[] = [
  "illustrative",
  "measured-partial",
  "reviewed",
];

const EVIDENCE_MEANINGS: Record<EvidenceStatus, string> = {
  illustrative:
    "Hand-authored or specified content used to show structure. No performance claim of any kind.",
  "measured-partial":
    "Real output from a recorded run, archived with its run metadata. Covers part of the question, not all of it.",
  reviewed:
    "Measured evidence that a person has actually reviewed against a stated rubric.",
};

export default function MethodPage() {
  return (
    <main id="main" className={styles.main}>
      <header className={`container grid ${styles.header}`}>
        <div className={styles.headerBody}>
          <p className={styles.eyebrow}>Method</p>
          <h1 className={styles.title}>How I approach a question</h1>
          <p className={styles.standfirst}>
            <strong>
              AI interprets. Data grounds. Models expose trade-offs. Humans
              decide.
            </strong>
          </p>
          <p className={styles.principleNote}>
            This is not a rule against language models. It is a rule about
            where judgment comes from: use models for interpretation and
            unstructured information, without allowing generated language to
            replace arithmetic, evidence, or accountable strategic judgment.
          </p>
        </div>
      </header>

      <div className="container">
        <ol className={styles.steps}>
          {approachSteps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.stepHead}>
                <p className={styles.stepIndex}>
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepLede}>{step.body}</p>
              </div>
              <div className={styles.stepBody}>
                {step.detail.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <section className={styles.labels} aria-labelledby="labels-heading">
          <h2 id="labels-heading" className={styles.labelsTitle}>
            What the labels mean
          </h2>
          <p className={styles.labelsIntro}>
            Every project carries two labels, and they are separate claims. One
            describes the software; the other describes the evidence. A project
            can have a working demo and no measured results, or specified
            evidence and no software at all. A successful build is never a
            reason to move either label.
          </p>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>Project status — a claim about the software</caption>
              <thead>
                <tr>
                  <th scope="col">Label</th>
                  <th scope="col">What it means</th>
                </tr>
              </thead>
              <tbody>
                {STATUS_ORDER.map((status) => (
                  <tr key={status}>
                    <th scope="row">{statusLabels[status]}</th>
                    <td>{statusDescriptions[status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>Evidence status — a claim about the findings</caption>
              <thead>
                <tr>
                  <th scope="col">Label</th>
                  <th scope="col">What it means</th>
                </tr>
              </thead>
              <tbody>
                {EVIDENCE_ORDER.map((status) => (
                  <tr key={status}>
                    <th scope="row">{evidenceStatusLabels[status]}</th>
                    <td>{EVIDENCE_MEANINGS[status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.labelsIntro}>
            All five projects are currently Prototype: the software runs and
            each one is deployed where you can reach it. Market Entry War Room,
            Narrative vs. Numbers, and The Moat Test carry Measured, partial
            evidence; Disrupt This Business and Priced In remain Illustrative.
            No case publishes a universal recommendation, because software that
            runs is not a finding.
          </p>
        </section>
      </div>
    </main>
  );
}
