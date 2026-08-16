import { ConvexError, v } from "convex/values";
import { authedMutation } from "./lib/customFunctions";

export const generateUploadUrl = authedMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const attach = authedMutation({
  args: {
    vehicleId: v.id("vehicles"),
    storageId: v.id("_storage"),
    altAr: v.string(),
    altEn: v.string(),
  },
  returns: v.id("vehiclePhotos"),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) {
      throw new ConvexError("Vehicle not found");
    }

    const existing = await ctx.db
      .query("vehiclePhotos")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .collect();

    return await ctx.db.insert("vehiclePhotos", {
      vehicleId: args.vehicleId,
      storageId: args.storageId,
      sortOrder: existing.length,
      altAr: args.altAr,
      altEn: args.altEn,
    });
  },
});

export const reorder = authedMutation({
  args: {
    photoIds: v.array(v.id("vehiclePhotos")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const [index, photoId] of args.photoIds.entries()) {
      const photo = await ctx.db.get(photoId);
      if (!photo) {
        throw new ConvexError("Photo not found");
      }
      await ctx.db.patch(photoId, { sortOrder: index });
    }
    return null;
  },
});

export const remove = authedMutation({
  args: { photoId: v.id("vehiclePhotos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new ConvexError("Photo not found");
    }
    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(args.photoId);
    return null;
  },
});
