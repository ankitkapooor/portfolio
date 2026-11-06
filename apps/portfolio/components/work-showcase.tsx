"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { work, workCategories, workImage, workVideo, type WorkCategory, type WorkItem } from "@/content/work";
import styles from "./work-showcase.module.css";

type Filter = "All" | WorkCategory;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const DESKTOP = "(min-width: 900px)";
const subscribeWidth = (onChange: () => void) => {
  const media = window.matchMedia(DESKTOP);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/**
 * Every project, in about one screen of page. Wide screens get the Explorer
 * (the full list beside one large stage); phones get the Swipe deck. The
 * server renders both and CSS shows the right one, so the first paint and
 * no-JS visitors are correct; once hydrated only the matching layout stays
 * mounted, so the hidden one never loads its recordings.
 */
export function WorkShowcase() {
  const wide = useSyncExternalStore<boolean | null>(
    subscribeWidth,
    () => window.matchMedia(DESKTOP).matches,
    () => null,
  );

  return (
    <>
      {wide !== false ? (
        <div className={styles.onlyWide}>
          <Explorer />
        </div>
      ) : null}
      {wide !== true ? (
        <div className={styles.onlyNarrow}>
          <Swipe />
        </div>
      ) : null}
    </>
  );
}

/* ---- Shared pieces ----------------------------------------------------- */

/**
 * The recorded walkthrough in a browser window: traffic lights, the live
 * address, and a badge that turns to "Demo" while the recording plays.
 * Downloadable apps show a still of their page instead.
 */
function BrowserFrame({ item, play, className }: { item: WorkItem; play: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (play && !reducedMotion()) ref.current?.play().catch(() => {});
  }, [play, item.slug]);

  const still = item.delivery === "download" || !play;
  return (
    <span className={`${styles.window} ${className ?? ""}`}>
      <span className={styles.chrome}>
        <span className={styles.dots}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.url}>{new URL(item.demoUrl).host}</span>
        <span className={styles.live} data-playing={playing && !still ? "true" : undefined}>
          <span className={styles.liveDot} />
          {item.delivery === "download" ? "Mac app" : playing && !still ? "Demo" : "Live"}
        </span>
      </span>
      <span className={styles.frame}>
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized JPEG
          <img className={styles.media} src={workImage(item.slug)} alt="" width={1200} height={750} draggable={false} />
        ) : (
          <video
            key={item.slug}
            ref={ref}
            className={styles.media}
            poster={workImage(item.slug)}
            muted
            loop
            playsInline
            preload="auto"
            width={1200}
            height={750}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            <source src={workVideo(item.slug)} type="video/webm" />
          </video>
        )}
      </span>
    </span>
  );
}

function Actions({ item }: { item: WorkItem }) {
  return (
    <div className={styles.actions}>
      <a className={styles.primary} href={item.demoUrl} target="_blank" rel="noopener noreferrer">
        {item.delivery === "download" ? "Download the app" : "Open the demo"} <span aria-hidden="true">↗</span>
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
  );
}

function Details({ item }: { item: WorkItem }) {
  return (
    <>
      <p className={styles.why}>
        <span className="hand">Why it matters: </span>
        {item.why}
      </p>
      <p className={styles.stack}>Built with {item.stack.join(", ")}.</p>
    </>
  );
}

/* ---- Explorer (wide screens): the list beside one stage ---------------- */

/**
 * The whole section is about one viewport tall. Every project gets the full
 * stage (recording, pitch, why, stack, links) when selected; the list shows
 * all fifteen at once so nothing is buried.
 */
function Explorer() {
  const [filter, setFilter] = useState<Filter>("All");
  const list = filter === "All" ? work : work.filter((item) => item.category === filter);
  const [slug, setSlug] = useState(work[0].slug);
  const active = list.find((item) => item.slug === slug) ?? list[0];
  const index = list.indexOf(active);
  const hoverTimer = useRef<number | undefined>(undefined);

  const step = (delta: number) => setSlug(list[(index + delta + list.length) % list.length].slug);
  const hover = (next: string) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setSlug(next), 90);
  };

  return (
    <div className={styles.explorer}>
      <div className={styles.side}>
        <div className={styles.filters} role="group" aria-label="Filter projects">
          {(["All", ...workCategories] as const).map((option) => (
            <button key={option} type="button" className={styles.filter} aria-pressed={filter === option} onClick={() => setFilter(option)}>
              {option}
              <span className={styles.filterCount}>
                {option === "All" ? work.length : work.filter((item) => item.category === option).length}
              </span>
            </button>
          ))}
        </div>

        <ol className={styles.list} onMouseLeave={() => window.clearTimeout(hoverTimer.current)}>
          {list.map((item, at) => (
            <li key={item.slug}>
              <button
                type="button"
                className={styles.listItem}
                aria-current={item.slug === active.slug ? "true" : undefined}
                onClick={() => setSlug(item.slug)}
                onMouseEnter={() => hover(item.slug)}
                onFocus={() => setSlug(item.slug)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                  event.preventDefault();
                  const buttons = event.currentTarget.closest("ol")?.querySelectorAll("button");
                  const to = at + (event.key === "ArrowDown" ? 1 : -1);
                  buttons?.[Math.max(0, Math.min(list.length - 1, to))]?.focus();
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized JPEG */}
                <img className={styles.listThumb} src={workImage(item.slug)} alt="" width={1200} height={750} loading="lazy" />
                <span className={styles.listText}>
                  <span className={styles.listTitle}>{item.title}</span>
                  <span className={styles.listCategory}>{item.category}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <article className={styles.stage} aria-live="polite">
        <a
          key={active.slug}
          className={styles.stageMedia}
          href={active.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
          aria-hidden="true"
        >
          <BrowserFrame item={active} play className={styles.stageWindow} />
        </a>
        <div className={styles.stageBody} key={`body-${active.slug}`}>
          <div className={styles.stageHead}>
            <h3 className={`hand ${styles.stageTitle}`}>{active.title}</h3>
            <div className={styles.stepper}>
              <button type="button" onClick={() => step(-1)} aria-label="Previous project">
                ←
              </button>
              <span>
                {index + 1} of {list.length}
              </span>
              <button type="button" onClick={() => step(1)} aria-label="Next project">
                →
              </button>
            </div>
          </div>
          <p className={styles.tagline}>{active.tagline}</p>
          <Details item={active} />
          <Actions item={active} />
        </div>
      </article>
    </div>
  );
}

/* ---- Swipe (phones): a deck you flick through, forever ----------------- */

const SWIPE_AT = 110; // px of travel that commits a swipe
const FLICK = 0.6; // px/ms: a fast flick commits sooner

/**
 * Left sends the card to the back of the deck. Right flips it over to the
 * details and launch links, so a swipe never navigates away by accident and
 * the visitor still chooses between demo, code, and case study. The deck
 * loops, so there is no end. Touch, mouse, buttons, and arrow keys all work.
 */
function Swipe() {
  const n = work.length;
  const [at, setAt] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState({ dx: 0, dy: 0, active: false });
  const [leaving, setLeaving] = useState(false);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const card = (offset: number) => work[(((at + offset) % n) + n) % n];
  const position = ((at % n) + n) % n;

  const reset = () => setDrag({ dx: 0, dy: 0, active: false });
  const next = () => {
    if (leaving) return;
    if (reducedMotion()) {
      setAt((value) => value + 1);
      setFlipped(false);
      reset();
      return;
    }
    setLeaving(true);
    setDrag((value) => ({ ...value, active: false }));
    window.setTimeout(() => {
      setAt((value) => value + 1);
      setFlipped(false);
      setLeaving(false);
      reset();
    }, 280);
  };
  const back = () => {
    if (leaving) return;
    setAt((value) => value - 1);
    setFlipped(false);
  };

  const progress = leaving ? 1 : Math.min(1, Math.abs(drag.dx) / SWIPE_AT);
  const top = card(0);

  return (
    <div className={styles.swipe}>
      <div
        className={styles.deck}
        tabIndex={0}
        role="group"
        aria-roledescription="card deck"
        aria-label={`Project ${position + 1} of ${n}: ${top.title}. Left arrow for the next project, right arrow for details.`}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft") next();
          else if (event.key === "ArrowRight") setFlipped(true);
          else if (event.key === "Escape") setFlipped(false);
          else return;
          event.preventDefault();
        }}
      >
        {[2, 1, 0].map((offset) => {
          const item = card(offset);
          const isTop = offset === 0;
          const depth = offset - progress;
          const style: CSSProperties = isTop
            ? {
                transform: leaving
                  ? `translate(-145%, ${drag.dy}px) rotate(-22deg)`
                  : `translate(${drag.dx}px, ${drag.dy}px) rotate(${drag.dx / 16}deg)`,
                transition: drag.active ? "none" : leaving ? "transform 280ms cubic-bezier(.5,0,.9,.4)" : undefined,
              }
            : {
                transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`,
                transition: drag.active ? "none" : undefined,
              };

          return (
            <div
              key={`card-${at + offset}`}
              className={styles.card}
              data-depth={offset}
              style={{ ...style, zIndex: 3 - offset }}
              aria-hidden={isTop ? undefined : "true"}
              inert={!isTop}
              onPointerDown={
                isTop
                  ? (event) => {
                      if (event.button !== 0 || (event.target as HTMLElement).closest("a, button")) return;
                      start.current = { x: event.clientX, y: event.clientY, t: performance.now() };
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDrag({ dx: 0, dy: 0, active: true });
                    }
                  : undefined
              }
              onPointerMove={
                isTop
                  ? (event) => {
                      if (!start.current) return;
                      setDrag({
                        dx: event.clientX - start.current.x,
                        dy: (event.clientY - start.current.y) * 0.2,
                        active: true,
                      });
                    }
                  : undefined
              }
              onPointerUp={
                isTop
                  ? (event) => {
                      const from = start.current;
                      start.current = null;
                      if (!from) return;
                      const dx = event.clientX - from.x;
                      const speed = dx / Math.max(1, performance.now() - from.t);
                      if (dx < -SWIPE_AT || (speed < -FLICK && dx < -30)) next();
                      else {
                        if (dx > SWIPE_AT || (speed > FLICK && dx > 30)) setFlipped(true);
                        reset();
                      }
                    }
                  : undefined
              }
              onPointerCancel={() => {
                start.current = null;
                reset();
              }}
            >
              {isTop ? (
                <>
                  <span className={`${styles.stamp} ${styles.stampNext}`} style={{ opacity: Math.max(0, -drag.dx / SWIPE_AT) }}>
                    Next
                  </span>
                  {!flipped ? (
                    <span className={`${styles.stamp} ${styles.stampOpen}`} style={{ opacity: Math.max(0, drag.dx / SWIPE_AT) }}>
                      Explore
                    </span>
                  ) : null}
                </>
              ) : null}
              <div className={styles.flipper} data-flipped={isTop && flipped ? "true" : undefined}>
                <div className={styles.face} inert={isTop && flipped}>
                  <BrowserFrame item={item} play={isTop} className={styles.cardWindow} />
                  <div className={styles.cardBody}>
                    <h3 className={`hand ${styles.cardTitle}`}>{item.title}</h3>
                    <p className={styles.cardTagline}>{item.tagline}</p>
                    <p className={styles.cardCategory}>{item.category}</p>
                  </div>
                </div>
                <div className={`${styles.face} ${styles.faceBack}`} inert={!(isTop && flipped)}>
                  <h3 className={`hand ${styles.cardTitle}`}>{item.title}</h3>
                  <Details item={item} />
                  <Actions item={item} />
                  <button type="button" className={styles.flipBack} onClick={() => setFlipped(false)}>
                    ← Back to the card
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.control} onClick={back} aria-label="Previous project">
          ←
        </button>
        <button type="button" className={`${styles.control} ${styles.controlWide}`} onClick={next}>
          Next
        </button>
        {flipped ? (
          <a className={`${styles.control} ${styles.controlWide} ${styles.controlGo}`} href={top.demoUrl} target="_blank" rel="noopener noreferrer">
            Open <span aria-hidden="true">↗</span>
            <span className="visuallyHidden">: {top.title} (opens in a new tab)</span>
          </a>
        ) : (
          <button type="button" className={`${styles.control} ${styles.controlWide} ${styles.controlGo}`} onClick={() => setFlipped(true)}>
            Details
            <span className="visuallyHidden">: {top.title}</span>
          </button>
        )}
        <span className={styles.count}>
          {position + 1} of {n}
        </span>
      </div>
      <p className={styles.hint}>Swipe left for the next project, right for details.</p>
    </div>
  );
}
