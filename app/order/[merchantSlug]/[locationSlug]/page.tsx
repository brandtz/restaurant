import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findMenuItem } from "@/storefront/cart";
import { ProductPhoto } from "@/storefront/components/ProductPhoto";
import { getStorefrontDataSource } from "@/storefront/data-source";
import { formatMoney } from "@/storefront/format";
import { currentTime, openStatus } from "@/storefront/hours";
import { storefrontPaths } from "@/storefront/paths";
import styles from "@/storefront/storefront.module.css";

type Params = Promise<{ merchantSlug: string; locationSlug: string }>;

async function loadLocationMenu(merchantSlug: string, locationSlug: string) {
  const source = getStorefrontDataSource();
  if (!source) {
    return null;
  }
  const [merchant, location, menu] = await Promise.all([
    source.getMerchant(merchantSlug),
    source.getLocation(merchantSlug, locationSlug),
    source.getPublishedMenu(merchantSlug, locationSlug),
  ]);
  return merchant && location && menu ? { merchant, location, menu } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { merchantSlug, locationSlug } = await params;
  const data = await loadLocationMenu(merchantSlug, locationSlug);
  return {
    title: data
      ? `${data.merchant.name} ${data.location.name} · Menu`
      : "Not found",
  };
}

export default async function LocationMenuPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ added?: string | string[] }>;
}) {
  const { merchantSlug, locationSlug } = await params;
  const data = await loadLocationMenu(merchantSlug, locationSlug);
  if (!data) {
    notFound();
  }
  const { merchant, location, menu } = data;
  const paths = storefrontPaths(merchant.slug, location.slug);
  const status = openStatus(location, currentTime());
  const { added } = await searchParams;
  const addedItem =
    typeof added === "string" ? findMenuItem(menu, added) : null;
  const categories = menu.categories.filter(
    (category) => category.items.length > 0,
  );

  return (
    <>
      <div className={styles.locationBar}>
        <div>
          <p className={styles.eyebrow}>Pickup from</p>
          <h1 className={styles.title}>
            {merchant.name} · {location.name}
          </h1>
          <p className={styles.muted}>{location.addressLines.join(", ")}</p>
        </div>
        <span
          className={[
            styles.status,
            status.open ? styles.statusOpen : styles.statusClosed,
          ].join(" ")}
        >
          {status.label}
        </span>
        <Link className={styles.textLink} href={paths.merchant}>
          Change location
        </Link>
      </div>

      {status.open ? null : (
        <p className={styles.alert}>
          {location.name} is closed right now. You can browse the menu; ordering
          ahead for a later time isn’t available yet.
        </p>
      )}

      <p aria-live="polite" className={styles.muted} role="status">
        {addedItem ? `Added ${addedItem.name} to your cart.` : ""}
      </p>

      {categories.length === 0 ? (
        <p className={styles.alert}>
          The menu for this location isn’t available yet.
        </p>
      ) : (
        <>
          <nav aria-label="Menu categories" className={styles.categoryNav}>
            <ul>
              {categories.map((category) => (
                <li key={category.id}>
                  <a className={styles.categoryLink} href={`#${category.id}`}>
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {categories.map((category) => (
            <section
              aria-labelledby={`${category.id}-heading`}
              className={styles.category}
              id={category.id}
              key={category.id}
            >
              <h2 id={`${category.id}-heading`}>{category.name}</h2>
              {category.description ? <p>{category.description}</p> : null}
              <ul className={styles.itemList}>
                {category.items.map((item) => (
                  <li
                    className={[
                      styles.itemCard,
                      item.available ? "" : styles.itemCardUnavailable,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={item.id}
                  >
                    <ProductPhoto
                      merchantSlug={merchant.slug}
                      locationSlug={location.slug}
                      item={item}
                    />
                    <div className={styles.itemTop}>
                      <h3>{item.name}</h3>
                      <span className={styles.price}>
                        {formatMoney(item.basePrice)}
                      </span>
                    </div>
                    {item.description ? (
                      <p className={styles.itemDescription}>
                        {item.description}
                      </p>
                    ) : null}
                    {item.dietaryLabels.length > 0 ? (
                      <ul aria-label="Dietary" className={styles.labels}>
                        {item.dietaryLabels.map((label) => (
                          <li className={styles.label} key={label}>
                            {label}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {item.available ? (
                      <Link
                        aria-label={`Add ${item.name}`}
                        className={styles.addLink}
                        href={paths.item(item.id)}
                      >
                        Add
                      </Link>
                    ) : (
                      <p className={styles.soldOut}>Sold out today</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </>
  );
}
