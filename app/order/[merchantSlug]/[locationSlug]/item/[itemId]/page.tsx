import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findMenuItem } from "@/storefront/cart";
import { ItemConfigurator } from "@/storefront/components/ItemConfigurator";
import { getStorefrontDataSource } from "@/storefront/data-source";
import { formatMoney } from "@/storefront/format";
import { storefrontPaths } from "@/storefront/paths";
import styles from "@/storefront/storefront.module.css";

type Params = Promise<{
  merchantSlug: string;
  locationSlug: string;
  itemId: string;
}>;

async function loadItem(
  merchantSlug: string,
  locationSlug: string,
  itemId: string,
) {
  const menu = await getStorefrontDataSource()?.getPublishedMenu(
    merchantSlug,
    locationSlug,
  );
  const item = menu ? findMenuItem(menu, itemId) : null;
  return item ? { item } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { merchantSlug, locationSlug, itemId } = await params;
  const data = await loadItem(merchantSlug, locationSlug, itemId);
  return { title: data ? data.item.name : "Not found" };
}

export default async function MenuItemPage({ params }: { params: Params }) {
  const { merchantSlug, locationSlug, itemId } = await params;
  const data = await loadItem(merchantSlug, locationSlug, itemId);
  if (!data) {
    notFound();
  }
  const { item } = data;
  const paths = storefrontPaths(merchantSlug, locationSlug);

  return (
    <>
      <Link className={styles.textLink} href={paths.menu}>
        ← Back to menu
      </Link>
      <h1 className={styles.title}>{item.name}</h1>
      <p className={styles.price}>{formatMoney(item.basePrice)}</p>
      {item.description ? (
        <p className={styles.lede}>{item.description}</p>
      ) : null}
      {item.available ? (
        <ItemConfigurator
          item={item}
          locationSlug={locationSlug}
          menuHref={paths.menu}
          merchantSlug={merchantSlug}
        />
      ) : (
        <p className={styles.alert} role="status">
          {item.name} is sold out at this location today.
        </p>
      )}
    </>
  );
}
