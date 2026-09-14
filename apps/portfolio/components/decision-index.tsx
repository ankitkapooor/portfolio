import Link from "next/link";
import { projectPath } from "@/content/projects";
import type { Project } from "@/lib/content-validation";
import styles from "./decision-index.module.css";

export function DecisionIndex({ projects }: { projects: readonly Project[] }) {
  return (
    <nav className={styles.index} aria-labelledby="decisions-heading">
      <h2 id="decisions-heading" className={styles.heading}>
        The Decisions
      </h2>
      <ol className={styles.list}>
        {projects.map((project) => (
          <li key={project.slug} className={styles.item}>
            <Link className={styles.link} href={projectPath(project)}>
              <span className={styles.number} aria-hidden="true">
                {project.number}
              </span>
              <span className={styles.copy}>
                <span className={styles.question}>{project.question}</span>
                <span className={styles.domain}>{project.decisionDomain}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
