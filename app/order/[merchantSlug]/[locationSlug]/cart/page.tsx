import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartView } from "@/storefront/components/CartView";
import { getStorefrontDataSource } from "@/storefront/data-source";
import { storefrontPaths } from "@/storefront/paths";
import styles from "@/storefront/storefront.module.css";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage({
  params,
}: {
  params: Promise<{ merchantSlug: string; locationSlug: string }>;
}) {
  const { merchantSlug, locationSlug } = await params;
  const source = getStorefrontDataSource();
  const [location, menu] = source
    ? await Promise.all([
        source.getLocation(merchantSlug, locationSlug),
        source.getPublishedMenu(merchantSlug, locationSlug),
      ])
    : [null, null];
  if (!location || !menu) {
    notFound();
  }

  return (
    <>
      <p className={styles.eyebrow}>Pickup from {location.name}</p>
      <h1 className={styles.title}>Your cart</h1>
      <CartView
        locationName={location.name}
        menu={menu}
        menuHref={storefrontPaths(merchantSlug, locationSlug).menu}
      />
    </>
  );
}
