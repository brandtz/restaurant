import { notFound } from "next/navigation";
import {
  ActionButton,
  demoRestaurants,
  FulfillmentBadge,
  PaymentBadge,
  RestaurantIdentity,
  RestaurantTheme,
  TenantSwitchPreview,
} from "@/design-system";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function DesignPreviewPage() {
  if (
    process.env.DESIGN_PREVIEW_ENABLED !== "1" ||
    process.env.APP_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    notFound();
  }

  return (
    <main className={styles.previewPage}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>BrandtWorks · internal design preview</p>
        <h1>Restaurant themes and accessible primitives</h1>
        <p>
          Fictional examples only. This page is a visual reference, not an
          ordering experience or a live merchant configuration tool.
        </p>
        <nav
          aria-label="Demo restaurant previews"
          className={styles.previewNav}
        >
          {demoRestaurants.map((restaurant) => (
            <a
              key={restaurant.id}
              className={styles.previewLink}
              href={`#${restaurant.id}`}
            >
              {restaurant.name} preview
            </a>
          ))}
        </nav>
      </header>

      <div className={styles.themeGrid}>
        {demoRestaurants.map((restaurant) => (
          <RestaurantTheme key={restaurant.id} themeId={restaurant.themeId}>
            <article
              id={restaurant.id}
              className={styles.themeCard}
              aria-labelledby={`${restaurant.id}-title`}
            >
              <RestaurantIdentity
                restaurantKey={restaurant.id}
                name={restaurant.name}
                themeId={restaurant.themeId}
              />
              <div>
                <h2 id={`${restaurant.id}-title`}>Street Taco Plate</h2>
                <p>Sample menu item · USD $12.00</p>
              </div>
              <div className={styles.badgeStack}>
                <FulfillmentBadge status="preparing" />
                <PaymentBadge status="paid" />
              </div>
              <div className={styles.actions}>
                <ActionButton disabled>Preview action only</ActionButton>
                <ActionButton compact variant="secondary" disabled>
                  View hours
                </ActionButton>
              </div>
              <p className={styles.note}>
                These controls are intentionally disabled; no restaurant service
                or payment is connected.
              </p>
            </article>
          </RestaurantTheme>
        ))}
      </div>
      <TenantSwitchPreview />
    </main>
  );
}
