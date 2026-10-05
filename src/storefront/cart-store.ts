"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addCartLine,
  parseStoredCart,
  removeCartLine,
  setCartLineQuantity,
  type CartLine,
} from "./cart";

const EMPTY: readonly CartLine[] = Object.freeze([]);
const cache = new Map<string, readonly CartLine[]>();
const listeners = new Set<() => void>();

export function cartStorageKey(
  merchantSlug: string,
  locationSlug: string,
): string {
  return `bw-demo-cart:v1:${merchantSlug}:${locationSlug}`;
}

function read(key: string): readonly CartLine[] {
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }
  let lines: readonly CartLine[] = EMPTY;
  try {
    lines = parseStoredCart(window.sessionStorage.getItem(key));
  } catch {
    lines = EMPTY;
  }
  cache.set(key, lines);
  return lines;
}

function write(key: string, lines: readonly CartLine[]): void {
  cache.set(key, lines);
  try {
    window.sessionStorage.setItem(key, JSON.stringify(lines));
  } catch {
    // Storage can be unavailable (private mode/quota); keep the in-memory cart.
  }
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function newCartLineId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useCart(merchantSlug: string, locationSlug: string) {
  const key = cartStorageKey(merchantSlug, locationSlug);
  const lines = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const add = useCallback(
    (line: CartLine) => write(key, addCartLine(read(key), line)),
    [key],
  );
  const setQuantity = useCallback(
    (lineId: string, quantity: number) =>
      write(key, setCartLineQuantity(read(key), lineId, quantity)),
    [key],
  );
  const remove = useCallback(
    (lineId: string) => write(key, removeCartLine(read(key), lineId)),
    [key],
  );

  return { lines, hydrated, add, setQuantity, remove };
}
