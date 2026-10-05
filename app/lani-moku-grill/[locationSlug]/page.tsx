import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentTime, openStatus, weeklySchedule } from "@/storefront/hours";
import { storefrontPaths } from "@/storefront/paths";
import { loadLaniMokuSite } from "@/storefront/site-data";
import { TropicalArt } from "@/storefront/components/TropicalArt";
import styles from "@/storefront/storefront.module.css";

type Params = Promise<{ locationSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locationSlug } = await params;
  const { locations } = await loadLaniMokuSite();
  const location = locations.find(
    (candidate) => candidate.slug === locationSlug,
  );
  return {
    title: location
      ? `Lani Moku Grill · ${location.name}`
      : "Location not found",
  };
}

export default async function LocationPage({ params }: { params: Params }) {
  const { locationSlug } = await params;
  const { merchant, locations } = await loadLaniMokuSite();
  const location = locations.find(
    (candidate) => candidate.slug === locationSlug,
  );
  if (!location) notFound();
  const status = openStatus(location, currentTime());
  const menuHref = storefrontPaths(merchant.slug, location.slug).menu;
  return (
    <>
      <section className={styles.locationHero}>
        <div>
          <p className={styles.eyebrow}>Lani Moku Grill</p>
          <h1 className={styles.title}>{location.name}</h1>
          <p className={styles.lede}>
            {location.slug === "eugene"
              ? "Your Hawaiian plate-lunch stop on West 6th Avenue."
              : "Island-inspired plates on Main Street."}
          </p>
          <Link className={styles.primaryLink} href={menuHref}>
            Order from {location.name}
          </Link>
        </div>
        <div className={styles.locationArt}>
          <TropicalArt />
        </div>
      </section>
      <section className={styles.siteSection} aria-labelledby="visit-title">
        <h2 className={styles.sectionTitle} id="visit-title">
          Come find us
        </h2>
        <div className={styles.visitGrid}>
          <div className={styles.card}>
            <h3>Location &amp; pickup</h3>
            <address>
              {location.addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </address>
            {location.note ? <p>{location.note}</p> : null}
            <span
              className={`${styles.status} ${status.open ? styles.statusOpen : styles.statusClosed}`}
            >
              {status.label}
            </span>
            <p>
              Sample pickup estimate: about {location.pickupLeadMinutes}{" "}
              minutes.
            </p>
            <a
              className={styles.textLink}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.addressLines.join(", "))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions{" "}
              <span className={styles.visuallyHidden}>(opens a new tab)</span>
            </a>
            {location.phone ? (
              <a
                className={styles.textLink}
                href={`tel:${location.phone.replace(/[^\d+]/g, "")}`}
              >
                Call {location.phone}
              </a>
            ) : null}
          </div>
          <div className={`${styles.card} ${styles.hours}`}>
            <h3>Hours</h3>
            <dl>
              {weeklySchedule(location).map((row) => (
                <div className={styles.scheduleRow} key={row.day}>
                  <dt>{row.day}</dt>
                  <dd>{row.hours}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.muted}>
              Hours are sample data awaiting merchant confirmation.
            </p>
          </div>
        </div>
      </section>
      <section className={styles.alohaSection}>
        <h2 className={styles.sectionTitle}>What are you craving?</h2>
        <p>
          Browse plate lunches, starters, sides and more at {location.name}.
        </p>
        <Link className={styles.primaryLink} href={menuHref}>
          View {location.name} pickup menu
        </Link>
      </section>
    </>
  );
}
