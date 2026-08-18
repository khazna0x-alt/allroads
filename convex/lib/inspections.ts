import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { latestInspection, logAudit } from "./audit";
import { statusAfterInspection } from "./contracts";
import { applyVehicleStatus } from "./vehicles";
import { isPublicFloorStatus, mapLegacyVehicleStatus } from "./vehicleStatus";

export const MAX_INSPECTION_PHOTOS = 24;

const DUMMY_CAPTION = /^(photo|image|img|pic|picture|placeholder|صورة)[\s_-]*\d*$/i;

export function requireInspectionCaption(caption: string): string {
  const trimmed = caption.trim();
  if (trimmed.length < 3) {
    throw new ConvexError("Inspection photos need a real marker note");
  }
  if (trimmed.length > 240) {
    throw new ConvexError("Caption is too long");
  }
  if (DUMMY_CAPTION.test(trimmed)) {
    throw new ConvexError("Use a real marker note, not a placeholder caption");
  }
  return trimmed;
}

export async function photosForInspection(
  ctx: QueryCtx,
  inspectionId: Id<"inspections">,
) {
  const photos = await ctx.db
    .query("inspectionPhotos")
    .withIndex("by_inspection", (q) => q.eq("inspectionId", inspectionId))
    .take(MAX_INSPECTION_PHOTOS);
  photos.sort((a, b) => a.sortOrder - b.sortOrder);
  const rows = [];
  for (const photo of photos) {
    rows.push({
      _id: photo._id,
      url: await ctx.storage.getUrl(photo.storageId),
      caption: photo.caption,
      sortOrder: photo.sortOrder,
    });
  }
  return rows;
}

export async function toStaffInspectionRecord(
  ctx: QueryCtx,
  inspection: Doc<"inspections">,
) {
  return {
    _id: inspection._id,
    vehicleId: inspection.vehicleId,
    verdict: inspection.verdict,
    inspectorName: inspection.inspectorName,
    inspectedAt: inspection.inspectedAt,
    notes: inspection.notes,
    chassisMatchesDocs: inspection.chassisMatchesDocs,
    bodyNotes: inspection.bodyNotes,
    paintNotes: inspection.paintNotes,
    accidentHistory: inspection.accidentHistory,
    engineNotes: inspection.engineNotes,
    transmissionNotes: inspection.transmissionNotes,
    acNotes: inspection.acNotes,
    interiorNotes: inspection.interiorNotes,
    tiresNotes: inspection.tiresNotes,
    actualMileageKm: inspection.actualMileageKm,
    ownershipReview: inspection.ownershipReview,
    createdAt: inspection.createdAt,
    updatedAt: inspection.updatedAt,
    photos: await photosForInspection(ctx, inspection._id),
  };
}

export async function getOrCreateInspection(
  ctx: MutationCtx,
  vehicleId: Id<"vehicles">,
): Promise<Doc<"inspections">> {
  const existing = await latestInspection(ctx, vehicleId);
  if (existing) {
    return existing;
  }
  const now = Date.now();
  const inspectionId = await ctx.db.insert("inspections", {
    vehicleId,
    createdAt: now,
    updatedAt: now,
  });
  const created = await ctx.db.get("inspections", inspectionId);
  if (!created) {
    throw new ConvexError("Inspection could not be created");
  }
  return created;
}

export async function saveInspectionAndAdvance(
  ctx: MutationCtx,
  args: {
    vehicle: Doc<"vehicles">;
    actorUserId?: Id<"users">;
    inspectorName?: string;
    inspectedAt?: number;
    notes?: string;
    chassisMatchesDocs?: boolean;
    bodyNotes?: string;
    paintNotes?: string;
    accidentHistory?: string;
    engineNotes?: string;
    transmissionNotes?: string;
    acNotes?: string;
    interiorNotes?: string;
    tiresNotes?: string;
    actualMileageKm?: number;
    ownershipReview?: string;
    verdict?: Doc<"inspections">["verdict"];
  },
): Promise<Id<"inspections">> {
  if (args.verdict === "not_accepted" && !args.notes?.trim()) {
    throw new ConvexError("A reason is required when the car is not accepted");
  }
  if (args.verdict === "accepted_with_notes" && !args.notes?.trim()) {
    throw new ConvexError("Notes are required for accepted with notes");
  }

  const inspection = await getOrCreateInspection(ctx, args.vehicle._id);
  const now = Date.now();
  await ctx.db.patch("inspections", inspection._id, {
    inspectorName: args.inspectorName,
    inspectedAt: args.inspectedAt ?? now,
    notes: args.notes,
    chassisMatchesDocs: args.chassisMatchesDocs,
    bodyNotes: args.bodyNotes,
    paintNotes: args.paintNotes,
    accidentHistory: args.accidentHistory,
    engineNotes: args.engineNotes,
    transmissionNotes: args.transmissionNotes,
    acNotes: args.acNotes,
    interiorNotes: args.interiorNotes,
    tiresNotes: args.tiresNotes,
    actualMileageKm: args.actualMileageKm,
    ownershipReview: args.ownershipReview,
    verdict: args.verdict,
    updatedAt: now,
  });

  await logAudit(ctx, {
    actorUserId: args.actorUserId,
    vehicleId: args.vehicle._id,
    editType: "inspection_saved",
    toValue: args.verdict,
    notes: args.notes,
  });

  if (args.verdict) {
    const fromStatus = mapLegacyVehicleStatus(args.vehicle.status);
    if (args.verdict === "not_accepted" || !isPublicFloorStatus(fromStatus)) {
      if (fromStatus !== "approved_for_publishing" && fromStatus !== "published") {
        await applyVehicleStatus(ctx, {
          vehicleId: args.vehicle._id,
          status: statusAfterInspection(args.verdict, args.vehicle.contractStatus),
          reason: args.verdict === "not_accepted" ? args.notes : undefined,
          notes: args.notes,
          actorUserId: args.actorUserId,
        });
      } else if (args.verdict === "not_accepted") {
        await applyVehicleStatus(ctx, {
          vehicleId: args.vehicle._id,
          status: "not_accepted",
          reason: args.notes,
          notes: args.notes,
          actorUserId: args.actorUserId,
        });
      }
    }
  }

  return inspection._id;
}
