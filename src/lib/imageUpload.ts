export const MAX_VEHICLE_PHOTO_BYTES = 12 * 1024 * 1024;
export const PHOTO_MAX_EDGE = 1920;
export const PHOTO_WEBP_QUALITY = 0.82;

export type ImagePrepareError = "not_image" | "too_large" | "compress_failed";

export class ImagePrepareException extends Error {
  readonly code: ImagePrepareError;

  constructor(code: ImagePrepareError) {
    super(code);
    this.name = "ImagePrepareException";
    this.code = code;
  }
}

export function isAllowedVehiclePhoto(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/svg+xml" || type === "image/gif") {
    return false;
  }
  if (type.startsWith("image/")) {
    return true;
  }
  return /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name);
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function prepareVehiclePhoto(file: File): Promise<File> {
  if (!isAllowedVehiclePhoto(file)) {
    throw new ImagePrepareException("not_image");
  }
  if (file.size > MAX_VEHICLE_PHOTO_BYTES) {
    throw new ImagePrepareException("too_large");
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const webp = await canvasToBlob(canvas, "image/webp", PHOTO_WEBP_QUALITY);
    const blob = webp ?? (await canvasToBlob(canvas, "image/jpeg", PHOTO_WEBP_QUALITY));
    if (!blob) {
      throw new ImagePrepareException("compress_failed");
    }
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${base}.${extension}`, { type: blob.type });
  } catch (error) {
    if (error instanceof ImagePrepareException) {
      throw error;
    }
    return file;
  }
}
