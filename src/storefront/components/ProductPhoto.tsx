"use client";

import Image from "next/image";
import { useState } from "react";
import { isSafePublicImageSource } from "@/design-system";
import {
  photoPreviewKey,
  usePreviewPhoto,
} from "../photos/photo-preview-store";
import styles from "../storefront.module.css";
import type { MenuItemImageView, MenuItemView } from "../view-models";

function PhotoImage({ image }: { image: MenuItemImageView }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return <span className={styles.photoFallback}>Photo unavailable</span>;
  return (
    <Image
      alt={image.alt}
      className={styles.productImage}
      height={image.height}
      onError={() => setFailed(true)}
      src={image.src}
      unoptimized
      width={image.width}
    />
  );
}

export function ProductPhoto({
  merchantSlug,
  locationSlug,
  item,
  compact = false,
}: {
  merchantSlug: string;
  locationSlug: string;
  item: Pick<MenuItemView, "id" | "name" | "image">;
  compact?: boolean;
}) {
  const preview = usePreviewPhoto(
    photoPreviewKey(merchantSlug, locationSlug, item.id),
  );
  const image = preview === undefined ? item.image : preview;
  const safe =
    image &&
    (preview
      ? image.src.startsWith("blob:")
      : isSafePublicImageSource(image.src)) &&
    image.width > 0 &&
    image.height > 0 &&
    image.alt.trim().length > 0;
  return (
    <div className={compact ? styles.photoCompact : styles.productPhoto}>
      {safe && image ? (
        <PhotoImage image={image} key={image.src} />
      ) : (
        <div className={styles.photoFallback}>
          <svg aria-hidden="true" viewBox="0 0 100 64" width="84" height="54">
            <ellipse
              cx="50"
              cy="34"
              rx="43"
              ry="25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <ellipse
              cx="50"
              cy="34"
              rx="31"
              ry="16"
              fill="none"
              stroke="currentColor"
            />
            <path
              d="M34 34c5-12 9-12 16 0m0 0c5-12 9-12 16 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>{compact ? "No photo" : "Item photo coming soon"}</span>
        </div>
      )}
    </div>
  );
}
