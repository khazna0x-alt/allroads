import { ConvexError, v } from "convex/values";
import { authedMutation } from "./lib/customFunctions";
import { photoAngleValidator } from "./lib/validators";

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
    angle: v.optional(photoAngleValidator),
  },
  returns: v.id("vehiclePhotos"),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
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
      angle: args.angle,
    });
  },
});

export const reorder = authedMutation({
  args: {
    photoIds: v.array(v.id("vehiclePhotos")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const photos = [];
    for (const photoId of args.photoIds) {
      const photo = await ctx.db.get("vehiclePhotos", photoId);
      if (!photo) {
        throw new ConvexError("Photo not found");
      }
      photos.push(photo);
    }
    const vehicleId = photos[0]?.vehicleId;
    if (!vehicleId || photos.some((photo) => photo.vehicleId !== vehicleId)) {
      throw new ConvexError("Photos must belong to one vehicle");
    }
    for (const [index, photo] of photos.entries()) {
      await ctx.db.patch("vehiclePhotos", photo._id, { sortOrder: index });
    }
    return null;
  },
});

export const setMain = authedMutation({
  args: { photoId: v.id("vehiclePhotos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const photo = await ctx.db.get("vehiclePhotos", args.photoId);
    if (!photo) {
      throw new ConvexError("Photo not found");
    }
    const photos = await ctx.db
      .query("vehiclePhotos")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", photo.vehicleId))
      .collect();
    const rest = photos
      .filter((row) => row._id !== photo._id)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    for (const [index, row] of [photo, ...rest].entries()) {
      await ctx.db.patch("vehiclePhotos", row._id, { sortOrder: index });
    }
    return null;
  },
});

export const replace = authedMutation({
  args: {
    photoId: v.id("vehiclePhotos"),
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const photo = await ctx.db.get("vehiclePhotos", args.photoId);
    if (!photo) {
      throw new ConvexError("Photo not found");
    }
    const previous = photo.storageId;
    await ctx.db.patch("vehiclePhotos", args.photoId, { storageId: args.storageId });
    await ctx.storage.delete(previous);
    return null;
  },
});

export const setAngle = authedMutation({
  args: {
    photoId: v.id("vehiclePhotos"),
    angle: v.union(photoAngleValidator, v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const photo = await ctx.db.get("vehiclePhotos", args.photoId);
    if (!photo) {
      throw new ConvexError("Photo not found");
    }
    if (args.angle === null) {
      await ctx.db.replace("vehiclePhotos", args.photoId, {
        vehicleId: photo.vehicleId,
        storageId: photo.storageId,
        sortOrder: photo.sortOrder,
        altAr: photo.altAr,
        altEn: photo.altEn,
      });
      return null;
    }
    await ctx.db.patch("vehiclePhotos", args.photoId, { angle: args.angle });
    return null;
  },
});

export const remove = authedMutation({
  args: { photoId: v.id("vehiclePhotos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const photo = await ctx.db.get("vehiclePhotos", args.photoId);
    if (!photo) {
      throw new ConvexError("Photo not found");
    }
    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete("vehiclePhotos", args.photoId);
    return null;
  },
});
