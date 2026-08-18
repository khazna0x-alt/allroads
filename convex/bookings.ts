import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { logAudit } from "./lib/audit";
import { assertContractUpload, sanitizeContractFileName } from "./lib/contracts";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { normalizeOmaniPhone } from "./lib/identifiers";
import {
  assertDurationDays,
  DAY_MS,
  depositOmrForPrice,
  findActiveBooking,
  isBookableStatus,
  nextBookingNumber,
  normalizeOptionalEmail,
  paymentForBooking,
} from "./lib/bookings";
import { isOnPublicFloor } from "./lib/publish";
import {
  bookingDurationDaysValidator,
  bookingStatusValidator,
  localeValidator,
  paymentStatusValidator,
} from "./lib/validators";
import { applyVehicleStatus } from "./lib/vehicles";
import { mapLegacyVehicleStatus } from "./lib/vehicleStatus";
import { resolveArabicTitle } from "./lib/vehicleCopy";

const staffPaymentValidator = v.object({
  _id: v.id("payments"),
  amountOmr: v.number(),
  status: paymentStatusValidator,
  method: v.union(v.literal("bank_transfer"), v.literal("gateway_later")),
  receiptUrl: v.union(v.string(), v.null()),
  receiptFileName: v.optional(v.string()),
  notes: v.optional(v.string()),
  refundNotes: v.optional(v.string()),
  refundedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const staffBookingValidator = v.object({
  _id: v.id("bookings"),
  bookingNumber: v.string(),
  vehicleId: v.id("vehicles"),
  customerName: v.string(),
  customerPhone: v.string(),
  customerEmail: v.optional(v.string()),
  durationDays: bookingDurationDaysValidator,
  startsAt: v.number(),
  endsAt: v.number(),
  depositOmr: v.number(),
  paymentMethod: v.union(v.literal("bank_transfer"), v.literal("gateway_later")),
  notes: v.optional(v.string()),
  status: bookingStatusValidator,
  locale: localeValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
  vehicleStockCode: v.string(),
  vehicleTitleEn: v.string(),
  vehicleTitleAr: v.string(),
  payment: v.union(staffPaymentValidator, v.null()),
});

async function toStaffPayment(ctx: QueryCtx, payment: Doc<"payments">) {
  const receiptUrl = payment.receiptStorageId
    ? await ctx.storage.getUrl(payment.receiptStorageId)
    : null;
  return {
    _id: payment._id,
    amountOmr: payment.amountOmr,
    status: payment.status,
    method: payment.method,
    receiptUrl,
    ...(payment.receiptFileName ? { receiptFileName: payment.receiptFileName } : {}),
    ...(payment.notes ? { notes: payment.notes } : {}),
    ...(payment.refundNotes ? { refundNotes: payment.refundNotes } : {}),
    ...(payment.refundedAt !== undefined ? { refundedAt: payment.refundedAt } : {}),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

async function toStaffBooking(ctx: QueryCtx, booking: Doc<"bookings">) {
  const vehicle = await ctx.db.get("vehicles", booking.vehicleId);
  const payment = await paymentForBooking(ctx, booking._id);
  return {
    _id: booking._id,
    bookingNumber: booking.bookingNumber,
    vehicleId: booking.vehicleId,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    ...(booking.customerEmail ? { customerEmail: booking.customerEmail } : {}),
    durationDays: booking.durationDays,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    depositOmr: booking.depositOmr,
    paymentMethod: booking.paymentMethod,
    ...(booking.notes ? { notes: booking.notes } : {}),
    status: booking.status,
    locale: booking.locale,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    vehicleStockCode: vehicle?.stockCode ?? "",
    vehicleTitleEn: vehicle?.titleEn ?? "",
    vehicleTitleAr: vehicle ? resolveArabicTitle(vehicle) : "",
    payment: payment ? await toStaffPayment(ctx, payment) : null,
  };
}

async function releaseVehicleHold(
  ctx: Parameters<typeof applyVehicleStatus>[0],
  vehicleId: Doc<"bookings">["vehicleId"],
  notes: string,
  actorUserId?: Doc<"users">["_id"],
): Promise<void> {
  const vehicle = await ctx.db.get("vehicles", vehicleId);
  if (!vehicle) {
    return;
  }
  const status = mapLegacyVehicleStatus(vehicle.status);
  if (status !== "reserved" && status !== "booked") {
    return;
  }
  await applyVehicleStatus(ctx, {
    vehicleId,
    status: "published",
    notes,
    actorUserId,
  });
}

export const createBooking = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),
    durationDays: bookingDurationDaysValidator,
    notes: v.optional(v.string()),
    acceptedTerms: v.boolean(),
    locale: localeValidator,
  },
  returns: v.object({
    bookingId: v.id("bookings"),
    bookingNumber: v.string(),
    depositOmr: v.number(),
    startsAt: v.number(),
    endsAt: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!args.acceptedTerms) {
      throw new ConvexError("Booking terms must be accepted");
    }
    if (args.customerName.trim().length < 2) {
      throw new ConvexError("Name must be at least 2 characters");
    }

    const durationDays = assertDurationDays(args.durationDays);
    const phone = normalizeOmaniPhone(args.customerPhone);
    const email = normalizeOptionalEmail(args.customerEmail);
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle || !isOnPublicFloor(vehicle)) {
      throw new ConvexError("Vehicle is not available");
    }
    if (!isBookableStatus(vehicle.status)) {
      throw new ConvexError("This car is already reserved or booked");
    }

    const existing = await findActiveBooking(ctx, args.vehicleId);
    if (existing) {
      throw new ConvexError("This car already has an active booking");
    }

    const now = Date.now();
    const startsAt = now;
    const endsAt = now + durationDays * DAY_MS;
    const depositOmr = depositOmrForPrice(vehicle.priceOmr);
    const bookingNumber = await nextBookingNumber(ctx);

    const bookingId = await ctx.db.insert("bookings", {
      bookingNumber,
      vehicleId: args.vehicleId,
      customerName: args.customerName.trim(),
      customerPhone: phone,
      ...(email ? { customerEmail: email } : {}),
      durationDays,
      startsAt,
      endsAt,
      depositOmr,
      paymentMethod: "bank_transfer",
      ...(args.notes?.trim() ? { notes: args.notes.trim() } : {}),
      status: "reserved",
      locale: args.locale,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("payments", {
      bookingId,
      amountOmr: depositOmr,
      status: "pending",
      method: "bank_transfer",
      createdAt: now,
      updatedAt: now,
    });

    await applyVehicleStatus(ctx, {
      vehicleId: args.vehicleId,
      status: "reserved",
      notes: `Booking ${bookingNumber}`,
    });
    await logAudit(ctx, {
      vehicleId: args.vehicleId,
      editType: "booking_submit",
      toValue: bookingNumber,
      notes: `${depositOmr} OMR · ${durationDays}d`,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.notifyBooking, {
      bookingId,
      vehicleId: args.vehicleId,
      bookingNumber,
      stockCode: vehicle.stockCode,
      customerName: args.customerName.trim(),
      customerPhone: phone,
      ...(email ? { customerEmail: email } : {}),
      depositOmr,
      event: "booking_requested" as const,
    });

    return { bookingId, bookingNumber, depositOmr, startsAt, endsAt };
  },
});

export const generateReceiptUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachReceipt = mutation({
  args: {
    bookingNumber: v.string(),
    phone: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const phone = normalizeOmaniPhone(args.phone);
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_booking_number", (q) => q.eq("bookingNumber", args.bookingNumber.trim()))
      .unique();
    if (!booking || booking.customerPhone !== phone) {
      throw new ConvexError("Booking not found");
    }
    if (booking.status === "cancelled" || booking.status === "expired") {
      throw new ConvexError("This booking is no longer active");
    }

    await assertContractUpload(ctx, args.storageId);
    const payment = await paymentForBooking(ctx, booking._id);
    if (!payment) {
      throw new ConvexError("Payment record not found");
    }
    if (payment.receiptStorageId) {
      await ctx.storage.delete(payment.receiptStorageId);
    }
    const now = Date.now();
    await ctx.db.patch("payments", payment._id, {
      receiptStorageId: args.storageId,
      receiptFileName: sanitizeContractFileName(args.fileName),
      updatedAt: now,
    });
    await logAudit(ctx, {
      vehicleId: booking.vehicleId,
      editType: "payment_update",
      notes: `Receipt uploaded for ${booking.bookingNumber}`,
    });
    return null;
  },
});

export const listStaff = authedQuery({
  args: {
    status: v.optional(bookingStatusValidator),
  },
  returns: v.array(staffBookingValidator),
  handler: async (ctx, args) => {
    const rows = args.status
      ? await ctx.db
          .query("bookings")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(200)
      : await ctx.db.query("bookings").withIndex("by_created").order("desc").take(200);

    const page = [];
    for (const booking of rows) {
      page.push(await toStaffBooking(ctx, booking));
    }
    return page;
  },
});

export const deskStats = authedQuery({
  args: {},
  returns: v.object({
    reservedCount: v.number(),
    bookedCount: v.number(),
  }),
  handler: async (ctx) => {
    const [reserved, booked] = await Promise.all([
      ctx.db
        .query("bookings")
        .withIndex("by_status", (q) => q.eq("status", "reserved"))
        .take(200),
      ctx.db
        .query("bookings")
        .withIndex("by_status", (q) => q.eq("status", "booked"))
        .take(200),
    ]);
    return {
      reservedCount: reserved.length,
      bookedCount: booked.length,
    };
  },
});

export const approve = authedMutation({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking || booking.status !== "reserved") {
      throw new ConvexError("Only a reserved booking can be approved");
    }
    const now = Date.now();
    await ctx.db.patch("bookings", booking._id, {
      status: "booked",
      updatedAt: now,
    });
    await applyVehicleStatus(ctx, {
      vehicleId: booking.vehicleId,
      status: "booked",
      notes: `Approved ${booking.bookingNumber}`,
      actorUserId: ctx.user._id,
    });
    await logAudit(ctx, {
      actorUserId: ctx.user._id,
      vehicleId: booking.vehicleId,
      editType: "booking_update",
      fromValue: "reserved",
      toValue: "booked",
      notes: booking.bookingNumber,
    });

    const vehicle = await ctx.db.get("vehicles", booking.vehicleId);
    await ctx.scheduler.runAfter(0, internal.notifications.notifyBooking, {
      bookingId: booking._id,
      vehicleId: booking.vehicleId,
      bookingNumber: booking.bookingNumber,
      stockCode: vehicle?.stockCode ?? "",
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      ...(booking.customerEmail ? { customerEmail: booking.customerEmail } : {}),
      depositOmr: booking.depositOmr,
      event: "booking_approved" as const,
    });
    return null;
  },
});

export const cancel = authedMutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) {
      throw new ConvexError("Booking not found");
    }
    if (booking.status === "cancelled" || booking.status === "expired") {
      throw new ConvexError("Booking is already closed");
    }
    const now = Date.now();
    await ctx.db.patch("bookings", booking._id, {
      status: "cancelled",
      updatedAt: now,
    });
    const payment = await paymentForBooking(ctx, booking._id);
    if (payment && payment.status === "pending") {
      const reason = args.reason?.trim();
      await ctx.db.patch("payments", payment._id, {
        status: "cancelled",
        updatedAt: now,
        ...(reason ? { notes: reason } : {}),
      });
    }
    await releaseVehicleHold(
      ctx,
      booking.vehicleId,
      `Cancelled ${booking.bookingNumber}`,
      ctx.user._id,
    );
    await logAudit(ctx, {
      actorUserId: ctx.user._id,
      vehicleId: booking.vehicleId,
      editType: "booking_update",
      fromValue: booking.status,
      toValue: "cancelled",
      ...(args.reason?.trim() ? { reason: args.reason.trim() } : {}),
      notes: booking.bookingNumber,
    });

    const vehicle = await ctx.db.get("vehicles", booking.vehicleId);
    await ctx.scheduler.runAfter(0, internal.notifications.notifyBooking, {
      bookingId: booking._id,
      vehicleId: booking.vehicleId,
      bookingNumber: booking.bookingNumber,
      stockCode: vehicle?.stockCode ?? "",
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      ...(booking.customerEmail ? { customerEmail: booking.customerEmail } : {}),
      depositOmr: booking.depositOmr,
      event: "booking_cancelled" as const,
    });
    return null;
  },
});

export const extend = authedMutation({
  args: {
    bookingId: v.id("bookings"),
    extraDays: bookingDurationDaysValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) {
      throw new ConvexError("Booking not found");
    }
    if (booking.status !== "reserved" && booking.status !== "booked") {
      throw new ConvexError("Only an active booking can be extended");
    }
    const extraDays = assertDurationDays(args.extraDays);
    const base = Math.max(booking.endsAt, Date.now());
    const endsAt = base + extraDays * DAY_MS;

    await ctx.db.patch("bookings", booking._id, {
      endsAt,
      updatedAt: Date.now(),
    });
    await logAudit(ctx, {
      actorUserId: ctx.user._id,
      vehicleId: booking.vehicleId,
      editType: "booking_update",
      notes: `${booking.bookingNumber} extended +${extraDays}d`,
    });
    return null;
  },
});

export const setPaymentStatus = authedMutation({
  args: {
    bookingId: v.id("bookings"),
    status: paymentStatusValidator,
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) {
      throw new ConvexError("Booking not found");
    }
    const payment = await paymentForBooking(ctx, booking._id);
    if (!payment) {
      throw new ConvexError("Payment record not found");
    }
    const now = Date.now();
    const note = args.notes?.trim();
    await ctx.db.patch("payments", payment._id, {
      status: args.status,
      updatedAt: now,
      ...(note ? { notes: note } : {}),
      ...(args.status === "refunded"
        ? { refundedAt: now, ...(note ? { refundNotes: note } : {}) }
        : {}),
    });
    await logAudit(ctx, {
      actorUserId: ctx.user._id,
      vehicleId: booking.vehicleId,
      editType: "payment_update",
      fromValue: payment.status,
      toValue: args.status,
      notes: `${booking.bookingNumber}${args.notes?.trim() ? ` · ${args.notes.trim()}` : ""}`,
    });
    return null;
  },
});

export const attachReceiptStaff = authedMutation({
  args: {
    bookingId: v.id("bookings"),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) {
      throw new ConvexError("Booking not found");
    }
    await assertContractUpload(ctx, args.storageId);
    const payment = await paymentForBooking(ctx, booking._id);
    if (!payment) {
      throw new ConvexError("Payment record not found");
    }
    if (payment.receiptStorageId) {
      await ctx.storage.delete(payment.receiptStorageId);
    }
    await ctx.db.patch("payments", payment._id, {
      receiptStorageId: args.storageId,
      receiptFileName: sanitizeContractFileName(args.fileName),
      updatedAt: Date.now(),
    });
    await logAudit(ctx, {
      actorUserId: ctx.user._id,
      vehicleId: booking.vehicleId,
      editType: "payment_update",
      notes: `Staff receipt for ${booking.bookingNumber}`,
    });
    return null;
  },
});
