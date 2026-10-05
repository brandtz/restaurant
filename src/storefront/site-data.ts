import "server-only";
import { notFound } from "next/navigation";
import { getStorefrontDataSource } from "./data-source";

export async function loadLaniMokuSite() {
  const source = getStorefrontDataSource();
  const merchant = await source?.getMerchant("lani-moku-grill");
  if (!source || !merchant) notFound();
  const locations = await source.listLocations(merchant.slug);
  return { source, merchant, locations };
}
