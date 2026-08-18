import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { mapLegacyVehicleStatus } from "./vehicleStatus";

export const BOOKING_DURATION_DAYS = [3, 7, 14] as const;
export type BookingDurationDays = (typeof BOOKING_DURATION_DAYS)[number];

export const DAY_MS = 24 * 60 * 60 * 1000;
export const BOOKING_DEPOSIT_MIN_OMR = 200;
export const BOOKING_DEPOSIT_PCT = 0.05;

const ACTIVE_BOOKING_STATUSES = ["reserved", "booked"] as const;

export function depositOmrForPrice(priceOmr: number): number {
  const fivePercent = Math.round(priceOmr * BOOKING_DEPOSIT_PCT);
  const raw = Math.max(BOOKING_DEPOSIT_MIN_OMR, fivePercent);
  return Math.ceil(raw / 50) * 50;
}

export function isBookableStatus(status: string): boolean {
  return mapLegacyVehicleStatus(status) === "published";
}

export async function nextBookingNumber(ctx: MutationCtx): Promise<string> {
  const counter = await ctx.db
    .query("counters")
    .withIndex("by_key", (q) => q.eq("key", "booking"))
    .unique();

  const next = (counter?.value ?? 1000) + 1;
  if (counter) {
    await ctx.db.patch("counters", counter._id, { value: next });
  } else {
    await ctx.db.insert("counters", { key: "booking", value: next });
  }
  return `BK-${next}`;
}

export async function findActiveBooking(
  ctx: QueryCtx | MutationCtx,
  vehicleId: Id<"vehicles">,
): Promise<Doc<"bookings"> | null> {
  for (const status of ACTIVE_BOOKING_STATUSES) {
    const row = await ctx.db
      .query("bookings")
      .withIndex("by_vehicle_and_status", (q) =>
        q.eq("vehicleId", vehicleId).eq("status", status),
      )
      .first();
    if (row) {
      return row;
    }
  }
  return null;
}

export async function paymentForBooking(
  ctx: QueryCtx | MutationCtx,
  bookingId: Id<"bookings">,
): Promise<Doc<"payments"> | null> {
  return await ctx.db
    .query("payments")
    .withIndex("by_booking", (q) => q.eq("bookingId", bookingId))
    .order("desc")
    .first();
}

export function assertDurationDays(value: number): BookingDurationDays {
  if (value === 3 || value === 7 || value === 14) {
    return value;
  }
  throw new ConvexError("Choose a booking duration of 3, 7, or 14 days");
}

export function normalizeOptionalEmail(raw: string | undefined): string | undefined {
  const email = raw?.trim().toLowerCase();
  if (!email) {
    return undefined;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ConvexError("Enter a valid email address");
  }
  return email;
}
