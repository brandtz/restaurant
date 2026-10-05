export const DEMO_PHOTO_POLICY = {
  maxBytes: 5 * 1024 * 1024,
  minDimension: 320,
  maxDimension: 4096,
  maxAltLength: 160,
  mimeTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export class PhotoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoValidationError";
  }
}

export function validatePhotoFile(type: string, size: number): void {
  if (!DEMO_PHOTO_POLICY.mimeTypes.some((allowed) => allowed === type)) {
    throw new PhotoValidationError(
      "Choose a JPEG, PNG or WebP image. SVG and GIF are not supported.",
    );
  }
  if (
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    size > DEMO_PHOTO_POLICY.maxBytes
  ) {
    throw new PhotoValidationError(
      "Choose a non-empty image no larger than 5 MB.",
    );
  }
}

export function validatePhotoDimensions(width: number, height: number): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < DEMO_PHOTO_POLICY.minDimension ||
    height < DEMO_PHOTO_POLICY.minDimension ||
    width > DEMO_PHOTO_POLICY.maxDimension ||
    height > DEMO_PHOTO_POLICY.maxDimension
  ) {
    throw new PhotoValidationError(
      "The image must be between 320 and 4096 pixels on each side.",
    );
  }
}

export function validatePhotoAlt(alt: string): string {
  const value = alt.trim();
  if (!value || value.length > DEMO_PHOTO_POLICY.maxAltLength) {
    throw new PhotoValidationError(
      "Describe the item photo in 1 to 160 characters.",
    );
  }
  return value;
}

export function validatePhotoSignature(bytes: Uint8Array, type: string): void {
  const startsWith = (signature: readonly number[]) =>
    signature.every((byte, index) => bytes[index] === byte);
  const valid =
    type === "image/jpeg"
      ? startsWith([0xff, 0xd8, 0xff])
      : type === "image/png"
        ? startsWith([137, 80, 78, 71, 13, 10, 26, 10])
        : type === "image/webp" &&
          startsWith([82, 73, 70, 70]) &&
          [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte);
  if (!valid) {
    throw new PhotoValidationError(
      "This file does not match its image type. Choose a valid JPEG, PNG or WebP.",
    );
  }
}
