"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/content/site";
import { profile } from "@/content/profile";
import styles from "./site-header.module.css";

/**
 * Sticky navigation with a progressively enhanced mobile menu. Before
 * hydration (and without JavaScript), all four links remain visible.
 * Escape closes the menu and returns keyboard focus to its trigger.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    headerRef.current?.setAttribute("data-nav-mode", "interactive");
  }, []);

  return (
    <header
      ref={headerRef}
      className={styles.header}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          toggleRef.current?.focus();
        }
      }}
    >
      <div className={`container ${styles.inner}`}>
        <Link className={styles.wordmark} href="/">
          {profile.name.toLowerCase().replace(" ", ".")}
          <span className={styles.wordmarkDot}> /</span>
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close menu" : "Menu"}
        </button>

        <nav
          id={panelId}
          className={styles.nav}
          aria-label="Primary"
          data-open={open ? "true" : "false"}
          // Following a link navigates away, so the panel must not stay open
          // over the new page.
          onClick={() => setOpen(false)}
        >
          <ul className={styles.list}>
            {primaryNav.map((item, index) => {
              const current = item.href === pathname;
              return (
                <li key={item.href}>
                  <Link
                    className={`${styles.link} ${current ? styles.linkCurrent : ""}`}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                  >
                    <span className={styles.navNumber} aria-hidden="true">
                      0{index + 1}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
