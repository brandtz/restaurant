"use client";

import Link from "next/link";
import { ActionButton } from "@/design-system";
import { evaluateCart, MAX_LINE_QUANTITY } from "../cart";
import { useCart } from "../cart-store";
import { formatMoney } from "../format";
import styles from "../storefront.module.css";
import type { PublishedMenuView } from "../view-models";
import { QuantityStepper } from "./QuantityStepper";

export function CartView({
  menu,
  menuHref,
  locationName,
}: {
  menu: PublishedMenuView;
  menuHref: string;
  locationName: string;
}) {
  const { lines, hydrated, setQuantity, remove } = useCart(
    menu.merchantSlug,
    menu.locationSlug,
  );

  if (!hydrated) {
    return (
      <p className={styles.muted} role="status">
        Loading your cart…
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className={styles.card}>
        <h2>Your cart is empty</h2>
        <p>Add something from the {locationName} menu to get started.</p>
        <Link className={styles.primaryLink} href={menuHref}>
          Browse the menu
        </Link>
      </div>
    );
  }

  const cart = evaluateCart(menu, lines);

  return (
    <>
      {cart.orderable ? null : (
        <p className={styles.alert} role="alert">
          Some items need attention before checkout. Update or remove the items
          marked below.
        </p>
      )}
      <ul className={styles.cartList} aria-label="Cart items">
        {cart.lines.map(({ line, item, optionNames, lineTotal, issues }) => {
          const name = item?.name ?? "Unavailable item";
          return (
            <li className={styles.card} key={line.lineId}>
              <div className={styles.itemTop}>
                <h2>{name}</h2>
                <span className={styles.price}>
                  {lineTotal ? formatMoney(lineTotal) : "—"}
                </span>
              </div>
              {optionNames.length > 0 ? (
                <p className={styles.lineOptions}>{optionNames.join(", ")}</p>
              ) : null}
              {line.instructions ? (
                <p className={styles.lineInstructions}>
                  Note: {line.instructions}
                </p>
              ) : null}
              {issues.length > 0 ? (
                <ul className={styles.lineIssues}>
                  {issues.map((issue, index) => (
                    <li key={`${issue.code}-${index}`}>{issue.message}</li>
                  ))}
                </ul>
              ) : null}
              <div className={styles.lineActions}>
                <QuantityStepper
                  label={`Quantity of ${name}`}
                  max={MAX_LINE_QUANTITY}
                  min={1}
                  onChange={(next) => setQuantity(line.lineId, next)}
                  value={line.quantity}
                />
                <ActionButton
                  aria-label={`Remove ${name}`}
                  onClick={() => remove(line.lineId)}
                  variant="destructive"
                >
                  Remove
                </ActionButton>
              </div>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="cart-summary" className={styles.summary}>
        <h2 id="cart-summary">Order summary</h2>
        <p className={styles.summaryRow}>
          <span>Subtotal</span>
          <span data-testid="cart-subtotal">{formatMoney(cart.subtotal)}</span>
        </p>
        <p className={styles.muted}>
          Estimated from today’s menu. Tax and the final total are confirmed by
          the restaurant at checkout.
        </p>
        <ActionButton aria-describedby="checkout-unavailable" disabled>
          Continue to checkout
        </ActionButton>
        <p className={styles.muted} id="checkout-unavailable">
          Checkout is the next prototype step. No order is placed and no payment
          is taken here.
        </p>
        <Link className={styles.textLink} href={menuHref}>
          Add more items
        </Link>
      </section>
    </>
  );
}
