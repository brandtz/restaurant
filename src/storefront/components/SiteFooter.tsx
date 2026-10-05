import Link from "next/link";
import styles from "../storefront.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.siteFooter}>
      <div>
        <strong>Lani Moku Grill</strong>
        <p>Springfield &amp; Eugene, Oregon</p>
        <p className={styles.muted}>
          Independent replacement-site prototype. Brand assets, hours and menu
          are awaiting merchant review.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="https://www.lanimokugrill.com/">Existing restaurant website</a>
        <Link href="/demo-admin/lani-moku-grill/menu">Photo editor demo</Link>
      </nav>
    </footer>
  );
}
