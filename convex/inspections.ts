import { ConvexError, v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import {
  getOrCreateInspection,
  MAX_INSPECTION_PHOTOS,
  requireInspectionCaption,
  saveInspectionAndAdvance,
  toStaffInspectionRecord,
} from "./lib/inspections";
import { latestInspection } from "./lib/audit";
import { assertImageUpload } from "./lib/uploads";
import {
  inspectionVerdictValidator,
  staffInspectionValidator,
} from "./lib/validators";

const inspectionWriteFields = {
  inspectorName: v.optional(v.string()),
  inspectedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  chassisMatchesDocs: v.optional(v.boolean()),
  bodyNotes: v.optional(v.string()),
  paintNotes: v.optional(v.string()),
  accidentHistory: v.optional(v.string()),
  engineNotes: v.optional(v.string()),
  transmissionNotes: v.optional(v.string()),
  acNotes: v.optional(v.string()),
  interiorNotes: v.optional(v.string()),
  tiresNotes: v.optional(v.string()),
  actualMileageKm: v.optional(v.number()),
  ownershipReview: v.optional(v.string()),
  verdict: v.optional(inspectionVerdictValidator),
};

export const getForVehicle = authedQuery({
  args: { vehicleId: v.id("vehicles") },
  returns: v.union(staffInspectionValidator, v.null()),
  handler: async (ctx, args) => {
    const inspection = await latestInspection(ctx, args.vehicleId);
    if (!inspection) {
      return null;
    }
    return await toStaffInspectionRecord(ctx, inspection);
  },
});

export const save = authedMutation({
  args: {
    vehicleId: v.id("vehicles"),
    ...inspectionWriteFields,
  },
  returns: v.id("inspections"),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      throw new ConvexError("Vehicle not found");
    }
    return await saveInspectionAndAdvance(ctx, {
      vehicle,
      actorUserId: ctx.user._id,
      inspectorName: args.inspectorName,
      inspectedAt: args.inspectedAt,
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
    });
  },
});

export const generatePhotoUploadUrl = authedMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachPhoto = authedMutation({
  args: {
    vehicleId: v.id("vehicles"),
    storageId: v.id("_storage"),
    caption: v.string(),
  },
  returns: v.id("inspectionPhotos"),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      throw new ConvexError("Vehicle not found");
    }
    const caption = requireInspectionCaption(args.caption);
    await assertImageUpload(ctx, args.storageId);
    const inspection = await getOrCreateInspection(ctx, args.vehicleId);
    const existing = await ctx.db
      .query("inspectionPhotos")
      .withIndex("by_inspection", (q) => q.eq("inspectionId", inspection._id))
      .take(MAX_INSPECTION_PHOTOS);
    if (existing.length >= MAX_INSPECTION_PHOTOS) {
      throw new ConvexError("Too many inspection photos");
    }
    return await ctx.db.insert("inspectionPhotos", {
      inspectionId: inspection._id,
      vehicleId: args.vehicleId,
      storageId: args.storageId,
      caption,
      sortOrder: existing.length,
      createdAt: Date.now(),
    });
  },
});

export const removePhoto = authedMutation({
  args: { photoId: v.id("inspectionPhotos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const photo = await ctx.db.get("inspectionPhotos", args.photoId);
    if (!photo) {
      throw new ConvexError("Photo not found");
    }
    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete("inspectionPhotos", args.photoId);
    return null;
  },
});
