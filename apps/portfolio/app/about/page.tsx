import type { Metadata } from "next";
import Link from "next/link";
import { contactPlaceholder, profile } from "@/content/profile";
import { projects, projectPath } from "@/content/projects";
import { siteOrigin } from "@/content/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description: profile.shortBio,
  ...(siteOrigin ? { alternates: { canonical: "/about" } } : {}),
  openGraph: {
    type: "profile",
    title: `About ${profile.name}`,
    description: profile.shortBio,
  },
};

export default function AboutPage() {
  return (
    <main id="main" className={styles.main}>
      <header className={`container grid ${styles.header}`}>
        <div className={styles.headerBody}>
          <p className={styles.eyebrow}>About</p>
          <h1 className={styles.title}>{profile.name}</h1>
        </div>
      </header>

      <div className={`container ${styles.body}`}>
        <div className={styles.prose}>
          {profile.longBio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <aside className={styles.side} aria-labelledby="about-side-heading">
          <div className={styles.sideBlock}>
            <h2 id="about-side-heading" className={styles.sideTitle}>
              Background
            </h2>
            <ul className={styles.sideList}>
              {profile.education.map((entry) => (
                <li key={entry.institution}>
                  <strong>{entry.institution}</strong>
                  {entry.credential}
                </li>
              ))}
              <li>
                <strong>Machine learning engineering</strong>
                Prior work before the MBA.
              </li>
            </ul>
          </div>

          <div className={styles.sideBlock}>
            <h2 className={styles.sideTitle}>The work</h2>
            <ul className={styles.workList}>
              {projects.map((project) => (
                <li key={project.slug}>
                  <Link href={projectPath(project)}>
                    <span className={styles.workNumber}>
                      Project {project.number}
                    </span>
                    {project.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.sideBlock}>
            <h2 className={styles.sideTitle}>Contact</h2>
            {profile.verifiedLinks.length > 0 ? (
              <ul className={styles.sideList}>
                {profile.verifiedLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} rel="me noopener">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.sideNote}>{contactPlaceholder}</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
