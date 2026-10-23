"use client";

import { useSyncExternalStore } from "react";
import styles from "./site-header.module.css";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/** Switches between light and dark, remembering the choice for next time. */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, currentTheme, () => null);
  const next: Theme = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      className={styles.themeToggle}
      aria-label={theme ? `Switch to ${next} theme` : "Switch theme"}
      onClick={() => {
        const apply = () => {
          document.documentElement.dataset.theme = next;
          try {
            localStorage.setItem("theme", next);
          } catch {
            // Private mode: the choice simply isn't remembered.
          }
        };
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (document.startViewTransition && !reduce) document.startViewTransition(apply);
        else apply();
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" fill="currentColor" className={styles.sunCore} />
        <g className={styles.sunRays} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5" />
        </g>
        <circle cx="17" cy="8" r="5" className={styles.moonCut} />
      </svg>
    </button>
  );
}
