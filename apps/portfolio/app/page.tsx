import { profile } from "@/content/profile";
import { work, workCategories, workImage } from "@/content/work";
import { WorkGrid } from "@/components/work-grid";
import styles from "./page.module.css";

const email = profile.verifiedLinks.find((link) => link.href.startsWith("mailto:"));
const socials = profile.verifiedLinks.filter((link) => !link.href.startsWith("mailto:"));
const repoCount = work.filter((item) => item.repositoryUrl).length;
const heroShots = ["market-entry-war-room", "valuelens", "orthocode-ai"];

const skills = [
  { label: "Build", items: ["Python", "TypeScript", "React / Next.js", "FastAPI", "PostgreSQL", "Cloudflare Workers"] },
  {
    label: "Analyze",
    items: ["Machine learning", "LLM pipelines", "Monte Carlo simulation", "DCF valuation", "Survey measurement (IRT)"],
  },
  { label: "Data", items: ["Census ACS", "SEC EDGAR / XBRL", "CMS NCCI & MUE", "ANES / CES"] },
];

export default function HomePage() {
  return (
    <main id="main" className={styles.main}>
      {/* ---- Hero -------------------------------------------------------- */}
      <section className={`container ${styles.hero}`} aria-labelledby="hero-heading">
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>ML engineer · MBA candidate, USC Marshall</p>
          <h1 id="hero-heading" className={styles.name}>
            {profile.name}
          </h1>
          <p className={styles.pitch}>
            I build working products for hard business questions, along with the strategy that explains why they
            matter.
          </p>

          <div className={styles.heroActions}>
            <a className={styles.ctaPrimary} href="#work">
              See the work <span aria-hidden="true">↓</span>
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
            <div>
              <dt>Live products</dt>
              <dd>{work.length}</dd>
            </div>
            <div>
              <dt>Open-source repos</dt>
              <dd>{repoCount}</dd>
            </div>
            <div>
              <dt>Domains</dt>
              <dd>{workCategories.length}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.collage} aria-hidden="true">
          {heroShots.map((slug, index) => (
            <span key={slug} className={styles.collageShot} style={{ ["--n" as string]: index }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized JPEGs */}
              <img src={workImage(slug)} alt="" width={1200} height={750} />
            </span>
          ))}
        </div>
      </section>

      {/* ---- Work -------------------------------------------------------- */}
      <section id="work" className={`container ${styles.section}`} aria-labelledby="work-heading">
        <div className={styles.sectionHead}>
          <h2 id="work-heading" className={styles.sectionTitle}>
            Work
          </h2>
          <p className={styles.sectionNote}>
            Every project is live. Open the demo, read the code, or go deeper in a case study.
          </p>
        </div>
        <WorkGrid />
      </section>

      {/* ---- About ------------------------------------------------------- */}
      <section id="about" className={`container ${styles.section} ${styles.about}`} aria-labelledby="about-heading">
        <h2 id="about-heading" className={styles.sectionTitle}>
          About
        </h2>
        <div className={styles.aboutBody}>
          <p className={styles.aboutLead}>
            I started as a machine learning engineer, and I&rsquo;m now an MBA candidate at USC Marshall. I care
            about where technology creates value, what makes that value defensible, and what has to be true for the
            economics to work.
          </p>
          <p className={styles.aboutText}>
            So instead of writing a memo, I build the answer. Each project here is a working product on real public
            data: Census, SEC filings, CMS rules, survey benchmarks. The assumptions are out in the open so you can
            argue with them.
          </p>

          <div className={styles.aboutGrid}>
            <div>
              <h3 className={styles.aboutLabel}>Education</h3>
              <ul className={styles.education}>
                {profile.education.map((entry) => (
                  <li key={entry.institution}>
                    <strong>{entry.institution}</strong>
                    <span>{entry.credential}</span>
                  </li>
                ))}
              </ul>
            </div>
            {skills.map((group) => (
              <div key={group.label}>
                <h3 className={styles.aboutLabel}>{group.label}</h3>
                <ul className={styles.skillList}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Contact ----------------------------------------------------- */}
      <section id="contact" className={`container ${styles.contact}`} aria-labelledby="contact-heading">
        <h2 id="contact-heading" className={styles.contactTitle}>
          Let&rsquo;s talk.
        </h2>
        <p className={styles.contactText}>
          Open to strategy, product, and AI roles, and always happy to talk about any of the work above.
        </p>
        <div className={styles.contactLinks}>
          {email ? (
            <a className={styles.contactEmail} href={email.href}>
              {email.href.replace("mailto:", "")}
            </a>
          ) : null}
          {socials.map((link) => (
            <a key={link.href} className={styles.ctaLink} href={link.href} rel="me noopener" target="_blank">
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
