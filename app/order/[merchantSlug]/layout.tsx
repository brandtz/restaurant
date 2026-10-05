import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { RestaurantIdentity, RestaurantTheme } from "@/design-system";
import { getStorefrontDataSource } from "@/storefront/data-source";
import { storefrontPaths } from "@/storefront/paths";
import styles from "@/storefront/storefront.module.css";

export const dynamic = "force-dynamic";

export default async function MerchantStorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ merchantSlug: string }>;
}) {
  const { merchantSlug } = await params;
  const source = getStorefrontDataSource();
  const merchant = source ? await source.getMerchant(merchantSlug) : null;
  if (!source || !merchant) {
    notFound();
  }

  return (
    <RestaurantTheme className={styles.shell} themeId={merchant.themeId}>
      {source.kind === "fixture" ? (
        <p className={styles.demoBanner} data-testid="demo-banner">
          Prototype with sample menu data. No orders are placed and no payment
          is taken.
        </p>
      ) : null}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link
            className={styles.identityLink}
            href={storefrontPaths(merchant.slug).merchant}
          >
            <RestaurantIdentity
              logo={merchant.logo}
              name={merchant.name}
              restaurantKey={merchant.slug}
              themeId={merchant.themeId}
            />
          </Link>
        </div>
      </header>
      <main className={styles.page} id="main" tabIndex={-1}>
        {children}
      </main>
    </RestaurantTheme>
  );
}
