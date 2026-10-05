"use client";

import type { MenuItemImageView } from "../view-models";
import {
  PhotoValidationError,
  validatePhotoDimensions,
  validatePhotoFile,
  validatePhotoSignature,
} from "./photo-policy";

export async function decodeLocalPhoto(
  file: File,
): Promise<MenuItemImageView & { bytes: number }> {
  validatePhotoFile(file.type, file.size);
  let signature: ArrayBuffer;
  try {
    signature = await file.slice(0, 12).arrayBuffer();
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
    throw new PhotoValidationError(
      "This image could not be read. Choose it again or try a different file.",
    );
  }
  validatePhotoSignature(new Uint8Array(signature), file.type);
  const src = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = src;
    try {
      await image.decode();
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
      throw new PhotoValidationError(
        "This image could not be opened. Try a different image.",
      );
    }
    validatePhotoDimensions(image.naturalWidth, image.naturalHeight);
    return {
      src,
      width: image.naturalWidth,
      height: image.naturalHeight,
      alt: "",
      bytes: file.size,
    };
  } catch (error) {
    URL.revokeObjectURL(src);
    throw error;
  }
}
