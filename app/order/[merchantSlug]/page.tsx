import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStorefrontDataSource } from "@/storefront/data-source";
import { currentTime, openStatus, weeklySchedule } from "@/storefront/hours";
import { storefrontPaths } from "@/storefront/paths";
import styles from "@/storefront/storefront.module.css";

type Params = Promise<{ merchantSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { merchantSlug } = await params;
  const merchant = await getStorefrontDataSource()?.getMerchant(merchantSlug);
  return { title: merchant ? `${merchant.name} · Order pickup` : "Not found" };
}

export default async function MerchantLandingPage({
  params,
}: {
  params: Params;
}) {
  const { merchantSlug } = await params;
  const source = getStorefrontDataSource();
  const merchant = source ? await source.getMerchant(merchantSlug) : null;
  if (!source || !merchant) {
    notFound();
  }
  const locations = await source.listLocations(merchant.slug);
  const now = currentTime();

  return (
    <>
      <p className={styles.eyebrow}>Order online for pickup</p>
      <h1 className={styles.title}>Choose your {merchant.name} location</h1>
      <p className={styles.lede}>
        Order ahead and pick up at the counter. Menus and availability can
        differ by location.
      </p>

      {locations.length === 0 ? (
        <p className={styles.alert}>
          Online ordering isn’t available right now. Please call the restaurant.
        </p>
      ) : (
        <ul className={styles.locationGrid} aria-label="Locations">
          {locations.map((location) => {
            const status = openStatus(location, now);
            const headingId = `location-${location.slug}`;
            return (
              <li key={location.slug}>
                <article aria-labelledby={headingId} className={styles.card}>
                  <h2 id={headingId}>{location.name}</h2>
                  <span
                    className={[
                      styles.status,
                      status.open ? styles.statusOpen : styles.statusClosed,
                    ].join(" ")}
                  >
                    {status.label}
                  </span>
                  <address>
                    {location.addressLines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </address>
                  {location.note ? (
                    <p className={styles.muted}>{location.note}</p>
                  ) : null}
                  {location.phone ? (
                    <a
                      className={styles.textLink}
                      href={`tel:${location.phone.replace(/[^\d+]/g, "")}`}
                    >
                      Call {location.phone}
                    </a>
                  ) : null}
                  <p className={styles.muted}>
                    Pickup usually ready in about {location.pickupLeadMinutes}{" "}
                    minutes.
                  </p>
                  <details className={styles.hours}>
                    <summary>Hours</summary>
                    <dl>
                      {weeklySchedule(location).map((row) => (
                        <div key={row.day} style={{ display: "contents" }}>
                          <dt>{row.day}</dt>
                          <dd>{row.hours}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  {location.acceptingOrders ? (
                    <Link
                      className={styles.primaryLink}
                      href={storefrontPaths(merchant.slug, location.slug).menu}
                    >
                      Order from {location.name}
                    </Link>
                  ) : (
                    <p className={styles.soldOut}>
                      Online ordering is paused at this location.
                    </p>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
