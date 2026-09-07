"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/content/site";
import { profile } from "@/content/profile";
import styles from "./site-header.module.css";

/**
 * Site header: typographic wordmark left, three navigation items right.
 *
 * This is the site's only client island, and it exists for one reason: the
 * mobile menu needs to close on navigation and on Escape, and to hand focus
 * back to its trigger.
 *
 * Progressive enhancement: the server renders no `data-nav-mode` attribute at
 * all, and the stylesheet's default is the static layout — all three links
 * inline at every width, which fits beside the wordmark down to 360px. The
 * effect below adds `data-nav-mode="interactive"` once, which is what reveals
 * the toggle and collapses the panel on small screens. React never owns that
 * attribute, so with JavaScript unavailable the header simply stays static and
 * fully navigable.
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
          {profile.name}
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
            {primaryNav.map((item) => {
              const current = item.href === pathname;
              return (
                <li key={item.href}>
                  <Link
                    className={`${styles.link} ${current ? styles.linkCurrent : ""}`}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                  >
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
