import Link from "next/link";
import { primaryNav } from "@/content/site";
import { profile } from "@/content/profile";
import { ThemeToggle } from "./theme-toggle";
import { Hand } from "@/components/hand";
import styles from "./site-header.module.css";

/**
 * Sticky header. Three anchor links fit on one row at every width, so there is
 * no menu to open; the only client code is the theme toggle.
 */
export function SiteHeader() {
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link className={styles.wordmark} href="/" aria-label={`${profile.name}, home`}>
          <span className={styles.mark} aria-hidden="true">
            {initials}
          </span>
          <span className={styles.name}>
            <Hand text={profile.name} />
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <ul className={styles.list}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link className={styles.link} href={item.href}>
                  <Hand text={item.label} />
                </Link>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
