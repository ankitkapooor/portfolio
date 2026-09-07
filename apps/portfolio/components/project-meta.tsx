import Link from "next/link";
import {
  evidenceStatusLabels,
  hasLaunchAction,
  statusDescriptions,
  statusLabels,
  type Project,
} from "@/lib/content-validation";
import { projectPath } from "@/content/projects";
import styles from "./project-meta.module.css";

/** Status and evidence label. Both fields are shown; they are separate claims. */
export function ProjectStatus({
  project,
  withNote = false,
}: {
  project: Project;
  withNote?: boolean;
}) {
  return (
    <p className={styles.statusRow}>
      <span className={styles.status}>
        <span
          className={`${styles.statusDot} ${
            project.status === "concept" ? styles.statusDotConcept : ""
          }`}
          aria-hidden="true"
        />
        Status: {statusLabels[project.status]}
      </span>
      <span className={styles.evidence}>
        Evidence: {evidenceStatusLabels[project.evidenceStatus]}
      </span>
      {withNote ? (
        <span className={styles.statusNote}>
          {statusDescriptions[project.status]}
        </span>
      ) : null}
    </p>
  );
}

/**
 * Actions for a project.
 *
 * The launch action is derived entirely from `status` and `demoUrl` via
 * `hasLaunchAction`. Absence is the default path: when a project has no
 * runnable demo, nothing is rendered in its place and no disabled control is
 * left on the page. Setting `status` and `demoUrl` in content is all it takes
 * for the launch button to appear.
 */
export function ProjectActions({
  project,
  /** The case link is redundant on the case page itself. */
  showCaseLink = true,
}: {
  project: Project;
  showCaseLink?: boolean;
}) {
  const launch = hasLaunchAction(project);
  const external = project.demoTarget === "external";

  return (
    <div className={styles.actions}>
      {showCaseLink ? (
        <Link className="button" href={projectPath(project)}>
          Read the case
          <span className="visuallyHidden">: {project.title}</span>
        </Link>
      ) : null}

      {launch && project.demoUrl ? (
        <>
          <a
            className={showCaseLink ? "buttonQuiet" : "button"}
            href={project.demoUrl}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {project.demoLabel}
            {external ? (
              <span className="visuallyHidden"> (opens in a new tab)</span>
            ) : null}
          </a>
          {external ? (
            <span className={styles.externalHint} aria-hidden="true">
              Opens in a new tab
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
