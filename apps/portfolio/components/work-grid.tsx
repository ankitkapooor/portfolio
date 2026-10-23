"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";
import {
  work,
  workCategories,
  workImage,
  workVideo,
  type WorkCategory,
  type WorkItem,
} from "@/content/work";
import styles from "./work-grid.module.css";

type Filter = "All" | WorkCategory;

const counts = Object.fromEntries(
  workCategories.map((category) => [category, work.filter((item) => item.category === category).length]),
) as Record<WorkCategory, number>;

/**
 * All projects in one grid. Without JavaScript every card renders with its
 * screenshot; once hydrated, the filter chips narrow the list (animated with
 * the View Transitions API where supported) and each card plays a recorded
 * walkthrough of the live product while it is on screen.
 */
export function WorkGrid({ titles = {} }: { titles?: Record<string, ReactNode> }) {
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
          <WorkCard key={item.slug} item={item} index={index} title={titles[item.slug]} />
        ))}
      </ul>
    </>
  );
}

/** Plays while at least half visible; pauses otherwise. Reduced motion: hover only. */
function useAutoplayInView(ref: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (video.preload !== "auto") video.preload = "auto";
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [ref]);
}

/**
 * `title` is the handwritten project name, rendered on the server and passed
 * in so the stroke data never ships in this client bundle.
 */
function WorkCard({ item, index, title }: { item: WorkItem; index: number; title?: ReactNode }) {
  const host = new URL(item.demoUrl).host;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useAutoplayInView(videoRef);
  const play = () => {
    videoRef.current?.play().catch(() => {});
  };

  return (
    <li
      className={styles.card}
      style={{ viewTransitionName: `work-${item.slug}`, "--i": index % 2 } as CSSProperties}
      onMouseEnter={play}
      onFocus={play}
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
          <span className={styles.live} data-playing={playing ? "true" : undefined}>
            <span className={styles.liveDot} />
            {playing ? "Demo" : "Live"}
          </span>
        </span>
        <span className={styles.frame}>
          <video
            ref={videoRef}
            className={styles.video}
            poster={workImage(item.slug)}
            muted
            loop
            playsInline
            preload="none"
            width={1200}
            height={750}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            <source src={workVideo(item.slug)} type="video/webm" />
          </video>
        </span>
      </a>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={`hand ${styles.number}`}>{String(work.indexOf(item) + 1).padStart(2, "0")}</span>
          <span className={styles.category}>{item.category}</span>
        </div>
        <h3 className={styles.title}>{title ?? item.title}</h3>
        <p className={styles.tagline}>{item.tagline}</p>
        <p className={styles.why}>
          <span className="hand">Why it matters</span>
          {item.why}
        </p>
        <ul className={styles.stack} aria-label="Built with">
          {item.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
        <div className={styles.actions}>
          <a className={styles.primary} href={item.demoUrl} target="_blank" rel="noopener noreferrer">
            Open live demo <span aria-hidden="true">↗</span>
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
