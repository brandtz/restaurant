"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./components.module.css";
import { RestaurantTheme } from "./theme";

export type PublicLogoReference = {
  src: string;
};

export type RestaurantIdentityProps = {
  restaurantKey: string;
  name: string;
  themeId: string;
  logo?: PublicLogoReference | null;
};

export function isSafePublicImageSource(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//") && !src.includes("\\")) {
    return true;
  }
  try {
    const parsed = new URL(src);
    return (
      parsed.protocol === "https:" &&
      parsed.username.length === 0 &&
      parsed.password.length === 0
    );
  } catch {
    return false;
  }
}

function RestaurantLogo({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();

  return (
    <span className={styles.logoFrame} aria-hidden="true">
      {src && !failed ? (
        <Image
          alt=""
          className={styles.logoImage}
          height={56}
          key={src}
          onError={() => setFailed(true)}
          src={src}
          unoptimized
          width={112}
        />
      ) : (
        <span className={styles.monogram}>{initials || "R"}</span>
      )}
    </span>
  );
}

export function RestaurantIdentity({
  restaurantKey,
  name,
  themeId,
  logo,
}: RestaurantIdentityProps) {
  const safeLogo = logo && isSafePublicImageSource(logo.src) ? logo : null;

  return (
    <RestaurantTheme themeId={themeId}>
      <div
        key={`${restaurantKey}:${safeLogo?.src ?? "no-logo"}`}
        className={styles.identity}
        data-testid="restaurant-identity"
      >
        <RestaurantLogo name={name} src={safeLogo?.src} />
        <span className={styles.identityName}>{name}</span>
      </div>
    </RestaurantTheme>
  );
}
