import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RestaurantTheme } from "@/design-system";
import { PhotoManagement } from "@/storefront/components/PhotoManagement";
import { SiteHeader } from "@/storefront/components/SiteHeader";
import { loadLaniMokuSite } from "@/storefront/site-data";
import styles from "@/storefront/storefront.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lani Moku · Photo editor demo" };

export default async function PhotoAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string | string[] }>;
}) {
  const { location = "springfield" } = await searchParams;
  const { merchant, source, locations } = await loadLaniMokuSite();
  if (typeof location !== "string") notFound();
  const selected = locations.find((candidate) => candidate.slug === location);
  const menu = selected
    ? await source.getPublishedMenu(merchant.slug, selected.slug)
    : null;
  if (!selected || !menu) notFound();
  return (
    <RestaurantTheme themeId={merchant.themeId} className={styles.shell}>
      <p className={styles.demoBanner}>
        Photo editor prototype — local previews only. No authenticated admin
        service or server uploads.
      </p>
      <SiteHeader merchant={merchant} />
      <main className={styles.page} id="main" tabIndex={-1}>
        <p className={styles.eyebrow}>Restaurant menu · {selected.name}</p>
        <h1 className={styles.title}>Menu photos</h1>
        <p className={styles.alert}>
          Changes apply only inside this currently loaded browser app. They
          appear on the local storefront preview, but are not saved or
          published. Reloading the page resets them. Other visitors and browser
          tabs cannot see them.
        </p>
        <nav className={styles.locationBar} aria-label="Photo editor locations">
          {locations.map((candidate) => (
            <Link
              className={styles.textLink}
              aria-current={
                candidate.slug === selected.slug ? "page" : undefined
              }
              href={`/demo-admin/lani-moku-grill/menu?location=${candidate.slug}`}
              key={candidate.slug}
            >
              {candidate.name}
            </Link>
          ))}
        </nav>
        <PhotoManagement menu={menu} key={selected.slug} />
      </main>
    </RestaurantTheme>
  );
}
