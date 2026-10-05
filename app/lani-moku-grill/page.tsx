import type { Metadata } from "next";
import Link from "next/link";
import { ProductPhoto } from "@/storefront/components/ProductPhoto";
import { TropicalArt } from "@/storefront/components/TropicalArt";
import { formatMoney } from "@/storefront/format";
import { currentTime, openStatus } from "@/storefront/hours";
import { storefrontPaths } from "@/storefront/paths";
import { loadLaniMokuSite } from "@/storefront/site-data";
import styles from "@/storefront/storefront.module.css";

export const metadata: Metadata = {
  title: "Lani Moku Grill · Springfield & Eugene",
  description:
    "Explore a preview of Lani Moku Grill's new website and pickup ordering.",
};

export default async function LaniMokuHome() {
  const { source, merchant, locations } = await loadLaniMokuSite();
  const menu = await source.getPublishedMenu(merchant.slug, "springfield");
  const featured =
    menu?.categories
      .flatMap((category) => category.items)
      .filter((item) =>
        ["teriyaki-chicken", "kalua-pig", "chicken-katsu"].includes(item.id),
      ) ?? [];
  const now = currentTime();
  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>Hawaiian plates · Oregon roots</p>
          <h1 id="hero-title">
            A little aloha.
            <br />
            <span>A lot of flavor.</span>
          </h1>
          <p>
            Find your next plate lunch in Springfield or Eugene. Pick your
            location, build your plate, and explore our new pickup experience.
          </p>
          <div className={styles.heroActions}>
            <Link
              className={styles.heroButton}
              href={storefrontPaths(merchant.slug).merchant}
            >
              Order now
            </Link>
            <a className={styles.heroTextLink} href="#locations">
              Find a location
            </a>
          </div>
        </div>
        <div className={styles.heroArt}>
          <TropicalArt />
        </div>
      </section>

      <section
        className={styles.siteSection}
        id="locations"
        aria-labelledby="locations-title"
      >
        <p className={styles.eyebrow}>Two places. One island spirit.</p>
        <h2 className={styles.sectionTitle} id="locations-title">
          Your neighborhood escape
        </h2>
        <p className={styles.lede}>
          Choose where you want to pick up. Each location has its own hours,
          menu availability and cart.
        </p>
        <ul className={styles.locationGrid} aria-label="Restaurant locations">
          {locations.map((location) => {
            const status = openStatus(location, now);
            return (
              <li className={styles.locationFeature} key={location.slug}>
                <span className={styles.locationNumber}>
                  {location.slug === "springfield" ? "01" : "02"}
                </span>
                <h3>{location.name}</h3>
                <p>{location.addressLines.join(", ")}</p>
                <span
                  className={`${styles.status} ${status.open ? styles.statusOpen : styles.statusClosed}`}
                >
                  {status.label}
                </span>
                <div className={styles.heroActions}>
                  <Link
                    className={styles.primaryLink}
                    href={storefrontPaths(merchant.slug, location.slug).menu}
                  >
                    Order from {location.name}
                  </Link>
                  <Link
                    className={styles.textLink}
                    href={`/${merchant.slug}/${location.slug}`}
                  >
                    Explore {location.name}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className={`${styles.siteSection} ${styles.featuredSection}`}
        aria-labelledby="favorites-title"
      >
        <p className={styles.eyebrow}>Make it a plate lunch</p>
        <h2 className={styles.sectionTitle} id="favorites-title">
          Find your island favorite
        </h2>
        <p className={styles.lede}>
          A look at the Springfield sample menu. Actual item photos can be added
          in the photo editor demo.
        </p>
        <ul className={styles.featuredGrid}>
          {featured.map((item) => (
            <li className={styles.featuredCard} key={item.id}>
              <ProductPhoto
                merchantSlug={merchant.slug}
                locationSlug="springfield"
                item={item}
              />
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <span className={styles.price}>
                  {formatMoney(item.basePrice)}
                </span>
                <Link
                  className={styles.textLink}
                  href={storefrontPaths(merchant.slug, "springfield").item(
                    item.id,
                  )}
                >
                  Build your {item.name} plate
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.alohaSection} aria-labelledby="aloha-title">
        <p className={styles.eyebrow}>From the islands to your table</p>
        <h2 className={styles.sectionTitle} id="aloha-title">
          Take a break. Bring your appetite.
        </h2>
        <p>
          A casual lunch, dinner with friends, or your favorite plate to go.
          Start with a location and make it yours.
        </p>
        <Link
          className={styles.primaryLink}
          href={storefrontPaths(merchant.slug).merchant}
        >
          Choose a pickup location
        </Link>
      </section>
    </>
  );
}
