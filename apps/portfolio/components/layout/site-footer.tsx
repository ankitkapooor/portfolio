import Link from "next/link";
import { footerNav } from "@/content/site";
import { profile } from "@/content/profile";
import styles from "./site-footer.module.css";

/**
 * Footer: name, verified links if any exist, the quiet Method link, and the
 * current year. It deliberately does not repeat the header navigation or
 * carry a second oversized call to action.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div>
          <p className={styles.name}>{profile.name}</p>
          {profile.locationOptional ? (
            <p className={styles.meta}>{profile.locationOptional}</p>
          ) : null}
        </div>

        <div className={styles.end}>
          <ul className={styles.links}>
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            {profile.verifiedLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} rel="me noopener">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className={styles.meta}>
            &copy; {year} {profile.name}. Strategy, grounded in evidence.
          </p>
        </div>
      </div>
    </footer>
  );
}
