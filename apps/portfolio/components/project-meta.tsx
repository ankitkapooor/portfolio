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
 * `hasLaunchAction`, and both are required. A demo that runs but is not hosted
 * has no URL and so gets no button. Absence is the default path: nothing is
 * rendered in its place and no disabled control is left on the page. Recording
 * a reachable `demoUrl` in content is all it takes for the button to appear.
 */
export function ProjectActions({
  project,
  /** The case link is redundant on the case page itself. */
  showCaseLink = true,
  /** Featured systems lead with the live product rather than the case. */
  primaryLaunch = false,
}: {
  project: Project;
  showCaseLink?: boolean;
  primaryLaunch?: boolean;
}) {
  const launch = hasLaunchAction(project);
  const external = project.demoTarget === "external";

  const launchAction = launch && project.demoUrl ? (
    <a
      className={!showCaseLink || primaryLaunch ? "button" : "buttonQuiet"}
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
  ) : null;

  return (
    <div className={styles.actions}>
      {primaryLaunch ? launchAction : null}

      {showCaseLink ? (
        <Link
          className={primaryLaunch ? "buttonQuiet" : "button"}
          href={projectPath(project)}
        >
          Read the case
          <span className="visuallyHidden">: {project.title}</span>
        </Link>
      ) : null}

      {!primaryLaunch ? launchAction : null}

      {launch && external ? (
        <span className={styles.externalHint} aria-hidden="true">
          Opens in a new tab
        </span>
      ) : null}
    </div>
  );
}
