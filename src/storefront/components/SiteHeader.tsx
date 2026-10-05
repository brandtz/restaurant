import Link from "next/link";
import { RestaurantIdentity } from "@/design-system";
import { storefrontPaths } from "../paths";
import styles from "../storefront.module.css";
import type { StorefrontMerchantView } from "../view-models";

export function SiteHeader({ merchant }: { merchant: StorefrontMerchantView }) {
  const home = `/${encodeURIComponent(merchant.slug)}`;
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.identityLink} href={home}>
          <RestaurantIdentity
            restaurantKey={merchant.slug}
            name={merchant.name}
            themeId={merchant.themeId}
            logo={merchant.logo}
          />
        </Link>
        <Link
          className={styles.orderNow}
          href={storefrontPaths(merchant.slug).merchant}
        >
          Order now
        </Link>
      </div>
      <nav className={styles.siteNav} aria-label="Restaurant navigation">
        <Link href={home}>Home</Link>
        <Link href={`${home}/eugene`}>Eugene</Link>
        <Link href={`${home}/springfield`}>Springfield</Link>
        <Link href={storefrontPaths(merchant.slug).merchant}>Pickup menu</Link>
      </nav>
    </header>
  );
}
