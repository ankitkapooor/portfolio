import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projectPath, projects } from "@/content/projects";
import { siteOrigin } from "@/content/site";
import { EvidenceFigure } from "@/components/evidence-figure";
import { ProjectOverview } from "@/components/project-overview";
import { ProjectActions, ProjectStatus } from "@/components/project-meta";
import {
  evidenceStatusLabels,
  hasLaunchAction,
  statusDescriptions,
  type Project,
} from "@/lib/content-validation";
import styles from "./page.module.css";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: `${project.title} — ${project.question}`,
    description: project.purpose,
    // Canonical stays off until a real origin is configured (content/site.ts).
    ...(siteOrigin
      ? { alternates: { canonical: projectPath(project) } }
      : {}),
    openGraph: {
      type: "article",
      title: `${project.title} — ${project.question}`,
      description: project.purpose,
    },
  };
}

/** Contents rail entries. Order matches the document order below. */
const SECTIONS = [
  { id: "overview", label: "System at a glance" },
  { id: "brief", label: "Decision record" },
  { id: "context", label: "Context and decision" },
  { id: "alternatives", label: "Alternatives considered" },
  { id: "method", label: "Method and model" },
  { id: "evidence", label: "Evidence and results" },
  { id: "interpretation", label: "Interpretation" },
  { id: "limitations", label: "Limitations" },
  { id: "next-test", label: "Next test" },
  { id: "sources", label: "Sources" },
  { id: "authorship", label: "Authorship" },
] as const;

function Paragraphs({ text }: { text: readonly string[] }) {
  return (
    <div className={styles.sectionBody}>
      {text.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function CasePage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const others: Project[] = projects.filter((item) => item.slug !== slug);

  return (
    <main
      id="main"
      className={styles.main}
      style={
        { "--page-accent": `var(${project.accentVar})` } as CSSProperties
      }
    >
      {/* ---- Header ------------------------------------------------- */}
      <header className={`container grid ${styles.header}`}>
        <div className={styles.headerBody}>
          <Link className={styles.backLink} href="/#work">
            ← All work
          </Link>

          <p className={styles.number}>Project {project.number}</p>
          <p className={styles.domain}>{project.decisionDomain}</p>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.question}>{project.question}</p>
          <p className={styles.purpose}>{project.purpose}</p>

          <div className={styles.metaBlock}>
            <ProjectStatus project={project} withNote />
            <ProjectActions project={project} showCaseLink={false} />
            {/* Explains the absent launch action. The reason differs: concept
                software does not exist, a prototype's is simply unreachable. */}
            {!hasLaunchAction(project) ? (
              <p className={styles.noDemo}>
                {project.status === "concept"
                  ? "There is no demo to launch yet. The case below is the whole of it."
                  : "The demo runs, but it is not publicly reachable, so there is nothing to launch from here. The case below is what can be read."}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className={`container ${styles.figureBlock}`}>
        <EvidenceFigure assetId={project.coverAsset} showSource />
      </div>

      <ProjectOverview project={project} />

      {/* ---- Decision record --------------------------------------- */}
      <section
        id="brief"
        className={`container ${styles.brief}`}
        aria-labelledby="brief-heading"
      >
        <div className={styles.briefHead}>
          <h2 id="brief-heading" className={styles.briefTitle}>
            Decision record
          </h2>
          <p className={styles.briefNote}>
            Evidence: {evidenceStatusLabels[project.evidenceStatus]}
          </p>
        </div>

        <dl className={styles.briefList}>
          {(
            [
              ["Decision", project.brief.decision],
              ["Position", project.brief.position],
              ["Evidence", project.brief.evidence],
              ["Trade-off", project.brief.tradeoff],
              ["Uncertainty", project.brief.uncertainty],
            ] as const
          ).map(([term, detail]) => (
            <div key={term} className={styles.briefRow}>
              <dt className={styles.briefTerm}>{term}</dt>
              <dd className={styles.briefDetail}>{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Body -------------------------------------------------- */}
      <div className={`container ${styles.bodyWrap}`}>
        <nav className={styles.rail} aria-label="Contents">
          <p className={styles.railTitle}>Contents</p>
          <ul className={styles.railList}>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <article className={styles.article}>
          <section
            id="context"
            className={styles.section}
            aria-labelledby="context-heading"
          >
            <h2 id="context-heading" className={styles.sectionTitle}>
              Context and decision
            </h2>
            <Paragraphs text={project.sections.context} />
          </section>

          <section
            id="alternatives"
            className={styles.section}
            aria-labelledby="alternatives-heading"
          >
            <h2 id="alternatives-heading" className={styles.sectionTitle}>
              Alternatives considered
            </h2>
            <ul className={styles.records}>
              {project.alternatives.map((alternative) => (
                <li key={alternative.option} className={styles.record}>
                  <h3 className={styles.recordTitle}>{alternative.option}</h3>
                  <p className={styles.recordText}>
                    <span className={styles.recordLabel}>For</span>
                    {alternative.argument}
                  </p>
                  <p className={styles.recordText}>
                    <span className={styles.recordLabel}>Against</span>
                    {alternative.objection}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="method"
            className={styles.section}
            aria-labelledby="method-heading"
          >
            <h2 id="method-heading" className={styles.sectionTitle}>
              Method and model
            </h2>
            <Paragraphs text={project.sections.methodAndModel} />
          </section>

          <section
            id="evidence"
            className={styles.section}
            aria-labelledby="evidence-heading"
          >
            <h2 id="evidence-heading" className={styles.sectionTitle}>
              Evidence and results
            </h2>
            <Paragraphs text={project.sections.evidenceAndResults} />
            <ul className={styles.records}>
              {project.evidence.map((item) => (
                <li key={item.id} className={styles.record}>
                  <h3 className={styles.recordTitle}>{item.label}</h3>
                  <p className={styles.recordText}>
                    <span className={styles.recordLabel}>
                      {evidenceStatusLabels[item.status]}
                    </span>
                    {item.detail}
                  </p>
                  <p className={styles.recordId}>
                    Sources:{" "}
                    {item.sourceRefs.map((ref, index) => (
                      <span key={ref}>
                        {index > 0 ? ", " : null}
                        <a href={`#${ref}`}>{ref}</a>
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="interpretation"
            className={styles.section}
            aria-labelledby="interpretation-heading"
          >
            <h2 id="interpretation-heading" className={styles.sectionTitle}>
              Interpretation
            </h2>
            <Paragraphs text={project.sections.interpretation} />
            <ul className={styles.records}>
              {project.tradeoffs.map((tradeoff) => (
                <li key={tradeoff.label} className={styles.record}>
                  <h3 className={styles.recordTitle}>
                    <span className={styles.recordLabel}>Trade-off</span>
                    {tradeoff.label}
                  </h3>
                  <p className={styles.recordText}>{tradeoff.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="limitations"
            className={styles.section}
            aria-labelledby="limitations-heading"
          >
            <h2 id="limitations-heading" className={styles.sectionTitle}>
              Limitations
            </h2>
            <Paragraphs text={project.sections.limitations} />
            <ul className={styles.records}>
              {project.uncertainties.map((uncertainty) => (
                <li key={uncertainty.label} className={styles.record}>
                  <h3 className={styles.recordTitle}>
                    <span className={styles.recordLabel}>Open</span>
                    {uncertainty.label}
                  </h3>
                  <p className={styles.recordText}>{uncertainty.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="next-test"
            className={styles.section}
            aria-labelledby="next-test-heading"
          >
            <h2 id="next-test-heading" className={styles.sectionTitle}>
              Next test
            </h2>
            <Paragraphs text={project.sections.nextTest} />
          </section>

          <section
            id="sources"
            className={styles.section}
            aria-labelledby="sources-heading"
          >
            <h2 id="sources-heading" className={styles.sectionTitle}>
              Sources
            </h2>
            <ul className={styles.records}>
              {project.sourceRefs.map((ref) => (
                <li key={ref.id} id={ref.id} className={styles.record}>
                  <h3 className={styles.recordTitle}>
                    <span className={styles.recordId}>{ref.id}</span>{" "}
                    {ref.label}
                  </h3>
                  <p className={styles.recordText}>{ref.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="authorship"
            className={styles.authorship}
            aria-labelledby="authorship-heading"
          >
            <h2 id="authorship-heading" className={styles.authorshipTitle}>
              Authorship and review
            </h2>
            <dl className={styles.authorshipList}>
              {(
                [
                  ["Ankit's contribution", project.ownerContribution],
                  ["AI-assisted implementation", project.implementationDisclosure],
                  ["Human review", project.humanReviewStatus],
                  ["Status", statusDescriptions[project.status]],
                ] as const
              ).map(([term, detail]) => (
                <div key={term} className={styles.authorshipRow}>
                  <dt className={styles.authorshipTerm}>{term}</dt>
                  <dd className={styles.authorshipDetail}>{detail}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.dates}>
              Published{" "}
              <time dateTime={project.publishedAt}>
                {formatDate(project.publishedAt)}
              </time>
              . Last updated{" "}
              <time dateTime={project.updatedAt}>
                {formatDate(project.updatedAt)}
              </time>
              .
            </p>
          </section>
        </article>
      </div>

      {/* ---- Other cases ------------------------------------------- */}
      <nav
        className={`container ${styles.caseFooter}`}
        aria-labelledby="other-cases-heading"
      >
        <p id="other-cases-heading" className={styles.caseFooterTitle}>
          Other cases
        </p>
        <ul className={styles.caseFooterList}>
          {others.map((other) => (
            <li key={other.slug}>
              <Link className={styles.caseFooterLink} href={projectPath(other)}>
                <span className={styles.caseFooterMeta}>
                  Project {other.number}
                </span>
                {other.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
