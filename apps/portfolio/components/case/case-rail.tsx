"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./strategic-case.module.css";

export type RailItem = { id: string; label: string };

/**
 * Sticky contents rail. Without JavaScript it is a plain list of anchor links;
 * once hydrated it highlights the section currently being read.
 */
export function CaseRail({ items }: { items: readonly RailItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const listRef = useRef<HTMLOListElement>(null);

  // On narrow screens the rail is a horizontal chip bar; scroll the bar (never
  // the page) so the active chip stays visible.
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return;
    const target = chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A thin band a third of the way down the viewport counts as "reading".
      { rootMargin: "-30% 0px -65% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className={styles.rail} aria-label="On this page">
      <p className={styles.railTitle}>The case</p>
      <ol ref={listRef}>
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              data-active={active === item.id ? "true" : undefined}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
