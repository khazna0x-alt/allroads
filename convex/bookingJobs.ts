import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { logAudit } from "./lib/audit";
import { paymentForBooking } from "./lib/bookings";
import { applyVehicleStatus } from "./lib/vehicles";
import { mapLegacyVehicleStatus } from "./lib/vehicleStatus";

const BATCH = 25;

export const sweepExpiredHolds = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.object({
    scanned: v.number(),
    expired: v.number(),
    continued: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const result = await ctx.db
      .query("bookings")
      .withIndex("by_status_and_ends_at", (q) =>
        q.eq("status", "reserved").lte("endsAt", now),
      )
      .paginate({
        numItems: BATCH,
        cursor: args.cursor ?? null,
      });

    let expired = 0;
    for (const booking of result.page) {
      if (booking.endsAt > now || booking.status !== "reserved") {
        continue;
      }

      await ctx.db.patch("bookings", booking._id, {
        status: "expired",
        updatedAt: now,
      });
      const payment = await paymentForBooking(ctx, booking._id);
      if (payment && payment.status === "pending") {
        await ctx.db.patch("payments", payment._id, {
          status: "cancelled",
          updatedAt: now,
        });
      }

      const vehicle = await ctx.db.get("vehicles", booking.vehicleId);
      if (vehicle) {
        const status = mapLegacyVehicleStatus(vehicle.status);
        if (status === "reserved" || status === "booked") {
          await applyVehicleStatus(ctx, {
            vehicleId: booking.vehicleId,
            status: "published",
            notes: `Booking ${booking.bookingNumber} expired`,
          });
        }
      }

      await logAudit(ctx, {
        vehicleId: booking.vehicleId,
        editType: "booking_expired",
        fromValue: "reserved",
        toValue: "expired",
        notes: booking.bookingNumber,
      });
      await ctx.scheduler.runAfter(0, internal.notifications.notifyBooking, {
        bookingId: booking._id,
        vehicleId: booking.vehicleId,
        bookingNumber: booking.bookingNumber,
        stockCode: vehicle?.stockCode ?? "",
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        ...(booking.customerEmail ? { customerEmail: booking.customerEmail } : {}),
        depositOmr: booking.depositOmr,
        event: "booking_expired" as const,
      });
      expired += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.bookingJobs.sweepExpiredHolds, {
        cursor: result.continueCursor,
      });
    }

    return {
      scanned: result.page.length,
      expired,
      continued: !result.isDone,
    };
  },
});
