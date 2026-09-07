import type { Metadata } from "next";
import Link from "next/link";
import { projects, projectPath } from "@/content/projects";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * A useful 404: it says what happened and then offers the actual contents of
 * the site, so a mistyped or stale URL still lands somewhere worth reading.
 */
export default function NotFound() {
  return (
    <main id="main" className={`container grid ${styles.main}`}>
      <div className={styles.body}>
        <p className={styles.code}>Error 404</p>
        <h1 className={styles.title}>That page is not here</h1>
        <p className={styles.text}>
          The address may have changed, or it may never have existed. This site
          is small enough to list in full, so the whole of it is on the right —
          three project cases, a biography, and a note on method.
        </p>
        <div className={styles.actions}>
          <Link className="button" href="/">
            Go to the homepage
          </Link>
          <Link className="buttonQuiet" href="/#work">
            View the work
          </Link>
        </div>
      </div>

      <nav className={styles.directory} aria-labelledby="directory-heading">
        <h2 id="directory-heading" className={styles.directoryTitle}>
          Everything on this site
        </h2>
        <ul className={styles.list}>
          {projects.map((project) => (
            <li key={project.slug}>
              <Link href={projectPath(project)}>
                <span className={styles.listNumber} aria-hidden="true">
                  {project.number}
                </span>
                <span>{project.title}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/about">
              <span className={styles.listNumber} aria-hidden="true">
                —
              </span>
              <span>About</span>
            </Link>
          </li>
          <li>
            <Link href="/method">
              <span className={styles.listNumber} aria-hidden="true">
                —
              </span>
              <span>Method</span>
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
