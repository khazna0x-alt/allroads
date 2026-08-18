import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { logAudit, logVehicleStatusChange } from "./lib/audit";
import { isOnPublicFloor } from "./lib/publish";
import { mapLegacyVehicleStatus } from "./lib/vehicleStatus";

const ALERT_MS = 14 * 24 * 60 * 60 * 1000;
const BATCH = 25;

export const sweepExpiring = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.object({
    scanned: v.number(),
    alerted: v.number(),
    expired: v.number(),
    continued: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const result = await ctx.db
      .query("vehicles")
      .withIndex("by_contract_status_and_ends_at", (q) =>
        q.eq("contractStatus", "signed").lte("contractEndsAt", now + ALERT_MS),
      )
      .paginate({
        numItems: BATCH,
        cursor: args.cursor ?? null,
      });

    let alerted = 0;
    let expired = 0;

    for (const vehicle of result.page) {
      const endsAt = vehicle.contractEndsAt;
      if (endsAt === undefined) {
        continue;
      }

      if (endsAt < now) {
        const fromStatus = mapLegacyVehicleStatus(vehicle.status);
        const onFloor = isOnPublicFloor(vehicle);
        await ctx.db.patch("vehicles", vehicle._id, {
          contractStatus: "expired",
          publicHidden: onFloor ? true : vehicle.publicHidden,
          status: onFloor ? "expired" : vehicle.status,
          updatedAt: now,
        });
        await logAudit(ctx, {
          vehicleId: vehicle._id,
          editType: "contract_expired",
          fromValue: vehicle.contractStatus,
          toValue: "expired",
        });
        if (onFloor && fromStatus !== "expired") {
          await logVehicleStatusChange(ctx, {
            vehicleId: vehicle._id,
            fromStatus,
            toStatus: "expired",
            notes: "Contract expired while live",
          });
        }
        await ctx.scheduler.runAfter(0, internal.notifications.notifyContractExpiry, {
          vehicleId: vehicle._id,
          stockCode: vehicle.stockCode,
          kind: "expired" as const,
          endsAt,
        });
        expired += 1;
        continue;
      }

      if (vehicle.contractExpiryAlertedAt !== undefined) {
        continue;
      }

      await ctx.db.patch("vehicles", vehicle._id, {
        contractExpiryAlertedAt: now,
        updatedAt: now,
      });
      await logAudit(ctx, {
        vehicleId: vehicle._id,
        editType: "contract_expiry_alert",
        notes: String(endsAt),
      });
      await ctx.scheduler.runAfter(0, internal.notifications.notifyContractExpiry, {
        vehicleId: vehicle._id,
        stockCode: vehicle.stockCode,
        kind: "expiring" as const,
        endsAt,
      });
      alerted += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.contractJobs.sweepExpiring, {
        cursor: result.continueCursor,
      });
    }

    return {
      scanned: result.page.length,
      alerted,
      expired,
      continued: !result.isDone,
    };
  },
});
