import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const ALLOWED_CONTRACT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const MAX_CONTRACT_BYTES = 15 * 1024 * 1024;

export function sanitizeContractFileName(name: string): string {
  const cleaned = name.replace(/[/\\]/g, "").trim();
  return cleaned.slice(0, 180) || "contract";
}

export async function assertContractUpload(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
): Promise<void> {
  const metadata = await ctx.storage.getMetadata(storageId);
  if (!metadata) {
    throw new ConvexError("Contract file not found");
  }
  if (metadata.size > MAX_CONTRACT_BYTES) {
    throw new ConvexError("Contract file is too large");
  }
  const contentType = (metadata.contentType ?? "").toLowerCase();
  if (contentType && !ALLOWED_CONTRACT_TYPES.has(contentType)) {
    throw new ConvexError("Contract must be a PDF or image");
  }
}
