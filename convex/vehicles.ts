import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { applyContractFields, assertContractUpload, sanitizeContractFileName } from "./lib/contracts";
import { logAudit } from "./lib/audit";
import {
  contractStatusValidator,
  staffVehicleValidator,
  vehicleStatusValidator,
  vehicleWriteValidator,
} from "./lib/validators";
import type { Id } from "./_generated/dataModel";
import {
  applyPublicHidden,
  applyVehicleStatus,
  assertUniqueStockAndVin,
  buildVehicleSearchText,
  buildVehicleSlug,
  deleteVehicleWithAssets,
  nextStockCode,
  toStaffVehicleRecord,
} from "./lib/vehicles";
import { QUEUE_STATUSES, OWNER_DESK_STATUSES, VEHICLE_STATUSES, mapLegacyVehicleStatus } from "./lib/vehicleStatus";

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
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
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
    const status = args.status ?? "approved";
    if (status === "published" || status === "approved_for_publishing") {
      throw new ConvexError("Cannot publish until inspection, signed contract, and on-site confirmation");
    }
    const publicHidden = args.publicHidden ?? false;
    const onSiteConfirmed = args.onSiteConfirmed ?? false;

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
      publicHidden,
      onSiteConfirmed,
      onSiteConfirmedAt: onSiteConfirmed ? now : undefined,
      contractStatus: args.contractStatus,
      contractStartsAt: args.contractStartsAt,
      contractEndsAt: args.contractEndsAt,
      ownerName: args.ownerName,
      ownerPhone: args.ownerPhone,
      ownerNotes: args.ownerNotes,
      staffNotes: args.staffNotes,
      publishedAt: undefined,
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
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      throw new ConvexError("Vehicle not found");
    }

    const stockCode = args.stockCode?.trim() || vehicle.stockCode;
    await assertUniqueStockAndVin(ctx, {
      stockCode,
      vin: args.vin,
      excludeId: args.vehicleId,
    });

    const nextContractStatus = args.contractStatus ?? vehicle.contractStatus;
    if (
      nextContractStatus === "signed" &&
      !vehicle.contractStorageId &&
      vehicle.publishGrandfathered !== true
    ) {
      throw new ConvexError("Upload the signed contract copy first");
    }

    await ctx.db.patch("vehicles", args.vehicleId, {
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
      publicHidden: args.publicHidden ?? vehicle.publicHidden,
      onSiteConfirmed: args.onSiteConfirmed ?? vehicle.onSiteConfirmed,
      onSiteConfirmedAt:
        args.onSiteConfirmed === true
          ? (vehicle.onSiteConfirmedAt ?? Date.now())
          : args.onSiteConfirmed === false
            ? undefined
            : vehicle.onSiteConfirmedAt,
      contractStatus: args.contractStatus ?? vehicle.contractStatus,
      contractStartsAt: args.contractStartsAt ?? vehicle.contractStartsAt,
      contractEndsAt: args.contractEndsAt ?? vehicle.contractEndsAt,
      contractExpiryAlertedAt:
        args.contractStartsAt !== undefined || args.contractEndsAt !== undefined
          ? undefined
          : vehicle.contractExpiryAlertedAt,
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
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updated = await applyVehicleStatus(ctx, {
      vehicleId: args.vehicleId,
      status: args.status,
      staffNotes: args.staffNotes,
      reason: args.reason,
      notes: args.notes,
      actorUserId: ctx.user._id,
    });
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
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicleIds = uniqueVehicleIds(args.vehicleIds);
    if (vehicleIds.length > MAX_BULK_VEHICLES) {
      throw new ConvexError("Too many vehicles");
    }
    for (const vehicleId of vehicleIds) {
      await applyVehicleStatus(ctx, {
        vehicleId,
        status: args.status,
        reason: args.reason,
        actorUserId: ctx.user._id,
      });
    }
    return null;
  },
});

export const setPublicHidden = authedMutation({
  args: {
    vehicleId: v.id("vehicles"),
    publicHidden: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updated = await applyPublicHidden(ctx, {
      vehicleId: args.vehicleId,
      publicHidden: args.publicHidden,
      actorUserId: ctx.user._id,
    });
    if (!updated) {
      throw new ConvexError("Vehicle not found");
    }
    return null;
  },
});

export const setPublicHiddenMany = authedMutation({
  args: {
    vehicleIds: v.array(v.id("vehicles")),
    publicHidden: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicleIds = uniqueVehicleIds(args.vehicleIds);
    if (vehicleIds.length > MAX_BULK_VEHICLES) {
      throw new ConvexError("Too many vehicles");
    }
    for (const vehicleId of vehicleIds) {
      await applyPublicHidden(ctx, {
        vehicleId,
        publicHidden: args.publicHidden,
        actorUserId: ctx.user._id,
      });
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
    const rows = (
      await Promise.all(
        [...OWNER_DESK_STATUSES, "pending_review" as const].map((status) =>
          ctx.db
            .query("vehicles")
            .withIndex("by_status", (q) => q.eq("status", status))
            .take(100),
        ),
      )
    ).flat();

    rows.sort((a, b) => b.createdAt - a.createdAt);
    const seen = new Set<string>();
    const page = [];
    for (const vehicle of rows) {
      if (seen.has(vehicle._id)) {
        continue;
      }
      seen.add(vehicle._id);
      page.push(await toStaffVehicleRecord(ctx, vehicle));
    }
    return page;
  },
});

const dashboardStatusCountsValidator = v.object({
  new: v.number(),
  under_review: v.number(),
  inspection_scheduled: v.number(),
  under_inspection: v.number(),
  awaiting_contract: v.number(),
  approved: v.number(),
  not_accepted: v.number(),
  approved_for_publishing: v.number(),
  published: v.number(),
  reserved: v.number(),
  booked: v.number(),
  sold: v.number(),
  withdrawn: v.number(),
  expired: v.number(),
});

const dashboardStatsValidator = v.object({
  byStatus: dashboardStatusCountsValidator,
  featuredPublished: v.number(),
  queueCount: v.number(),
  onFloor: v.number(),
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

const COUNT_STATUSES = [
  ...VEHICLE_STATUSES,
  "pending_review",
  "draft",
  "hidden",
  "rejected",
] as const;

export const dashboardStats = authedQuery({
  args: {},
  returns: dashboardStatsValidator,
  handler: async (ctx) => {
    const byStatus = {
      new: 0,
      under_review: 0,
      inspection_scheduled: 0,
      under_inspection: 0,
      awaiting_contract: 0,
      approved: 0,
      not_accepted: 0,
      approved_for_publishing: 0,
      published: 0,
      reserved: 0,
      booked: 0,
      sold: 0,
      withdrawn: 0,
      expired: 0,
    };

    const counted = await Promise.all(
      COUNT_STATUSES.map(async (status) => {
        const rows = await ctx.db
          .query("vehicles")
          .withIndex("by_status", (q) => q.eq("status", status))
          .take(500);
        return [status, rows.length] as const;
      }),
    );

    let total = 0;
    for (const [status, count] of counted) {
      const mapped = mapLegacyVehicleStatus(status);
      byStatus[mapped] += count;
      total += count;
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
      queueCount: byStatus.new + byStatus.under_review,
      onFloor: byStatus.published + byStatus.reserved + byStatus.booked,
      total,
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
    const rows = (
      await Promise.all(
        [...QUEUE_STATUSES, "pending_review" as const].map((status) =>
          ctx.db
            .query("vehicles")
            .withIndex("by_status", (q) => q.eq("status", status))
            .order("desc")
            .take(limit),
        ),
      )
    ).flat();

    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.slice(0, limit).map((vehicle) => ({
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

export const generateContractUploadUrl = authedMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachContract = authedMutation({
  args: {
    vehicleId: v.id("vehicles"),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      throw new ConvexError("Vehicle not found");
    }
    await assertContractUpload(ctx, args.storageId);
    if (vehicle.contractStorageId && vehicle.contractStorageId !== args.storageId) {
      await ctx.storage.delete(vehicle.contractStorageId);
    }
    const nextStatus = vehicle.contractStatus === "signed" ? "signed" : "awaiting_signature";
    await ctx.db.patch("vehicles", args.vehicleId, {
      contractStorageId: args.storageId,
      contractFileName: sanitizeContractFileName(args.fileName),
      contractStatus: nextStatus,
      updatedAt: Date.now(),
    });
    await logAudit(ctx, {
      actorUserId: ctx.user._id,
      vehicleId: args.vehicleId,
      editType: "contract_update",
      fromValue: vehicle.contractStatus,
      toValue: nextStatus,
      notes: sanitizeContractFileName(args.fileName),
    });
    return null;
  },
});

export const updateContract = authedMutation({
  args: {
    vehicleId: v.id("vehicles"),
    contractStatus: contractStatusValidator,
    contractStartsAt: v.optional(v.number()),
    contractEndsAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      throw new ConvexError("Vehicle not found");
    }
    await applyContractFields(ctx, {
      vehicle,
      actorUserId: ctx.user._id,
      contractStatus: args.contractStatus,
      contractStartsAt: args.contractStartsAt,
      contractEndsAt: args.contractEndsAt,
    });
    return null;
  },
});

export const patchStaffNotes = authedMutation({
  args: {
    vehicleId: v.id("vehicles"),
    staffNotes: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      throw new ConvexError("Vehicle not found");
    }
    await ctx.db.patch("vehicles", args.vehicleId, {
      staffNotes: args.staffNotes.trim() || undefined,
      updatedAt: Date.now(),
    });
    await logAudit(ctx, {
      actorUserId: ctx.user._id,
      vehicleId: args.vehicleId,
      editType: "field_edit",
      notes: "staffNotes",
    });
    return null;
  },
});
