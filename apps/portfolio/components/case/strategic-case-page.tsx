import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  conditionStatusLabels,
  deciderLabels,
  pestelImpactLabels,
  type StrategicCase,
} from "@/lib/case-schema";
import { CaseRail, type RailItem } from "./case-rail";
import { LandscapeMap } from "./landscape-map";
import styles from "./strategic-case.module.css";

const RAIL: readonly RailItem[] = [
  { id: "bet", label: "The bet" },
  { id: "why-now", label: "Why now" },
  { id: "who-else", label: "Who else" },
  { id: "moat", label: "Why it holds" },
  { id: "kill", label: "What would kill it" },
  { id: "system", label: "The system" },
  { id: "evidence", label: "Evidence" },
  { id: "next", label: "Go-to-market" },
  { id: "sources", label: "Sources" },
];

const VRIO_COLUMNS = [
  ["v", "Valuable"],
  ["r", "Rare"],
  ["i", "Inimitable"],
  ["o", "Organized"],
] as const;

const MARK_LABEL = { yes: "Yes", partial: "Partly", no: "No" } as const;

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Section({
  id,
  index,
  kicker,
  title,
  framework,
  intro,
  children,
}: {
  id: string;
  index: number;
  kicker: string;
  title: ReactNode;
  framework?: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-heading`} data-rail-section>
      <header className={`${styles.sectionHead} ${styles.reveal}`}>
        <p className={styles.kicker}>
          <span className={styles.kickerIndex}>{String(index).padStart(2, "0")}</span>
          {kicker}
          {framework ? <span className={styles.framework}>{framework}</span> : null}
        </p>
        <h2 id={`${id}-heading`} className={styles.sectionTitle}>
          {title}
        </h2>
        {intro ? <p className={styles.sectionIntro}>{intro}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Cite({ refs, order }: { refs: readonly string[]; order: Map<string, number> }) {
  if (refs.length === 0) return null;
  return (
    <span className={styles.cite}>
      {refs.map((ref) => (
        <a key={ref} href={`#${ref}`} aria-label={`Source ${order.get(ref)}`}>
          {order.get(ref)}
        </a>
      ))}
    </span>
  );
}

export function StrategicCasePage({ data }: { data: StrategicCase }) {
  const order = new Map(data.sources.map((source, index) => [source.id, index + 1]));
  const conditionCode = new Map(data.conditions.map((condition, index) => [condition.id, `C${index + 1}`]));
  const material = data.whyNow.forces.filter((force) => force.impact !== "ruled-out" && force.impact !== "low");
  const dismissed = data.whyNow.forces.filter((force) => force.impact === "ruled-out" || force.impact === "low");

  return (
    <main id="main" className={styles.main}>
      <div className={styles.progress} aria-hidden="true" />

      {/* ---- Hero ------------------------------------------------------ */}
      <header className={`container ${styles.hero}`}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/#work">← All work</Link>
          <span aria-hidden="true">/</span>
          <span>Case {data.number}</span>
          <span aria-hidden="true">/</span>
          <span>{data.lens}</span>
        </nav>

        <h1 className={styles.title}>{data.title}</h1>
        <p className={styles.question}>{data.question}</p>

        <div className={styles.betBlock}>
          <p className={styles.betLabel}>The bet</p>
          <p className={styles.bet}>{data.bet}</p>
        </div>

        <div className={styles.heroActions}>
          <a className="button" href={data.demoUrl} target="_blank" rel="noopener noreferrer">
            Open the live system<span className="visuallyHidden"> (opens in a new tab)</span>
          </a>
          <a className="buttonQuiet" href={data.repositoryUrl} target="_blank" rel="noopener noreferrer">
            Read the code<span className="visuallyHidden"> (opens in a new tab)</span>
          </a>
        </div>

        <dl className={styles.facts}>
          <div>
            <dt>Status</dt>
            <dd>{data.status}</dd>
          </div>
          <div>
            <dt>Lenses used</dt>
            <dd>{data.frameworks.join(" · ")}</dd>
          </div>
          <div>
            <dt>Market research</dt>
            <dd>
              {formatDate(data.researchedAt)} · {data.sources.length} sources
            </dd>
          </div>
        </dl>
      </header>

      <div className={`container ${styles.layout}`}>
        <CaseRail items={RAIL} />

        <div className={styles.body}>
          {/* ---- 01 The bet ------------------------------------------- */}
          <Section
            id="bet"
            index={1}
            kicker="The bet"
            title={<>What has to be true for this to work</>}
            intro={data.betDetail}
          >
            <ol className={styles.conditions}>
              {data.conditions.map((condition, index) => (
                <li
                  key={condition.id}
                  className={`${styles.condition} ${styles.reveal}`}
                  data-status={condition.status}
                  style={{ "--i": index } as CSSProperties}
                >
                  <p className={styles.conditionCode}>C{index + 1}</p>
                  <h3 className={styles.conditionLabel}>{condition.label}</h3>
                  <p className={styles.conditionDetail}>
                    {condition.detail}
                    <Cite refs={condition.sourceRefs} order={order} />
                  </p>
                  <p className={styles.statusTag}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {conditionStatusLabels[condition.status]}
                  </p>
                </li>
              ))}
            </ol>
          </Section>

          {/* ---- 02 Why now ------------------------------------------- */}
          <Section
            id="why-now"
            index={2}
            kicker="Why now"
            framework={data.whyNow.framework}
            title={data.whyNow.title}
            intro={data.whyNow.intro}
          >
            <ul className={styles.pestelStrip} aria-label="PESTEL overview">
              {data.whyNow.forces.map((force, index) => (
                <li
                  key={force.letter}
                  className={`${styles.pestelCell} ${styles.reveal}`}
                  data-impact={force.impact}
                  style={{ "--i": index } as CSSProperties}
                >
                  <a href={`#force-${force.letter}`}>
                    <span className={styles.pestelLetter}>{force.letter.slice(0, 1)}</span>
                    <span className={styles.pestelName}>{force.name}</span>
                    <span className={styles.pestelMeter} aria-hidden="true">
                      <span />
                    </span>
                    <span className={styles.pestelImpact}>{pestelImpactLabels[force.impact]}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className={styles.forces}>
              {material.map((force) => (
                <article key={force.letter} id={`force-${force.letter}`} className={`${styles.force} ${styles.reveal}`}>
                  <p className={styles.forceName}>
                    {force.name} · {pestelImpactLabels[force.impact]}
                  </p>
                  <h3 className={styles.forceHeadline}>{force.headline}</h3>
                  <ul className={styles.claims}>
                    {force.claims.map((item) => (
                      <li key={item.text}>
                        {item.text}
                        <Cite refs={item.sourceRefs} order={order} />
                      </li>
                    ))}
                  </ul>
                  <p className={styles.soWhat}>
                    <span>So what</span>
                    {force.soWhat}
                  </p>
                </article>
              ))}
            </div>

            <div className={styles.dismissed}>
              {dismissed.map((force) => (
                <p key={force.letter} id={`force-${force.letter}`}>
                  <strong>
                    {force.name} — {pestelImpactLabels[force.impact].toLowerCase()}.
                  </strong>{" "}
                  {force.soWhat}
                </p>
              ))}
            </div>
          </Section>

          {/* ---- 03 Who else ------------------------------------------ */}
          <Section
            id="who-else"
            index={3}
            kicker="Who else"
            framework={data.landscape.framework}
            title={data.landscape.title}
            intro={data.landscape.intro}
          >
            <LandscapeMap landscape={data.landscape} sourceOrder={Object.fromEntries(order)} />
          </Section>

          {/* ---- 04 Why it holds -------------------------------------- */}
          <Section
            id="moat"
            index={4}
            kicker="Why it holds"
            framework={data.vrio.framework}
            title={data.vrio.title}
            intro={data.vrio.intro}
          >
            <div className={styles.vrioWrap}>
              <table className={styles.vrio}>
                <caption className="visuallyHidden">
                  VRIO assessment: each capability rated as valuable, rare, inimitable, and organized.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Capability</th>
                    {VRIO_COLUMNS.map(([key, label]) => (
                      <th key={key} scope="col" className={styles.vrioMarkHead}>
                        <span aria-hidden="true">{key.toUpperCase()}</span>
                        <span className={styles.vrioMarkLabel}>{label}</span>
                      </th>
                    ))}
                    <th scope="col">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vrio.rows.map((row, rowIndex) => (
                    <tr key={row.capability} className={styles.reveal} style={{ "--i": rowIndex } as CSSProperties}>
                      <th scope="row">
                        <span className={styles.vrioCapability}>{row.capability}</span>
                        <span className={styles.vrioNote}>{row.note}</span>
                      </th>
                      {VRIO_COLUMNS.map(([key, label], colIndex) => (
                        <td
                          key={key}
                          className={styles.vrioMark}
                          data-mark={row[key]}
                          style={{ "--c": colIndex } as CSSProperties}
                        >
                          <span className={styles.vrioGlyph} aria-hidden="true" />
                          <span className="visuallyHidden">
                            {label}: {MARK_LABEL[row[key]]}
                          </span>
                        </td>
                      ))}
                      <td className={styles.vrioVerdict} data-strong={rowIndex === data.vrio.rows.length - 1 ? "true" : undefined}>
                        {row.verdict}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.legend} aria-hidden="true">
              <span className={styles.vrioGlyph} data-mark="yes" /> Yes
              <span className={styles.vrioGlyph} data-mark="partial" /> Partly
              <span className={styles.vrioGlyph} data-mark="no" /> No
            </p>
            <blockquote className={`${styles.readout} ${styles.reveal}`}>
              <p>{data.vrio.readout}</p>
            </blockquote>
          </Section>

          {/* ---- 05 What would kill it -------------------------------- */}
          <Section
            id="kill"
            index={5}
            kicker="What would kill it"
            framework="Kill criteria"
            title={<>How I would know I was wrong</>}
            intro="A thesis you can't falsify isn't a strategy. Each signal below is tied to the condition it would break, along with the test that would catch it early."
          >
            <ol className={styles.kills}>
              {data.killCriteria.map((criterion, index) => (
                <li key={criterion.condition} className={`${styles.kill} ${styles.reveal}`} style={{ "--i": index } as CSSProperties}>
                  <p className={styles.killBreaks}>Breaks {conditionCode.get(criterion.conditionRef)}</p>
                  <h3 className={styles.killCondition}>If {criterion.condition.charAt(0).toLowerCase() + criterion.condition.slice(1)}</h3>
                  <p className={styles.killThen}>
                    <span>Then</span>
                    {criterion.ifTrue}
                  </p>
                  <p className={styles.killTest}>
                    <span>Early test</span>
                    {criterion.test}
                  </p>
                </li>
              ))}
            </ol>
          </Section>

          {/* ---- 06 The system ---------------------------------------- */}
          <Section
            id="system"
            index={6}
            kicker="The system"
            title={data.system.title}
            intro={data.system.intro}
          >
            <ol className={styles.pipeline}>
              {data.system.steps.map((step, index) => (
                <li key={step.label} className={`${styles.step} ${styles.reveal}`} data-decider={step.decidedBy}>
                  <span className={styles.stepNode} aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <p className={styles.stepDecider}>{deciderLabels[step.decidedBy]}</p>
                    <h3 className={styles.stepLabel}>{step.label}</h3>
                    <p className={styles.stepDetail}>{step.detail}</p>
                    {step.serves.length > 0 ? (
                      <p className={styles.serves}>
                        Protects{" "}
                        {step.serves.map((ref) => (
                          <a key={ref} href="#bet" className={styles.serveChip}>
                            {conditionCode.get(ref)}
                          </a>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {/* ---- 07 Evidence ------------------------------------------ */}
          <Section
            id="evidence"
            index={7}
            kicker="Evidence"
            title={<>What’s built and what isn’t claimed</>}
          >
            <div className={styles.ledger}>
              <div className={styles.reveal}>
                <h3 className={styles.ledgerHead} data-kind="built">
                  Built and verified
                </h3>
                <ul>
                  {data.evidence.built.map((item) => (
                    <li key={item.text}>
                      {item.text}
                      <Cite refs={item.sourceRefs} order={order} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.reveal}>
                <h3 className={styles.ledgerHead} data-kind="not">
                  Not claimed yet
                </h3>
                <ul>
                  {data.evidence.notClaimed.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* ---- 08 Go-to-market -------------------------------------- */}
          <Section
            id="next"
            index={8}
            kicker="Go-to-market"
            title={data.nextMoves.title}
            intro={data.nextMoves.intro}
          >
            <ol className={styles.stages}>
              {data.nextMoves.stages.map((stage, index) => (
                <li key={stage.label} className={`${styles.stage} ${styles.reveal}`} style={{ "--i": index } as CSSProperties}>
                  <p className={styles.stageIndex}>Stage {index + 1}</p>
                  <h3 className={styles.stageLabel}>{stage.label}</h3>
                  <p className={styles.stageDetail}>{stage.detail}</p>
                  <p className={styles.stageGate}>
                    <span>Move on when</span>
                    {stage.gate}
                  </p>
                </li>
              ))}
            </ol>
          </Section>

          {/* ---- Sources ---------------------------------------------- */}
          <section id="sources" className={styles.sources} aria-labelledby="sources-heading" data-rail-section>
            <h2 id="sources-heading" className={styles.sourcesTitle}>
              Sources
            </h2>
            <p className={styles.sourcesNote}>
              Researched {formatDate(data.researchedAt)}. Figures are as reported by each publisher. Survey numbers are
              what providers reported, not measured claim data.
            </p>
            <ol className={styles.sourceList}>
              {data.sources.map((source) => (
                <li key={source.id} id={source.id}>
                  <span className={styles.sourceNum}>{order.get(source.id)}</span>
                  <span>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.title}
                    </a>
                    <span className={styles.sourceMeta}>
                      {source.publisher} · {source.date}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
