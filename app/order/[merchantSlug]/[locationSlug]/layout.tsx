import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getStorefrontDataSource } from "@/storefront/data-source";
import { CartBar } from "@/storefront/components/CartBar";
import { storefrontPaths } from "@/storefront/paths";

export default async function LocationStorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ merchantSlug: string; locationSlug: string }>;
}) {
  const { merchantSlug, locationSlug } = await params;
  const menu = await getStorefrontDataSource()?.getPublishedMenu(
    merchantSlug,
    locationSlug,
  );
  if (!menu) {
    notFound();
  }

  return (
    <>
      {children}
      <CartBar
        cartHref={storefrontPaths(merchantSlug, locationSlug).cart}
        menu={menu}
      />
    </>
  );
}
