import type { CSSProperties } from "react";
import { profile } from "@/content/profile";
import { work, workImage } from "@/content/work";
import {
  education,
  experience,
  headline,
  highlights,
  interests,
  intro,
  languages,
  publication,
  skills,
} from "@/content/about";
import { WorkGrid } from "@/components/work-grid";
import { Signature } from "@/components/signature";
import styles from "./page.module.css";

const email = profile.verifiedLinks.find((link) => link.href.startsWith("mailto:"));
const socials = profile.verifiedLinks.filter((link) => !link.href.startsWith("mailto:"));
const heroShots = ["market-entry-war-room", "valuelens", "orthocode-ai"];
const [firstName, ...rest] = profile.name.split(" ");
const lastName = rest.join(" ");

export default function HomePage() {
  return (
    <main id="main" className={styles.main}>
      {/* ---- Hero -------------------------------------------------------- */}
      <section className={`container ${styles.hero}`} aria-labelledby="hero-heading">
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>
            <span className={styles.pulse} aria-hidden="true" />
            {headline.role}
          </p>
          <h1 id="hero-heading" className={styles.name}>
            <span className={styles.nameLine}>
              {firstName}
              <Signature className={styles.heroSig} draw="load" delay={0.9} label="" />
            </span>{" "}
            <span className={styles.nameLine}>{lastName}</span>
          </h1>
          <p className={styles.pitch}>
            I build working products for hard business questions, <em>and the strategy behind them.</em>
          </p>

          <div className={styles.heroActions}>
            <a className={styles.ctaPrimary} href="#work">
              See {work.length} live projects <span aria-hidden="true">↓</span>
            </a>
            {email ? (
              <a className={styles.ctaSecondary} href={email.href}>
                Get in touch
              </a>
            ) : null}
            {socials.map((link) => (
              <a key={link.href} className={styles.ctaLink} href={link.href} rel="me noopener" target="_blank">
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>

          <dl className={styles.stats}>
            {highlights.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.statsNote}>At Ascent Business Solutions, building AI for U.S. medical coding.</p>
        </div>

        <div className={styles.collage} aria-hidden="true">
          {heroShots.map((slug, index) => (
            <span key={slug} className={styles.collageShot} style={{ "--n": index } as CSSProperties}>
              <span className={styles.collageBar}>
                <i />
                <i />
                <i />
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized JPEGs */}
              <img src={workImage(slug)} alt="" width={1200} height={750} />
            </span>
          ))}
        </div>
      </section>

      {/* ---- Work -------------------------------------------------------- */}
      <section id="work" className={`container ${styles.section}`} aria-labelledby="work-heading">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>01 — Work</p>
          <h2 id="work-heading" className={styles.sectionTitle}>
            {work.length} products, all live.
          </h2>
          <p className={styles.sectionNote}>
            Each card is a recording of the real product. Open the demo, read the code, or go deeper in a case study.
          </p>
        </div>
        <WorkGrid />
      </section>

      {/* ---- About ------------------------------------------------------- */}
      <section id="about" className={`container ${styles.section}`} aria-labelledby="about-heading">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>02 — About</p>
          <h2 id="about-heading" className={styles.sectionTitle}>
            Engineer first. <em>Strategist by training.</em>
          </h2>
        </div>

        <div className={styles.about}>
          <aside className={styles.aboutSide}>
            {intro.map((paragraph, index) => (
              <p key={paragraph} className={index === 0 ? styles.aboutLead : styles.aboutText}>
                {paragraph}
              </p>
            ))}
            <dl className={styles.facts}>
              <div>
                <dt>Based in</dt>
                <dd>{headline.location}</dd>
              </div>
              <div>
                <dt>Languages</dt>
                <dd>{languages.join(", ")}</dd>
              </div>
              <div>
                <dt>Off the clock</dt>
                <dd>{interests.join(", ")}</dd>
              </div>
            </dl>
          </aside>

          <div className={styles.aboutMain}>
            <h3 className={styles.blockTitle}>Experience</h3>
            <ol className={styles.timeline}>
              {experience.map((role) => (
                <li key={`${role.org}-${role.title}`} className={styles.role}>
                  <p className={styles.period}>{role.period}</p>
                  <div>
                    <h4 className={styles.roleTitle}>{role.title}</h4>
                    <p className={styles.roleOrg}>
                      {role.org} <span>· {role.place}</span>
                    </p>
                    {role.context ? <p className={styles.roleContext}>{role.context}</p> : null}
                    <ul className={styles.points}>
                      {role.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>

            <h3 className={styles.blockTitle}>Education</h3>
            <ul className={styles.timeline}>
              {education.map((entry) => (
                <li key={entry.school} className={styles.role}>
                  <p className={styles.period}>{entry.period}</p>
                  <div>
                    <h4 className={styles.roleTitle}>{entry.degree}</h4>
                    <p className={styles.roleOrg}>{entry.school}</p>
                    {entry.detail ? <p className={styles.roleContext}>{entry.detail}</p> : null}
                  </div>
                </li>
              ))}
            </ul>

            <h3 className={styles.blockTitle}>Publication</h3>
            <a className={`${styles.publication} ${styles.pubLink}`} href={publication.url} target="_blank" rel="noopener noreferrer">
              <p className={styles.pubTitle}>“{publication.title}”</p>
              <p className={styles.roleOrg}>
                {publication.authors} <span>· {publication.venue}</span>
              </p>
              <p className={styles.roleContext}>{publication.note}</p>
              <span className={styles.pubCta}>
                Read the paper (PDF) <span aria-hidden="true">↗</span>
                <span className="visuallyHidden"> (opens in a new tab)</span>
              </span>
            </a>

            <h3 className={styles.blockTitle}>Skills</h3>
            <div className={styles.skills}>
              {skills.map((group) => (
                <div key={group.label}>
                  <p className={styles.skillLabel}>{group.label}</p>
                  <ul className={styles.skillList}>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Contact ----------------------------------------------------- */}
      <section id="contact" className={`container ${styles.contact}`} aria-labelledby="contact-heading">
        <p className={styles.kicker}>03 — Contact</p>
        <div className={styles.contactInner}>
          <div>
            <h2 id="contact-heading" className={styles.contactTitle}>
              Let&rsquo;s build <em>something.</em>
            </h2>
            <p className={styles.contactText}>
              Open to conversations about strategy, product, and AI roles, and happy to walk through any project above.
            </p>
            <div className={styles.contactLinks}>
              {email ? (
                <a className={styles.contactEmail} href={email.href}>
                  {email.href.replace("mailto:", "")}
                  <span aria-hidden="true">→</span>
                </a>
              ) : null}
              {socials.map((link) => (
                <a key={link.href} className={styles.ctaLink} href={link.href} rel="me noopener" target="_blank">
                  {link.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
          <div className={styles.signOff}>
            <p className={styles.signOffLabel}>Thanks for scrolling this far —</p>
            <Signature className={styles.signOffSig} draw="view" />
          </div>
        </div>
      </section>
    </main>
  );
}
