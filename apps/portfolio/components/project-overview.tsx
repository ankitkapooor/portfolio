import { ProjectActions } from "@/components/project-meta";
import { hasLaunchAction, type Project } from "@/lib/content-validation";
import styles from "./project-overview.module.css";

export function ProjectOverview({ project }: { project: Project }) {
  return (
    <section
      id="overview"
      className={`container ${styles.overview}`}
      aria-labelledby="overview-heading"
    >
      <div className={styles.head}>
        <p className={styles.eyebrow}>{project.decisionDomain}</p>
        <h2 id="overview-heading" className={styles.title}>
          System at a glance
        </h2>
      </div>

      <dl className={styles.summary}>
        <div className={styles.summaryRow}>
          <dt>The decision</dt>
          <dd>{project.brief.decision}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt>Why it matters</dt>
          <dd>{project.whyItMatters}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt>The system</dt>
          <dd>{project.purpose}</dd>
        </div>
      </dl>

      <div className={styles.workflow}>
        <h3 className={styles.subhead}>How it works</h3>
        <ol className={styles.steps}>
          {project.workflow.map((step, index) => (
            <li key={step} className={styles.step}>
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.output}>
        <div>
          <h3 className={styles.subhead}>Decision output</h3>
          <p>{project.decisionOutput}</p>
        </div>
        {hasLaunchAction(project) ? (
          <div className={styles.tryIt}>
            <p className={styles.subhead}>Try it</p>
            <ProjectActions project={project} showCaseLink={false} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
