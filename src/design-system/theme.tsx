import type { ReactNode } from "react";
import styles from "./components.module.css";
import { designTokens, isRestaurantThemeId } from "./tokens";

export type DemoRestaurant = {
  id: string;
  name: string;
  themeId: "hibiscus" | "marigold";
};

export const demoRestaurants = [
  {
    id: "demo-hawaiian-grill",
    name: "Demo Hawaiian Grill",
    themeId: "hibiscus",
  },
  {
    id: "demo-taco-shop",
    name: "Demo Taco Shop",
    themeId: "marigold",
  },
] as const satisfies readonly DemoRestaurant[];

export const demoRestaurantSwitcherFixtures = [
  {
    ...demoRestaurants[0],
    logo: { src: "/design-preview/missing-demo-hawaiian-logo.webp" },
  },
  {
    ...demoRestaurants[1],
    logo: null,
  },
] as const;

export function getThemeLabel(themeId: string): string {
  return isRestaurantThemeId(themeId)
    ? designTokens.themes[themeId].label
    : "Restaurant";
}

export function RestaurantTheme({
  themeId,
  children,
  className,
}: {
  themeId: string;
  children: ReactNode;
  className?: string;
}) {
  const validTheme = isRestaurantThemeId(themeId) ? themeId : "platform";

  return (
    <section
      className={[styles.themeScope, className].filter(Boolean).join(" ")}
      data-restaurant-theme={validTheme}
    >
      {children}
    </section>
  );
}
