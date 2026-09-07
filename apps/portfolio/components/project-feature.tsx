import type { CSSProperties } from "react";
import Link from "next/link";
import type { Project } from "@/lib/content-validation";
import { projectPath } from "@/content/projects";
import { EvidenceFigure } from "@/components/evidence-figure";
import { ProjectActions, ProjectStatus } from "@/components/project-meta";
import styles from "./project-feature.module.css";

type ProjectFeatureProps = {
  project: Project;
  /** Position in the list, used to alternate the 5/7 and 7/5 proportion. */
  index: number;
};

export function ProjectFeature({ project, index }: ProjectFeatureProps) {
  const variant = index % 2 === 0 ? styles.variantA : styles.variantB;

  return (
    <article
      className={`${styles.feature} ${variant}`}
      style={
        { "--page-accent": `var(${project.accentVar})` } as CSSProperties
      }
    >
      <div className={styles.head}>
        <p className={styles.number}>Project {project.number}</p>
        <h3 className={styles.title}>
          <Link className={styles.titleLink} href={projectPath(project)}>
            {project.title}
          </Link>
        </h3>
        <p className={styles.question}>{project.question}</p>
      </div>

      <div className={styles.figure}>
        <EvidenceFigure assetId={project.coverAsset} />
      </div>

      <div className={styles.body}>
        <p className={styles.capability}>{project.capability}</p>
        <p className={styles.summary}>{project.summary}</p>
        <ProjectStatus project={project} />
        <ProjectActions project={project} />
      </div>
    </article>
  );
}
