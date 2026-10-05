export function storefrontPaths(merchantSlug: string, locationSlug?: string) {
  const merchant = `/order/${encodeURIComponent(merchantSlug)}`;
  const location = locationSlug
    ? `${merchant}/${encodeURIComponent(locationSlug)}`
    : merchant;
  return {
    merchant,
    menu: location,
    cart: `${location}/cart`,
    item: (itemId: string) => `${location}/item/${encodeURIComponent(itemId)}`,
  };
}
