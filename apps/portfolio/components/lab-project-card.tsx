import type { CSSProperties } from "react";
import Link from "next/link";
import { Schematic } from "@/components/schematics";
import { isSchematicId } from "@/components/schematics/ids";
import { ProjectActions, ProjectStatus } from "@/components/project-meta";
import { projectPath } from "@/content/projects";
import type { Project } from "@/lib/content-validation";
import styles from "./lab-project-card.module.css";

export function LabProjectCard({ project }: { project: Project }) {
  return (
    <article
      className={styles.card}
      style={{ "--page-accent": `var(${project.accentVar})` } as CSSProperties}
    >
      {isSchematicId(project.coverAsset) ? (
        <Link href={projectPath(project)} className={styles.artwork} aria-label={`Explore ${project.title}`}>
          <span className={styles.artworkLabel}>System {project.number} / schematic <span aria-hidden="true">↗</span></span>
          <div aria-hidden="true"><Schematic id={project.coverAsset} /></div>
        </Link>
      ) : null}
      <p className={styles.meta}>
        <span>{project.number}</span>
        <span>{project.decisionDomain}</span>
      </p>
      <h3 className={styles.title}>
        <Link href={projectPath(project)}>{project.title}</Link>
      </h3>
      <p className={styles.question}>{project.question}</p>
      <p className={styles.summary}>{project.summary}</p>
      <div className={styles.footer}>
        <ProjectStatus project={project} />
        <ProjectActions project={project} />
      </div>
    </article>
  );
}
