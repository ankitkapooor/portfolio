import Link from "next/link";
import { projects } from "@/content/projects";
import { contactPlaceholder, profile } from "@/content/profile";
import { DecisionAtlas } from "@/components/decision-atlas";
import { FeaturedSystem } from "@/components/featured-system";
import { LabProjectCard } from "@/components/lab-project-card";
import { approachSteps } from "@/content/approach";
import styles from "./page.module.css";

const featuredProjects = projects.filter((project) => project.portfolioGroup === "featured");
const labProjects = projects.filter((project) => project.portfolioGroup === "lab");

export default function HomePage() {
  return (
    <main id="main" className={styles.main}>
      <section className={`container ${styles.hero}`} aria-labelledby="hero-heading">
        <div className={styles.heroBody}>
          <p className={styles.eyebrow}><span className={styles.dot} /> ENGINEERING × STRATEGY</p>
          <h1 id="hero-heading" className={styles.heroHeadline}>
            I build decision<br />systems for<br /><span>ambiguous<br />strategic questions.</span>
          </h1>
          <p className={styles.heroBackground}>Former machine learning engineer.<br />MBA candidate at USC Marshall.</p>
          <p className={styles.heroIntro}>I turn messy questions about technology and business into working models. Assumptions you can challenge. Evidence you can inspect. Decisions you can explain.</p>
          <div className={styles.heroActions}>
            <Link className="button" href="/#work">Explore the work</Link>
            <Link className={styles.heroSecondary} href="/about">A little about me <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <DecisionAtlas projects={projects.map(({slug, number, title, question, decisionDomain}) => ({slug, number, title, question, decisionDomain}))} />
        <div className={styles.heroFoot}><span>FIVE QUESTIONS. FIVE WORKING SYSTEMS.</span><a href="#work">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></div>
      </section>

      <section id="work" className={`container ${styles.section}`} aria-labelledby="work-heading">
        <div className={styles.sectionHead}>
          <div><p className={styles.eyebrow}>01 / SELECTED WORK</p><h2 id="work-heading" className={styles.sectionTitle}>Strategy you can <em>interact with.</em></h2></div>
          <p className={styles.sectionNote}>Two deeper investigations.<br />From an open question to an inspectable decision.</p>
        </div>
        <div className={styles.featuredSystems}>
          {featuredProjects.map((project, index) => <FeaturedSystem key={project.slug} project={project} priority={index === 0} />)}
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="lab-heading">
        <div className={styles.sectionHead}>
          <div><p className={styles.eyebrow}>02 / THE STRATEGY LAB</p><h2 id="lab-heading" className={styles.sectionTitle}>Follow the <em>question.</em></h2></div>
          <p className={styles.sectionNote}>Competitive moves. Product moats. Business value.<br />Three experiments to think with.</p>
        </div>
        <div className={styles.labGrid}>{labProjects.map((project) => <LabProjectCard key={project.slug} project={project} />)}</div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="approach-heading">
        <div className={styles.sectionHead}>
          <div><p className={styles.eyebrow}>03 / HOW I THINK</p><h2 id="approach-heading" className={styles.sectionTitle}>Make the reasoning <em>visible.</em></h2></div>
          <Link className={styles.textLink} href="/method">Inside the method <span aria-hidden="true">↗</span></Link>
        </div>
        <ol className={styles.steps}>{approachSteps.map((step, index) => (
          <li key={step.title} className={styles.step}><p className={styles.stepIndex}>{String(index + 1).padStart(2, "0")}</p><h3 className={styles.stepTitle}>{step.title}</h3><p className={styles.stepBody}>{step.body}</p></li>
        ))}</ol>
      </section>

      <section className={`container ${styles.section} ${styles.about}`} aria-labelledby="about-heading">
        <div><p className={styles.eyebrow}>04 / A LITTLE CONTEXT</p><h2 id="about-heading" className={styles.aboutTitle}>From building models<br />to questioning<br /><em>what they mean.</em></h2><Link className={styles.textLink} href="/about">More about me <span aria-hidden="true">↗</span></Link></div>
        <div className={styles.aboutSide}><p className={styles.aboutText}>{profile.longBio[0]}</p><ul className={styles.educationList}>{profile.education.map((entry) => <li key={entry.institution}><strong>{entry.institution}</strong><span>{entry.credential}</span></li>)}</ul></div>
      </section>

      <section id="contact" className={`container ${styles.contact}`} aria-labelledby="contact-heading">
        <p className={styles.eyebrow}>HAVE A QUESTION WORTH WORKING ON?</p>
        <h2 id="contact-heading" className={styles.contactTitle}>Let’s think it <em>through.</em></h2>
        {profile.verifiedLinks.length > 0 ? <ul className={styles.contactLinks}>{profile.verifiedLinks.map((link) => <li key={link.href}><a href={link.href} rel="me noopener">{link.label}<span aria-hidden="true">↗</span></a></li>)}</ul> : <p className={styles.contactBody}>{contactPlaceholder}</p>}
      </section>
    </main>
  );
}
