"use client";

import styles from "@/storefront/storefront.module.css";
import { ActionButton } from "@/design-system";

export default function StorefrontError({ reset }: { reset: () => void }) {
  return (
    <div className={styles.card} role="alert">
      <h1>We couldn’t load this menu</h1>
      <p>
        Something went wrong on our side. Try again, or call the restaurant to
        order.
      </p>
      <ActionButton onClick={() => reset()}>Try again</ActionButton>
    </div>
  );
}
