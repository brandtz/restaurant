"use client";

import { useState } from "react";
import styles from "./components.module.css";
import { ActionButton } from "./ActionButton";
import { RestaurantIdentity } from "./RestaurantIdentity";
import { demoRestaurantSwitcherFixtures } from "./theme";

export function TenantSwitchPreview() {
  const [selected, setSelected] = useState(0);
  const current = demoRestaurantSwitcherFixtures[selected]!;
  const next = demoRestaurantSwitcherFixtures[(selected + 1) % 2]!;

  return (
    <section
      aria-labelledby="tenant-switch-heading"
      className={styles.switcherPanel}
      data-testid="tenant-switch-fixture"
    >
      <h2 id="tenant-switch-heading">Tenant-switch logo fallback check</h2>
      <p>
        The first demo has a deliberately missing logo; switching tenant must
        discard its image-error state.
      </p>
      <RestaurantIdentity
        key={current.id}
        restaurantKey={current.id}
        name={current.name}
        themeId={current.themeId}
        logo={current.logo}
      />
      <ActionButton onClick={() => setSelected((value) => (value + 1) % 2)}>
        Switch to {next.name}
      </ActionButton>
    </section>
  );
}
