import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductPhoto } from "@/storefront/components/ProductPhoto";
import {
  DEMO_PHOTO_POLICY,
  PhotoValidationError,
  validatePhotoAlt,
  validatePhotoDimensions,
  validatePhotoFile,
  validatePhotoSignature,
} from "@/storefront/photos/photo-policy";
import {
  getPreviewPhoto,
  photoPreviewKey,
  resetPreviewPhotos,
  setPreviewPhoto,
} from "@/storefront/photos/photo-preview-store";
import { laniMokuMenuFor } from "@/storefront/fixtures/lani-moku";
import { findMenuItem } from "@/storefront/cart";

afterEach(() => {
  resetPreviewPhotos();
  vi.restoreAllMocks();
});

describe("demo-only photo validation", () => {
  it.each(DEMO_PHOTO_POLICY.mimeTypes)(
    "accepts %s at the size boundary",
    (type) => {
      expect(() =>
        validatePhotoFile(type, DEMO_PHOTO_POLICY.maxBytes),
      ).not.toThrow();
    },
  );
  it.each(["image/svg+xml", "image/gif", "application/pdf", ""])(
    "rejects %s",
    (type) => {
      expect(() => validatePhotoFile(type, 10)).toThrow(PhotoValidationError);
    },
  );
  it.each([0, -1, 1.5, Number.NaN, DEMO_PHOTO_POLICY.maxBytes + 1])(
    "rejects size %s",
    (size) => {
      expect(() => validatePhotoFile("image/png", size)).toThrow(/5 MB/);
    },
  );
  it("validates dimensions at both boundaries", () => {
    expect(() => validatePhotoDimensions(320, 320)).not.toThrow();
    expect(() => validatePhotoDimensions(4096, 4096)).not.toThrow();
    for (const dimensions of [
      [319, 500],
      [500, 319],
      [4097, 500],
      [500, 4097],
      [320.5, 500],
      [500, Number.NaN],
    ]) {
      expect(() =>
        validatePhotoDimensions(dimensions[0]!, dimensions[1]!),
      ).toThrow(PhotoValidationError);
    }
  });
  it("requires a trimmed non-empty description", () => {
    expect(validatePhotoAlt("  Teriyaki chicken with rice  ")).toBe(
      "Teriyaki chicken with rice",
    );
    expect(validatePhotoAlt("a".repeat(160))).toHaveLength(160);
    expect(() => validatePhotoAlt(" ")).toThrow(PhotoValidationError);
    expect(() => validatePhotoAlt("a".repeat(161))).toThrow(
      PhotoValidationError,
    );
  });
  it("checks signatures instead of trusting a file extension or MIME type", () => {
    expect(() =>
      validatePhotoSignature(
        new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
        "image/png",
      ),
    ).not.toThrow();
    expect(() =>
      validatePhotoSignature(new Uint8Array([255, 216, 255]), "image/jpeg"),
    ).not.toThrow();
    expect(() =>
      validatePhotoSignature(
        new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]),
        "image/webp",
      ),
    ).not.toThrow();
    expect(() =>
      validatePhotoSignature(new Uint8Array([60, 115, 118, 103]), "image/png"),
    ).toThrow(/does not match/);
    expect(() =>
      validatePhotoSignature(new Uint8Array(), "image/jpeg"),
    ).toThrow(PhotoValidationError);
  });
});

describe("local photo-preview isolation and cleanup", () => {
  const photo = (src = "blob:local-photo", bytes = 100) => ({
    src,
    alt: "Example item",
    width: 640,
    height: 480,
    bytes,
  });
  it("scopes previews by merchant, location and item, not item alone", () => {
    const key = photoPreviewKey(
      "lani-moku-grill",
      "springfield",
      "teriyaki-chicken",
    );
    setPreviewPhoto(key, photo());
    expect(getPreviewPhoto(key)?.src).toBe("blob:local-photo");
    expect(
      getPreviewPhoto(
        photoPreviewKey("lani-moku-grill", "eugene", "teriyaki-chicken"),
      ),
    ).toBeUndefined();
    expect(
      getPreviewPhoto(
        photoPreviewKey("another-merchant", "springfield", "teriyaki-chicken"),
      ),
    ).toBeUndefined();
    expect(
      getPreviewPhoto(
        photoPreviewKey("lani-moku-grill", "springfield", "garlic-chicken"),
      ),
    ).toBeUndefined();
    expect(photoPreviewKey("a:b", "c", "d")).not.toBe(
      photoPreviewKey("a", "b:c", "d"),
    );
  });
  it("releases blobs on replacement and removal, but not description edits", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    setPreviewPhoto("item", photo("blob:first"));
    setPreviewPhoto("item", { ...photo("blob:first"), alt: "New description" });
    expect(revoke).not.toHaveBeenCalled();
    setPreviewPhoto("item", photo("blob:second"));
    expect(revoke).toHaveBeenCalledWith("blob:first");
    setPreviewPhoto("item", null);
    expect(revoke).toHaveBeenCalledWith("blob:second");
    expect(getPreviewPhoto("item")).toBeNull();
    resetPreviewPhotos();
    expect(getPreviewPhoto("item")).toBeUndefined();
  });
  it("preserves the previous preview when the memory limit is reached", () => {
    for (let i = 0; i < 6; i++)
      setPreviewPhoto(`item-${i}`, photo(`blob:${i}`, 5 * 1024 * 1024));
    expect(() => setPreviewPhoto("overflow", photo())).toThrow(/30 MB/);
    expect(getPreviewPhoto("overflow")).toBeUndefined();
    expect(getPreviewPhoto("item-0")?.src).toBe("blob:0");
    expect(() =>
      setPreviewPhoto("item-0", photo("blob:replacement", 5 * 1024 * 1024)),
    ).not.toThrow();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    resetPreviewPhotos();
    expect(revoke).toHaveBeenCalledTimes(6);
  });
});

describe("optional product photos", () => {
  const item = findMenuItem(
    laniMokuMenuFor("springfield")!,
    "teriyaki-chicken",
  )!;
  const render = (image: typeof item.image) =>
    renderToStaticMarkup(
      <ProductPhoto
        merchantSlug="lani-moku-grill"
        locationSlug="springfield"
        item={{ ...item, image }}
      />,
    );
  it("keeps text-only menu items usable", () => {
    expect(render(null)).toContain("Item photo coming soon");
  });
  it("renders an approved public image and its description", () => {
    const html = render({
      src: "/menu/chicken.webp",
      alt: "Chicken with rice",
      width: 640,
      height: 480,
    });
    expect(html).toContain('alt="Chicken with rice"');
    expect(html).toContain('src="/menu/chicken.webp"');
  });
  it("does not render unsafe sources or dimensionless images", () => {
    const image = {
      src: "javascript:alert(1)",
      alt: "Unsafe",
      width: 640,
      height: 480,
    };
    expect(render(image)).not.toContain("javascript:");
    expect(render({ ...image, src: "/menu/photo.webp", width: 0 })).toContain(
      "Item photo coming soon",
    );
  });
});
