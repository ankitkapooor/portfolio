"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { work, workCategories, workImage, type WorkCategory, type WorkItem } from "@/content/work";
import styles from "./work-grid.module.css";

type Filter = "All" | WorkCategory;

const counts = Object.fromEntries(
  workCategories.map((category) => [category, work.filter((item) => item.category === category).length]),
) as Record<WorkCategory, number>;

/**
 * All projects in one grid. Without JavaScript every card renders; the filter
 * chips only narrow the list once hydrated, animating with the View
 * Transitions API where the browser supports it.
 */
export function WorkGrid() {
  const [filter, setFilter] = useState<Filter>("All");
  const visible = filter === "All" ? work : work.filter((item) => item.category === filter);

  const choose = (next: Filter) => {
    if (next === filter) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) {
      setFilter(next);
      return;
    }
    document.startViewTransition(() => flushSync(() => setFilter(next)));
  };

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filter projects">
        {(["All", ...workCategories] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={styles.chip}
            aria-pressed={filter === option}
            onClick={() => choose(option)}
          >
            {option}
            <span className={styles.count}>{option === "All" ? work.length : counts[option]}</span>
          </button>
        ))}
      </div>

      <ul className={styles.grid}>
        {visible.map((item, index) => (
          <WorkCard key={item.slug} item={item} index={index} />
        ))}
      </ul>
    </>
  );
}

function WorkCard({ item, index }: { item: WorkItem; index: number }) {
  const host = new URL(item.demoUrl).host;

  return (
    <li
      className={styles.card}
      style={{ viewTransitionName: `work-${item.slug}`, "--i": index % 3 } as CSSProperties}
    >
      <a
        className={styles.shot}
        href={item.demoUrl}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
      >
        <span className={styles.chrome}>
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.url}>{host}</span>
        </span>
        <span className={styles.frame}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized JPEGs */}
          <img
            src={workImage(item.slug)}
            alt=""
            width={1200}
            height={750}
            loading={index < 3 ? "eager" : "lazy"}
            decoding="async"
          />
        </span>
      </a>

      <div className={styles.body}>
        <p className={styles.category}>{item.category}</p>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.tagline}>{item.tagline}</p>
        <p className={styles.why}>
          <span>Why it matters</span>
          {item.why}
        </p>
        <ul className={styles.stack} aria-label="Built with">
          {item.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
        <div className={styles.actions}>
          <a className={styles.primary} href={item.demoUrl} target="_blank" rel="noopener noreferrer">
            Live demo <span aria-hidden="true">↗</span>
            <span className="visuallyHidden">: {item.title} (opens in a new tab)</span>
          </a>
          {item.repositoryUrl ? (
            <a className={styles.secondary} href={item.repositoryUrl} target="_blank" rel="noopener noreferrer">
              Code <span aria-hidden="true">↗</span>
              <span className="visuallyHidden">: {item.title} (opens in a new tab)</span>
            </a>
          ) : null}
          {item.casePath ? (
            <Link className={styles.secondary} href={item.casePath}>
              Case study <span aria-hidden="true">→</span>
              <span className="visuallyHidden">: {item.title}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}
