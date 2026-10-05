"use client";

import { useSyncExternalStore } from "react";
import type { MenuItemImageView } from "../view-models";
import { PhotoValidationError } from "./photo-policy";

type PreviewPhoto = MenuItemImageView & { bytes: number };
const entries = new Map<string, PreviewPhoto | null>();
const listeners = new Set<() => void>();
const MAX_TOTAL_BYTES = 30 * 1024 * 1024;

export function photoPreviewKey(
  merchant: string,
  location: string,
  item: string,
): string {
  return JSON.stringify([merchant, location, item]);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

export function setPreviewPhoto(key: string, photo: PreviewPhoto | null): void {
  const previous = entries.get(key);
  const totalBytes = [...entries.values()].reduce(
    (total, value) => total + (value?.bytes ?? 0),
    0,
  );
  if (
    totalBytes - (previous?.bytes ?? 0) + (photo?.bytes ?? 0) >
    MAX_TOTAL_BYTES
  ) {
    throw new PhotoValidationError(
      "Local previews have reached 30 MB. Remove a photo or reset previews before adding another.",
    );
  }
  entries.set(key, photo);
  if (previous && previous.src !== photo?.src)
    URL.revokeObjectURL(previous.src);
  notify();
}

export function resetPreviewPhotos(): void {
  for (const photo of entries.values()) {
    if (photo) URL.revokeObjectURL(photo.src);
  }
  entries.clear();
  notify();
}

export function getPreviewPhoto(key: string): PreviewPhoto | null | undefined {
  return entries.get(key);
}

export function usePreviewPhoto(key: string): PreviewPhoto | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getPreviewPhoto(key),
    () => undefined,
  );
}
