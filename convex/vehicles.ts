import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import {
  staffVehicleValidator,
  vehicleStatusValidator,
  vehicleWriteValidator,
} from "./lib/validators";
import type { Id } from "./_generated/dataModel";
import {
  applyVehicleStatus,
  assertUniqueStockAndVin,
  buildVehicleSearchText,
  buildVehicleSlug,
  deleteVehicleWithAssets,
  nextStockCode,
  toStaffVehicleRecord,
} from "./lib/vehicles";

export const listStaff = authedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(vehicleStatusValidator),
  },
  returns: v.object({
    page: v.array(staffVehicleValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const result = args.status
      ? await ctx.db
          .query("vehicles")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .paginate(args.paginationOpts)
      : await ctx.db.query("vehicles").order("desc").paginate(args.paginationOpts);

    const page = [];
    for (const vehicle of result.page) {
      page.push(await toStaffVehicleRecord(ctx, vehicle));
    }

    return {
      page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const getStaff = authedQuery({
  args: { vehicleId: v.id("vehicles") },
  returns: v.union(staffVehicleValidator, v.null()),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) {
      return null;
    }
    return await toStaffVehicleRecord(ctx, vehicle);
  },
});

export const create = authedMutation({
  args: {
    ...vehicleWriteValidator,
    status: v.optional(vehicleStatusValidator),
  },
  returns: v.id("vehicles"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const stockCode = args.stockCode?.trim() || (await nextStockCode(ctx));
    await assertUniqueStockAndVin(ctx, { stockCode, vin: args.vin });
    const slug = buildVehicleSlug({
      year: args.year,
      make: args.make,
      model: args.model,
      stockCode,
    });
    const status = args.status ?? "draft";

    return await ctx.db.insert("vehicles", {
      stockCode,
      slug,
      vin: args.vin,
      make: args.make.trim(),
      model: args.model.trim(),
      year: args.year,
      trim: args.trim,
      priceOmr: args.priceOmr,
      mileageKm: args.mileageKm,
      fuel: args.fuel,
      transmission: args.transmission,
      drivetrain: args.drivetrain,
      spec: args.spec,
      condition: args.condition,
      bodyType: args.bodyType,
      exteriorColor: args.exteriorColor,
      interiorColor: args.interiorColor,
      engine: args.engine,
      features: args.features,
      titleAr: args.titleAr,
      titleEn: args.titleEn,
      descriptionAr: args.descriptionAr,
      descriptionEn: args.descriptionEn,
      searchText: buildVehicleSearchText({
        stockCode,
        vin: args.vin,
        make: args.make,
        model: args.model,
        trim: args.trim,
        titleAr: args.titleAr,
        titleEn: args.titleEn,
        year: args.year,
      }),
      ownership: args.ownership,
      status,
      featured: args.featured ?? false,
      ownerName: args.ownerName,
      ownerPhone: args.ownerPhone,
      ownerNotes: args.ownerNotes,
      staffNotes: args.staffNotes,
      publishedAt: status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = authedMutation({
  args: {
    vehicleId: v.id("vehicles"),
    ...vehicleWriteValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) {
      throw new ConvexError("Vehicle not found");
    }

    const stockCode = args.stockCode?.trim() || vehicle.stockCode;
    await assertUniqueStockAndVin(ctx, {
      stockCode,
      vin: args.vin,
      excludeId: args.vehicleId,
    });

    await ctx.db.patch(args.vehicleId, {
      stockCode,
      slug: buildVehicleSlug({
        year: args.year,
        make: args.make,
        model: args.model,
        stockCode,
      }),
      vin: args.vin,
      make: args.make.trim(),
      model: args.model.trim(),
      year: args.year,
      trim: args.trim,
      priceOmr: args.priceOmr,
      mileageKm: args.mileageKm,
      fuel: args.fuel,
      transmission: args.transmission,
      drivetrain: args.drivetrain,
      spec: args.spec,
      condition: args.condition,
      bodyType: args.bodyType,
      exteriorColor: args.exteriorColor,
      interiorColor: args.interiorColor,
      engine: args.engine,
      features: args.features,
      titleAr: args.titleAr,
      titleEn: args.titleEn,
      descriptionAr: args.descriptionAr,
      descriptionEn: args.descriptionEn,
      searchText: buildVehicleSearchText({
        stockCode,
        vin: args.vin,
        make: args.make,
        model: args.model,
        trim: args.trim,
        titleAr: args.titleAr,
        titleEn: args.titleEn,
        year: args.year,
      }),
      ownership: args.ownership,
      featured: args.featured ?? vehicle.featured,
      ownerName: args.ownerName,
      ownerPhone: args.ownerPhone,
      ownerNotes: args.ownerNotes,
      staffNotes: args.staffNotes,
      updatedAt: Date.now(),
    });
    return null;
  },
});

const MAX_BULK_VEHICLES = 100;

function uniqueVehicleIds(vehicleIds: Id<"vehicles">[]) {
  return [...new Set(vehicleIds)];
}

export const setStatus = authedMutation({
  args: {
    vehicleId: v.id("vehicles"),
    status: vehicleStatusValidator,
    staffNotes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updated = await applyVehicleStatus(ctx, args);
    if (!updated) {
      throw new ConvexError("Vehicle not found");
    }
    return null;
  },
});

export const setStatusMany = authedMutation({
  args: {
    vehicleIds: v.array(v.id("vehicles")),
    status: vehicleStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicleIds = uniqueVehicleIds(args.vehicleIds);
    if (vehicleIds.length > MAX_BULK_VEHICLES) {
      throw new ConvexError("Too many vehicles");
    }
    for (const vehicleId of vehicleIds) {
      await applyVehicleStatus(ctx, { vehicleId, status: args.status });
    }
    return null;
  },
});

export const remove = authedMutation({
  args: { vehicleId: v.id("vehicles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const removed = await deleteVehicleWithAssets(ctx, args.vehicleId);
    if (!removed) {
      throw new ConvexError("Vehicle not found");
    }
    return null;
  },
});

export const removeMany = authedMutation({
  args: {
    vehicleIds: v.array(v.id("vehicles")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicleIds = uniqueVehicleIds(args.vehicleIds);
    if (vehicleIds.length > MAX_BULK_VEHICLES) {
      throw new ConvexError("Too many vehicles");
    }
    for (const vehicleId of vehicleIds) {
      await deleteVehicleWithAssets(ctx, vehicleId);
    }
    return null;
  },
});

export const listQueue = authedQuery({
  args: {},
  returns: v.array(staffVehicleValidator),
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .take(100);

    const page = [];
    for (const vehicle of pending) {
      page.push(await toStaffVehicleRecord(ctx, vehicle));
    }
    return page;
  },
});

const VEHICLE_STATUSES = [
  "published",
  "draft",
  "pending_review",
  "hidden",
  "sold",
  "rejected",
] as const;

const dashboardStatsValidator = v.object({
  byStatus: v.object({
    published: v.number(),
    draft: v.number(),
    pending_review: v.number(),
    hidden: v.number(),
    sold: v.number(),
    rejected: v.number(),
  }),
  featuredPublished: v.number(),
  total: v.number(),
});

const recentPendingValidator = v.object({
  _id: v.id("vehicles"),
  stockCode: v.string(),
  year: v.number(),
  make: v.string(),
  model: v.string(),
  trim: v.optional(v.string()),
  titleAr: v.string(),
  titleEn: v.string(),
  ownerName: v.optional(v.string()),
  createdAt: v.number(),
});

export const dashboardStats = authedQuery({
  args: {},
  returns: dashboardStatsValidator,
  handler: async (ctx) => {
    const counted = await Promise.all(
      VEHICLE_STATUSES.map(async (status) => {
        const rows = await ctx.db
          .query("vehicles")
          .withIndex("by_status", (q) => q.eq("status", status))
          .take(500);
        return [status, rows.length] as const;
      }),
    );

    const byStatus = {
      published: 0,
      draft: 0,
      pending_review: 0,
      hidden: 0,
      sold: 0,
      rejected: 0,
    };
    for (const [status, count] of counted) {
      byStatus[status] = count;
    }

    const featured = await ctx.db
      .query("vehicles")
      .withIndex("by_status_and_featured", (q) =>
        q.eq("status", "published").eq("featured", true),
      )
      .take(100);

    return {
      byStatus,
      featuredPublished: featured.length,
      total: VEHICLE_STATUSES.reduce((sum, status) => sum + byStatus[status], 0),
    };
  },
});

export const listRecentPending = authedQuery({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(recentPendingValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
    const pending = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .order("desc")
      .take(limit);

    return pending.map((vehicle) => ({
      _id: vehicle._id,
      stockCode: vehicle.stockCode,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      titleAr: vehicle.titleAr,
      titleEn: vehicle.titleEn,
      ownerName: vehicle.ownerName,
      createdAt: vehicle.createdAt,
    }));
  },
});
