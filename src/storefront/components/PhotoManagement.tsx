"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ActionButton } from "@/design-system";
import { storefrontPaths } from "../paths";
import { decodeLocalPhoto } from "../photos/decode-photo";
import {
  DEMO_PHOTO_POLICY,
  PhotoValidationError,
  validatePhotoAlt,
} from "../photos/photo-policy";
import {
  photoPreviewKey,
  resetPreviewPhotos,
  setPreviewPhoto,
  usePreviewPhoto,
} from "../photos/photo-preview-store";
import styles from "../storefront.module.css";
import type { MenuItemView, PublishedMenuView } from "../view-models";
import { ProductPhoto } from "./ProductPhoto";

function PhotoEditor({
  menu,
  item,
}: {
  menu: PublishedMenuView;
  item: MenuItemView;
}) {
  const key = photoPreviewKey(menu.merchantSlug, menu.locationSlug, item.id);
  const preview = usePreviewPhoto(key);
  const displayed = preview === undefined ? item.image : preview;
  const [alt, setAlt] = useState(preview?.alt ?? item.image?.alt ?? item.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unexpectedError, setUnexpectedError] = useState<Error | null>(null);
  const request = useRef(0);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const itemHref = storefrontPaths(menu.merchantSlug, menu.locationSlug).item(
    item.id,
  );

  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const currentRequest = ++request.current;
    setError("");
    setNotice("");
    setPending(true);
    try {
      const description = validatePhotoAlt(alt);
      const decoded = await decodeLocalPhoto(file);
      if (request.current !== currentRequest) {
        URL.revokeObjectURL(decoded.src);
        return;
      }
      try {
        setPreviewPhoto(key, { ...decoded, alt: description });
      } catch (failure) {
        URL.revokeObjectURL(decoded.src);
        throw failure;
      }
      setNotice(
        `Local photo preview updated for ${item.name}. Nothing was uploaded.`,
      );
    } catch (failure) {
      if (!(failure instanceof PhotoValidationError)) {
        if (request.current === currentRequest) {
          setUnexpectedError(
            failure instanceof Error
              ? failure
              : new Error("Unexpected photo preview failure."),
          );
        }
        return;
      }
      if (request.current === currentRequest) setError(failure.message);
    } finally {
      if (request.current === currentRequest) setPending(false);
    }
  }

  function applyDescription() {
    if (!preview) return;
    try {
      setPreviewPhoto(key, { ...preview, alt: validatePhotoAlt(alt) });
      setError("");
      setNotice(`Local photo description updated for ${item.name}.`);
    } catch (failure) {
      if (!(failure instanceof PhotoValidationError)) {
        setUnexpectedError(
          failure instanceof Error
            ? failure
            : new Error("Unexpected photo preview failure."),
        );
        return;
      }
      setError(failure.message);
    }
  }

  function removePhoto() {
    setPreviewPhoto(key, null);
    setError("");
    setNotice(`Photo removed from this local preview of ${item.name}.`);
  }

  if (unexpectedError) throw unexpectedError;

  return (
    <section
      className={styles.photoEditor}
      aria-labelledby="photo-item-heading"
    >
      <div>
        <h2 id="photo-item-heading">{item.name}</h2>
        <p className={styles.muted}>
          {item.available
            ? "Available in the sample menu"
            : "Sold out in the sample menu"}
        </p>
        <ProductPhoto
          merchantSlug={menu.merchantSlug}
          locationSlug={menu.locationSlug}
          item={item}
        />
        {displayed ? (
          <p className={styles.muted}>
            {displayed.width} × {displayed.height} pixels
          </p>
        ) : null}
        <Link className={styles.textLink} href={itemHref}>
          Preview {item.name} on the storefront
        </Link>
      </div>
      <div className={styles.photoControls}>
        <p className={styles.muted}>
          Use photos you own or have permission to use. This demo checks files
          locally; production upload rules are not yet implemented.
        </p>
        <label htmlFor="photo-description">
          <strong>Photo description</strong>
        </label>
        <input
          id="photo-description"
          className={styles.textarea}
          type="text"
          maxLength={DEMO_PHOTO_POLICY.maxAltLength}
          value={alt}
          aria-describedby="photo-description-help"
          disabled={pending}
          onChange={(event) => setAlt(event.target.value)}
        />
        <p className={styles.rule} id="photo-description-help">
          Describe what is shown for customers using a screen reader. Up to 160
          characters.
        </p>
        <ActionButton
          disabled={!preview || pending}
          onClick={applyDescription}
          variant="secondary"
        >
          Apply description to local preview
        </ActionButton>

        <label htmlFor="item-photo-file">
          <strong>
            {displayed ? "Replace item photo" : "Choose item photo"}
          </strong>
        </label>
        <input
          id="item-photo-file"
          className={styles.fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={pending}
          aria-describedby="photo-file-help"
          onChange={(event) => {
            void choosePhoto(event);
          }}
        />
        <p className={styles.rule} id="photo-file-help">
          JPEG, PNG or WebP. Up to 5 MB; 320–4096 pixels on each side. Display
          uses a centered crop.
        </p>
        <ActionButton
          disabled={!displayed || pending}
          variant="destructive"
          onClick={removePhoto}
        >
          Remove item photo
        </ActionButton>
        {error ? (
          <p
            className={styles.errorSummary}
            role="alert"
            ref={errorRef}
            tabIndex={-1}
          >
            {error} Your previous photo has not been changed.
          </p>
        ) : null}
        <p className={styles.muted} role="status" aria-live="polite">
          {pending ? "Checking your image…" : notice}
        </p>
      </div>
    </section>
  );
}

export function PhotoManagement({ menu }: { menu: PublishedMenuView }) {
  const items = menu.categories.flatMap((category) => category.items);
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [resetNotice, setResetNotice] = useState("");
  const item = items.find((candidate) => candidate.id === itemId);
  return (
    <>
      <div className={styles.adminToolbar}>
        <div>
          <label htmlFor="photo-item">
            <strong>Menu item</strong>
          </label>
          <select
            className={styles.select}
            id="photo-item"
            value={itemId}
            onChange={(event) => {
              setItemId(event.target.value);
              setResetNotice("");
            }}
          >
            {menu.categories.map((category) => (
              <optgroup label={category.name} key={category.id}>
                {category.items.map((candidate) => (
                  <option value={candidate.id} key={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <ActionButton
          variant="secondary"
          onClick={() => {
            resetPreviewPhotos();
            setResetNotice(
              "All local photo previews were reset. No server data was changed.",
            );
          }}
        >
          Reset all local photo previews
        </ActionButton>
      </div>
      <p className={styles.muted} role="status">
        {resetNotice}
      </p>
      {item ? (
        <PhotoEditor
          key={`${item.id}:${resetNotice}`}
          item={item}
          menu={menu}
        />
      ) : (
        <p className={styles.alert}>
          There are no menu items to photograph yet.
        </p>
      )}
    </>
  );
}
