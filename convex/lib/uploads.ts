import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const MAX_PUBLIC_UPLOAD_BYTES = 12 * 1024 * 1024;
export const MAX_CONSIGNMENT_PHOTOS = 12;
export const MAX_OWNERSHIP_DOCS = 8;

export async function assertImageUpload(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
): Promise<void> {
  const metadata = await ctx.db.system.get("_storage", storageId);
  if (!metadata) {
    throw new ConvexError("Upload not found");
  }
  if (metadata.size > MAX_PUBLIC_UPLOAD_BYTES) {
    throw new ConvexError("File is too large");
  }
  const contentType = (metadata.contentType ?? "").toLowerCase();
  if (contentType && !ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new ConvexError("Photos must be JPEG, PNG, WebP, or HEIC");
  }
}
