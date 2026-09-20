import type { Metadata } from "next";
import { moreProjects, githubProfile } from "@/content/more-projects";
import { siteOrigin } from "@/content/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "More Projects",
  description:
    "Engineering systems, computational models, and domain engines by Ankit Kapoor outside the five core strategic cases.",
  ...(siteOrigin ? { alternates: { canonical: "/more-projects" } } : {}),
  openGraph: {
    title: "More Projects — Ankit Kapoor",
    description:
      "Engineering systems, computational models, and domain engines outside the five core strategic cases.",
  },
};

export default function MoreProjectsPage() {
  return (
    <main id="main" className={styles.main}>
      <header className={`container ${styles.header}`}>
        <div className={styles.headerBody}>
          <p className={styles.eyebrow}>Engineering &amp; Specialized Systems</p>
          <h1 className={styles.title}>More Projects</h1>
          <p className={styles.standfirst}>
            Working systems outside the core strategic cases.
          </p>
          <p className={styles.introNote}>
            Alongside the five decision systems featured on the portfolio, I build domain-specific
            engines, computational experiments, and valuation workbenches. Each project operates on
            a live deployed demo and open-source codebase, holding the same commitment to visible assumptions,
            reproducible pipelines, and mathematical rigor.
          </p>
        </div>
      </header>

      <section className={`container ${styles.projectsList}`} aria-label="Projects list">
        {moreProjects.map((project) => (
          <article key={project.slug} className={styles.projectCard}>
            <div className={styles.cardHeader}>
              <span className={styles.domain}>{project.domain}</span>
              <span className={styles.statusBadge}>
                <span className={styles.statusDot} aria-hidden="true" />
                {project.statusLabel}
              </span>
            </div>

            <div className={styles.cardBody}>
              <h2 className={styles.projectTitle}>{project.title}</h2>
              <p className={styles.projectQuestion}>{project.question}</p>
              <p className={styles.projectSummary}>{project.summary}</p>

              <div className={styles.highlightsBlock}>
                <h3 className={styles.highlightsTitle}>Key Architecture &amp; Mechanics</h3>
                <ul className={styles.highlightsList}>
                  {project.highlights.map((highlight, idx) => {
                    const [head, ...rest] = highlight.split(":");
                    return (
                      <li key={idx} className={styles.highlightItem}>
                        {rest.length > 0 ? (
                          <>
                            <strong>{head}:</strong> {rest.join(":")}
                          </>
                        ) : (
                          highlight
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className={styles.techStack} aria-label="Technologies used">
                {project.technologies.map((tech) => (
                  <span key={tech} className={styles.techTag}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.cardActions}>
              <a
                className="button"
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Launch System
                <span className="visuallyHidden"> for {project.title} (opens in a new tab)</span>
              </a>
              <a
                className="buttonQuiet"
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
                <span className="visuallyHidden"> repository for {project.title} (opens in a new tab)</span>
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className={`container ${styles.githubSection}`} aria-labelledby="github-heading">
        <div>
          <p className={styles.githubEyebrow}>Open Source &amp; Code</p>
          <h2 id="github-heading" className={styles.githubTitle}>
            {githubProfile.heading}
          </h2>
          <p className={styles.githubIntro}>{githubProfile.intro}</p>
        </div>
        <div className={styles.githubAction}>
          <a
            className="button"
            href={githubProfile.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit {githubProfile.label}
            <span className="visuallyHidden"> (opens in a new tab)</span>
          </a>
        </div>
      </section>
    </main>
  );
}
