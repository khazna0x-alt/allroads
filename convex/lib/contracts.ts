import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { latestInspection, logAudit } from "./audit";
import { isOnPublicFloor } from "./publish";
import { applyVehicleStatus } from "./vehicles";
import type { VehicleStatus } from "./vehicleStatus";

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
  const metadata = await ctx.db.system.get("_storage", storageId);
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

export async function applyContractFields(
  ctx: MutationCtx,
  args: {
    vehicle: Doc<"vehicles">;
    actorUserId?: Id<"users">;
    contractStatus?: Doc<"vehicles">["contractStatus"];
    contractStartsAt?: number;
    contractEndsAt?: number;
  },
): Promise<void> {
  const vehicle = args.vehicle;
  const nextStatus = args.contractStatus ?? vehicle.contractStatus;
  if (
    nextStatus === "signed" &&
    !vehicle.contractStorageId &&
    vehicle.publishGrandfathered !== true
  ) {
    throw new ConvexError("Upload the signed contract copy first");
  }

  const now = Date.now();
  const endsAt = args.contractEndsAt ?? vehicle.contractEndsAt;
  const expiredByDate =
    nextStatus === "signed" && endsAt !== undefined && endsAt < now;
  const contractStatus = expiredByDate ? "expired" : nextStatus;
  const datesChanged =
    args.contractStartsAt !== undefined || args.contractEndsAt !== undefined;
  const hideExpired = contractStatus === "expired" && isOnPublicFloor(vehicle);

  await ctx.db.patch("vehicles", vehicle._id, {
    ...(contractStatus !== undefined ? { contractStatus } : {}),
    ...(args.contractStartsAt !== undefined || vehicle.contractStartsAt !== undefined
      ? { contractStartsAt: args.contractStartsAt ?? vehicle.contractStartsAt }
      : {}),
    ...(args.contractEndsAt !== undefined || vehicle.contractEndsAt !== undefined
      ? { contractEndsAt: args.contractEndsAt ?? vehicle.contractEndsAt }
      : {}),
    ...(datesChanged ? { contractExpiryAlertedAt: undefined } : {}),
    ...(hideExpired ? { publicHidden: true } : {}),
    updatedAt: now,
  });

  await logAudit(ctx, {
    actorUserId: args.actorUserId,
    vehicleId: vehicle._id,
    editType: "contract_update",
    fromValue: vehicle.contractStatus,
    toValue: contractStatus,
  });

  if (contractStatus === "signed") {
    const inspection = await latestInspection(ctx, vehicle._id);
    const accepted =
      inspection?.verdict === "accepted" || inspection?.verdict === "accepted_with_notes";
    if (accepted && vehicle.status === "awaiting_contract") {
      await applyVehicleStatus(ctx, {
        vehicleId: vehicle._id,
        status: "approved",
        actorUserId: args.actorUserId,
      });
    }
  }
}

export function statusAfterInspection(
  verdict: "accepted" | "accepted_with_notes" | "not_accepted",
  contractStatus: Doc<"vehicles">["contractStatus"],
): VehicleStatus {
  if (verdict === "not_accepted") {
    return "not_accepted";
  }
  if (contractStatus === "signed") {
    return "approved";
  }
  return "awaiting_contract";
}
