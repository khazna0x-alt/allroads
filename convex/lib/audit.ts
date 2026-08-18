import { ConvexError, type Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { auditEditTypeValidator } from "./validators";
import type { VehicleStatus } from "./vehicleStatus";

type AuditEditType = Infer<typeof auditEditTypeValidator>;

export async function logVehicleStatusChange(
  ctx: MutationCtx,
  args: {
    vehicleId: Id<"vehicles">;
    actorUserId?: Id<"users">;
    fromStatus?: string;
    toStatus: VehicleStatus;
    reason?: string;
    notes?: string;
  },
): Promise<void> {
  const createdAt = Date.now();
  await ctx.db.insert("vehicleStatusLogs", {
    vehicleId: args.vehicleId,
    actorUserId: args.actorUserId,
    fromStatus: args.fromStatus,
    toStatus: args.toStatus,
    reason: args.reason,
    notes: args.notes,
    createdAt,
  });
  await ctx.db.insert("auditLogs", {
    actorUserId: args.actorUserId,
    vehicleId: args.vehicleId,
    editType: "status_change",
    fromValue: args.fromStatus,
    toValue: args.toStatus,
    reason: args.reason,
    notes: args.notes,
    createdAt,
  });
}

export async function logAudit(
  ctx: MutationCtx,
  args: {
    actorUserId?: Id<"users">;
    vehicleId?: Id<"vehicles">;
    editType: AuditEditType;
    fromValue?: string;
    toValue?: string;
    reason?: string;
    notes?: string;
  },
): Promise<void> {
  await ctx.db.insert("auditLogs", {
    actorUserId: args.actorUserId,
    vehicleId: args.vehicleId,
    editType: args.editType,
    fromValue: args.fromValue,
    toValue: args.toValue,
    reason: args.reason,
    notes: args.notes,
    createdAt: Date.now(),
  });
}

export async function latestInspection(
  ctx: QueryCtx | MutationCtx,
  vehicleId: Id<"vehicles">,
): Promise<Doc<"inspections"> | null> {
  return await ctx.db
    .query("inspections")
    .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicleId))
    .order("desc")
    .first();
}

export async function deleteVehicleRelatedRows(
  ctx: MutationCtx,
  vehicleId: Id<"vehicles">,
): Promise<void> {
  const inspections = await ctx.db
    .query("inspections")
    .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicleId))
    .take(50);
  for (const row of inspections) {
    const photos = await ctx.db
      .query("inspectionPhotos")
      .withIndex("by_inspection", (q) => q.eq("inspectionId", row._id))
      .take(50);
    for (const photo of photos) {
      await ctx.storage.delete(photo.storageId);
      await ctx.db.delete("inspectionPhotos", photo._id);
    }
    await ctx.db.delete("inspections", row._id);
  }

  const documents = await ctx.db
    .query("vehicleDocuments")
    .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicleId))
    .take(50);
  for (const row of documents) {
    await ctx.storage.delete(row.storageId);
    await ctx.db.delete("vehicleDocuments", row._id);
  }

  const statusLogs = await ctx.db
    .query("vehicleStatusLogs")
    .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicleId))
    .take(200);
  for (const row of statusLogs) {
    await ctx.db.delete("vehicleStatusLogs", row._id);
  }

  const audits = await ctx.db
    .query("auditLogs")
    .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicleId))
    .take(200);
  for (const row of audits) {
    await ctx.db.delete("auditLogs", row._id);
  }

  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicleId))
    .take(50);
  for (const booking of bookings) {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
      .take(20);
    for (const payment of payments) {
      if (payment.receiptStorageId) {
        await ctx.storage.delete(payment.receiptStorageId);
      }
      await ctx.db.delete("payments", payment._id);
    }
    await ctx.db.delete("bookings", booking._id);
  }
}

export function requireStatusReason(status: VehicleStatus, reason: string | undefined): string {
  const trimmed = reason?.trim() ?? "";
  if (!trimmed) {
    throw new ConvexError("A reason is required for this status");
  }
  return trimmed;
}
