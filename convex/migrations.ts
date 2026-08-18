import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { logAudit } from "./lib/audit";
import { mapLegacyVehicleStatus } from "./lib/vehicleStatus";

export const backfillVehicleV2 = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    continued: v.boolean(),
    migrated: v.number(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db.query("vehicles").paginate({
      numItems: Math.min(Math.max(args.limit ?? 40, 1), 80),
      cursor: args.cursor ?? null,
    });
    const now = Date.now();
    let migrated = 0;

    for (const vehicle of result.page) {
      const mapped = mapLegacyVehicleStatus(vehicle.status);
      const wasHidden = vehicle.status === "hidden" || vehicle.publicHidden === true;
      const wasPublished = vehicle.status === "published" || mapped === "published";
      const publicHidden = vehicle.publicHidden ?? wasHidden;
      const onSiteConfirmed = vehicle.onSiteConfirmed ?? wasPublished;
      const publishGrandfathered = vehicle.publishGrandfathered ?? wasPublished;
      const contractStatus =
        vehicle.contractStatus ?? (wasPublished ? "signed" : vehicle.contractStorageId ? "unsigned" : undefined);

      await ctx.db.patch("vehicles", vehicle._id, {
        status: mapped,
        publicHidden,
        onSiteConfirmed,
        onSiteConfirmedAt:
          vehicle.onSiteConfirmedAt ?? (onSiteConfirmed ? (vehicle.publishedAt ?? now) : undefined),
        publishGrandfathered,
        contractStatus,
        updatedAt: now,
      });

      if (wasPublished) {
        const existingInspection = await ctx.db
          .query("inspections")
          .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
          .first();
        if (!existingInspection) {
          await ctx.db.insert("inspections", {
            vehicleId: vehicle._id,
            verdict: "accepted",
            inspectorName: "system",
            inspectedAt: vehicle.publishedAt ?? now,
            notes: "Grandfathered from pre-V2 published inventory",
            chassisMatchesDocs: true,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      await logAudit(ctx, {
        vehicleId: vehicle._id,
        editType: "migration",
        fromValue: vehicle.status,
        toValue: mapped,
        notes: wasPublished ? "grandfathered_published" : undefined,
      });
      migrated += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillVehicleV2, {
        cursor: result.continueCursor,
      });
    }

    return {
      continued: !result.isDone,
      migrated,
      cursor: result.continueCursor,
    };
  },
});
