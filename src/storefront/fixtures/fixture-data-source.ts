import type { StorefrontDataSource } from "../data-source";
import {
  laniMokuLocations,
  laniMokuMenuFor,
  laniMokuMerchant,
} from "./lani-moku";

export const fixtureStorefrontDataSource: StorefrontDataSource = {
  kind: "fixture",
  async getMerchant(merchantSlug) {
    return merchantSlug === laniMokuMerchant.slug ? laniMokuMerchant : null;
  },
  async listLocations(merchantSlug) {
    return merchantSlug === laniMokuMerchant.slug ? laniMokuLocations : [];
  },
  async getLocation(merchantSlug, locationSlug) {
    if (merchantSlug !== laniMokuMerchant.slug) {
      return null;
    }
    return (
      laniMokuLocations.find((location) => location.slug === locationSlug) ??
      null
    );
  },
  async getPublishedMenu(merchantSlug, locationSlug) {
    return merchantSlug === laniMokuMerchant.slug
      ? laniMokuMenuFor(locationSlug)
      : null;
  },
};
