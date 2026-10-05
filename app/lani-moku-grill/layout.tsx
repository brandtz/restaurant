import type { ReactNode } from "react";
import { RestaurantTheme } from "@/design-system";
import { SiteHeader } from "@/storefront/components/SiteHeader";
import { SiteFooter } from "@/storefront/components/SiteFooter";
import { loadLaniMokuSite } from "@/storefront/site-data";
import styles from "@/storefront/storefront.module.css";

export const dynamic = "force-dynamic";

export default async function LaniMokuLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { merchant } = await loadLaniMokuSite();
  return (
    <RestaurantTheme themeId={merchant.themeId} className={styles.shell}>
      <p className={styles.demoBanner} data-testid="demo-banner">
        Prototype with sample menu data. No orders are placed and no payment is
        taken.
      </p>
      <SiteHeader merchant={merchant} />
      <main className={styles.siteMain} id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </RestaurantTheme>
  );
}
