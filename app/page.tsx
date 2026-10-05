import { redirect } from "next/navigation";
import { isDemoStorefrontEnabled } from "@/storefront/demo-gate";

export const dynamic = "force-dynamic";

export default function HomePage() {
  if (isDemoStorefrontEnabled(process.env)) redirect("/lani-moku-grill");
  return (
    <main id="main" tabIndex={-1}>
      <header>
        <p className="eyebrow">BrandtWorks Enterprises</p>
        <h1>Restaurant platform</h1>
        <p className="intro">
          A reliable foundation for restaurant-owned ordering.
        </p>
      </header>
      <section aria-labelledby="foundation-heading" className="panel">
        <span className="status">Development foundation</span>
        <h2 id="foundation-heading">Application is running</h2>
        <p>
          This is an informational development page, not a live storefront.
          Ordering, payments, and restaurant sign-in are not enabled.
        </p>
        <a className="action" href="/api/health">
          View application health
        </a>
        <p className="note">
          Health reports application liveness, not database or provider
          readiness. Integrations are verified separately before pilot launch.
        </p>
      </section>
      <section aria-labelledby="next-heading">
        <h2 id="next-heading">What comes next</h2>
        <ul>
          <li>Tenant-safe merchant and location services.</li>
          <li>Restaurant branding and manual menu preparation.</li>
          <li>Pickup ordering and manual restaurant fulfillment.</li>
        </ul>
      </section>
    </main>
  );
}
