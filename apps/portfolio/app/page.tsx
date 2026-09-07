import { Fragment } from "react";
import Link from "next/link";
import { projects, projectPath } from "@/content/projects";
import { contactPlaceholder, profile } from "@/content/profile";
import { ProjectFeature } from "@/components/project-feature";
import { heroHeadline } from "@/lib/hero-headline";
import { approachSteps } from "@/content/approach";
import styles from "./page.module.css";

const breakClass = {
  mobile: styles.brMobile,
  wide: styles.brWide,
  both: styles.brBoth,
} as const;

export default function HomePage() {
  return (
    <main id="main" className={styles.main}>
      {/* ---- Hero and index of questions ---------------------------- */}
      <section className={`container grid ${styles.hero}`} aria-labelledby="hero-heading">
        <div className={styles.heroBody}>
          <h1 id="hero-heading" className={styles.heroHeadline}>
            {heroHeadline.map((unit, index) => (
              <Fragment key={unit.text}>
                {index > 0 ? " " : null}
                {unit.text}
                {unit.breakAt ? <br className={breakClass[unit.breakAt]} /> : null}
              </Fragment>
            ))}
          </h1>

          <p className={styles.heroBackground}>{profile.shortBio}</p>

          <p className={styles.heroIntro}>
            I build experiments and decision tools to make strategic
            assumptions easier to question. This portfolio follows three
            questions: how businesses respond to AI, where their advantage
            survives, and what the financial results need to be.
          </p>

          <div className={styles.heroActions}>
            <Link className="button" href="/#work">
              View the work
            </Link>
            <Link className={styles.heroSecondary} href="/about">
              About me
            </Link>
          </div>
        </div>

        <nav className={styles.questions} aria-labelledby="questions-heading">
          <h2 id="questions-heading" className={styles.questionsHeading}>
            Index of questions
          </h2>
          <ul className={styles.questionsList}>
            {projects.map((project) => (
              <li key={project.slug} className={styles.questionsItem}>
                <Link
                  className={styles.questionsLink}
                  href={projectPath(project)}
                >
                  <span className={styles.questionsNumber} aria-hidden="true">
                    {project.number}
                  </span>
                  <span>{project.question}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {/* ---- Selected work ----------------------------------------- */}
      <section
        id="work"
        className={`container ${styles.section}`}
        aria-labelledby="work-heading"
      >
        <div className={styles.sectionHead}>
          <h2 id="work-heading" className={styles.sectionTitle}>
            Selected work
          </h2>
          <p className={styles.sectionNote}>
            Three independent projects. Each states its status plainly: all
            three run as software you can open and use, and only one has
            recorded a measured result.
          </p>
        </div>

        <div>
          {projects.map((project, index) => (
            <ProjectFeature
              key={project.slug}
              project={project}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* ---- Approach ---------------------------------------------- */}
      <section
        className={`container ${styles.section}`}
        aria-labelledby="approach-heading"
      >
        <div className={styles.sectionHead}>
          <h2 id="approach-heading" className={styles.sectionTitle}>
            How I approach a question
          </h2>
          <p className={styles.sectionNote}>
            The same three moves, in the same order, on every project.
          </p>
        </div>

        <ol className={styles.steps}>
          {approachSteps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <p className={styles.stepIndex}>
                Step {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- About preview ----------------------------------------- */}
      <section
        className={`container ${styles.section}`}
        aria-labelledby="about-heading"
      >
        <div className={styles.sectionHead}>
          <h2 id="about-heading" className={styles.sectionTitle}>
            About
          </h2>
          <p className={styles.sectionNote}>
            <Link href="/about">Read the full biography</Link>
          </p>
        </div>

        <div className={styles.about}>
          <p className={styles.aboutLede}>{profile.longBio[0]}</p>
          <div className={styles.aboutSide}>
            <p className={styles.aboutText}>{profile.longBio[1]}</p>
            <ul className={styles.educationList}>
              {profile.education.map((entry) => (
                <li key={entry.institution}>
                  <strong>{entry.institution}</strong>
                  {entry.credential}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- Contact ----------------------------------------------- */}
      <section
        id="contact"
        className={`container ${styles.contact}`}
        aria-labelledby="contact-heading"
      >
        <h2 id="contact-heading" className={styles.contactTitle}>
          Contact
        </h2>
        {profile.verifiedLinks.length > 0 ? (
          <>
            <p className={styles.contactBody}>
              The best way to reach me about this work:
            </p>
            <ul className={styles.contactLinks}>
              {profile.verifiedLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} rel="me noopener">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.contactBody}>{contactPlaceholder}</p>
        )}
      </section>
    </main>
  );
}
