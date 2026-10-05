"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { evaluateCart } from "../cart";
import { useCart } from "../cart-store";
import { formatMoney } from "../format";
import styles from "../storefront.module.css";
import type { PublishedMenuView } from "../view-models";

export function CartBar({
  menu,
  cartHref,
}: {
  menu: PublishedMenuView;
  cartHref: string;
}) {
  const pathname = usePathname();
  const { lines, hydrated } = useCart(menu.merchantSlug, menu.locationSlug);
  if (
    !hydrated ||
    lines.length === 0 ||
    pathname === cartHref ||
    pathname.includes("/item/")
  ) {
    return null;
  }
  const cart = evaluateCart(menu, lines);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className={styles.cartBar}>
      <Link className={styles.cartBarLink} href={cartHref}>
        <span>
          View cart · {count} {count === 1 ? "item" : "items"}
        </span>
        <span>
          {cart.orderable ? formatMoney(cart.subtotal) : "Needs attention"}
        </span>
      </Link>
    </div>
  );
}
