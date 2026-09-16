import type { CSSProperties } from "react";
import Link from "next/link";
import { EvidenceFigure } from "@/components/evidence-figure";
import { ProjectActions, ProjectStatus } from "@/components/project-meta";
import { projectPath } from "@/content/projects";
import type { Project } from "@/lib/content-validation";
import styles from "./featured-system.module.css";

export function FeaturedSystem({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <article
      className={`${styles.system} ${priority ? styles.priority : ""}`}
      style={{ "--page-accent": `var(${project.accentVar})` } as CSSProperties}
    >
      <div className={styles.content}>
        <div className={styles.intro}>
          <p className={styles.kicker}>
            <span>System {project.number}</span>
            <span>{project.decisionDomain}</span>
          </p>
          <h3 className={styles.title}>
            <Link href={projectPath(project)}>{project.title}</Link>
          </h3>
          <p className={styles.question}>{project.question}</p>
        </div>

        <div className={styles.body}>
          <p className={styles.summary}>{project.summary}</p>
          <ProjectStatus project={project} />
          <ProjectActions project={project} primaryLaunch />
        </div>
      </div>
      <div className={styles.figure}>
        <EvidenceFigure assetId={project.coverAsset} />
      </div>
    </article>
  );
}
