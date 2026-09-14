import { Fragment } from "react";
import Link from "next/link";
import { projects } from "@/content/projects";
import { contactPlaceholder, profile } from "@/content/profile";
import { DecisionIndex } from "@/components/decision-index";
import { FeaturedSystem } from "@/components/featured-system";
import { LabProjectCard } from "@/components/lab-project-card";
import { heroHeadline } from "@/lib/hero-headline";
import { approachSteps } from "@/content/approach";
import styles from "./page.module.css";

const breakClass = {
  mobile: styles.brMobile,
  wide: styles.brWide,
  both: styles.brBoth,
} as const;

const featuredProjects = projects.filter(
  (project) => project.portfolioGroup === "featured",
);

const labProjects = projects.filter(
  (project) => project.portfolioGroup === "lab",
);

export default function HomePage() {
  return (
    <main id="main" className={styles.main}>
      {/* ---- Hero and editorial decision index ---------------------- */}
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
            I use AI to structure messy problems, data to ground them, and
            explicit models to make assumptions, trade-offs, and uncertainty
            inspectable. The work spans growth, competition, defensibility,
            execution, and economics.
          </p>

          <div className={styles.heroActions}>
            <Link className="button" href="/#work">
              Explore the work
            </Link>
            <Link className={styles.heroSecondary} href="/about">
              About me
            </Link>
          </div>
        </div>

        <DecisionIndex projects={projects} />
      </section>

      {/* ---- Featured systems -------------------------------------- */}
      <section
        id="work"
        className={`container ${styles.section}`}
        aria-labelledby="work-heading"
      >
        <div className={styles.sectionHead}>
          <h2 id="work-heading" className={styles.sectionTitle}>
            Featured Decision Systems
          </h2>
          <p className={styles.sectionNote}>
            Interactive systems for turning ambiguous strategic questions into
            explicit assumptions, evidence, trade-offs, and decisions.
          </p>
        </div>

        <div className={styles.featuredSystems}>
          {featuredProjects.map((project, index) => (
            <FeaturedSystem
              key={project.slug}
              project={project}
              priority={index === 0}
            />
          ))}
        </div>
      </section>

      {/* ---- Strategy Lab ------------------------------------------ */}
      <section
        className={`container ${styles.section}`}
        aria-labelledby="lab-heading"
      >
        <div className={styles.sectionHead}>
          <h2 id="lab-heading" className={styles.sectionTitle}>
            The Strategy Lab
          </h2>
          <p className={styles.sectionNote}>
            Focused experiments into competitive response, product
            defensibility, and business economics.
          </p>
        </div>

        <div className={styles.labGrid}>
          {labProjects.map((project) => (
            <LabProjectCard key={project.slug} project={project} />
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
            One shared discipline, adapted to five different classes of
            strategic decision.
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
