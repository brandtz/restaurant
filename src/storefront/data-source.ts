import "server-only";
import { isDemoStorefrontEnabled } from "./demo-gate";
import { fixtureStorefrontDataSource } from "./fixtures/fixture-data-source";
import type {
  PublishedMenuView,
  StorefrontLocationView,
  StorefrontMerchantView,
} from "./view-models";

/**
 * Read-only public storefront boundary. Implementations must return only
 * published, public data for the requested merchant and never accept a
 * tenant identifier from the browser beyond the public slugs.
 */
export interface StorefrontDataSource {
  readonly kind: "fixture" | "database";
  getMerchant(merchantSlug: string): Promise<StorefrontMerchantView | null>;
  listLocations(
    merchantSlug: string,
  ): Promise<readonly StorefrontLocationView[]>;
  getLocation(
    merchantSlug: string,
    locationSlug: string,
  ): Promise<StorefrontLocationView | null>;
  getPublishedMenu(
    merchantSlug: string,
    locationSlug: string,
  ): Promise<PublishedMenuView | null>;
}

/**
 * Returns null when no storefront source is available. The fixture source is
 * only served behind the explicit non-production demo gate; a database-backed
 * source replaces it once the accepted tenant/menu services exist.
 */
export function getStorefrontDataSource(
  env: Readonly<Record<string, string | undefined>> = process.env,
): StorefrontDataSource | null {
  return isDemoStorefrontEnabled(env) ? fixtureStorefrontDataSource : null;
}
