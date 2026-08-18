import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { logAudit } from "./lib/audit";

async function postWebhook(
  url: string | undefined,
  payload: Record<string, string | number | boolean | null>,
): Promise<void> {
  if (!url) {
    return;
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error("Notify webhook failed", response.status);
    }
  } catch (error) {
    console.error("Notify webhook error", error);
  }
}

export const recordConsignmentNotice = internalMutation({
  args: {
    vehicleId: v.id("vehicles"),
    stockCode: v.string(),
    ownerName: v.string(),
    summary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await logAudit(ctx, {
      vehicleId: args.vehicleId,
      editType: "staff_notify",
      notes: `${args.stockCode} · ${args.ownerName} · ${args.summary}`,
    });
    return null;
  },
});

export const recordInquiryNotice = internalMutation({
  args: {
    inquiryId: v.id("inquiries"),
    vehicleId: v.optional(v.id("vehicles")),
    summary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await logAudit(ctx, {
      vehicleId: args.vehicleId,
      editType: "inquiry_submit",
      notes: `${args.inquiryId} · ${args.summary}`,
    });
    return null;
  },
});

export const recordBookingNotice = internalMutation({
  args: {
    vehicleId: v.id("vehicles"),
    bookingNumber: v.string(),
    summary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await logAudit(ctx, {
      vehicleId: args.vehicleId,
      editType: "staff_notify",
      notes: `${args.bookingNumber} · ${args.summary}`,
    });
    return null;
  },
});

export const notifyConsignment = internalAction({
  args: {
    vehicleId: v.id("vehicles"),
    stockCode: v.string(),
    ownerName: v.string(),
    ownerPhone: v.string(),
    year: v.number(),
    make: v.string(),
    model: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const summary = `${args.year} ${args.make} ${args.model}`;
    console.log(
      `[STAFF NOTIFY] New consignment ${args.stockCode}: ${summary} from ${args.ownerName} (${args.ownerPhone})`,
    );

    await postWebhook(process.env.STAFF_NOTIFY_WEBHOOK_URL, {
      event: "consignment_submitted",
      stockCode: args.stockCode,
      vehicleId: args.vehicleId,
      ownerName: args.ownerName,
      ownerPhone: args.ownerPhone,
      summary,
    });

    await ctx.runMutation(internal.notifications.recordConsignmentNotice, {
      vehicleId: args.vehicleId,
      stockCode: args.stockCode,
      ownerName: args.ownerName,
      summary,
    });
    return null;
  },
});

export const notifyInquiry = internalAction({
  args: {
    inquiryId: v.id("inquiries"),
    vehicleId: v.optional(v.id("vehicles")),
    stockCode: v.optional(v.string()),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    subject: v.string(),
    viewingRequested: v.boolean(),
    source: v.optional(v.string()),
    handoffReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const summary = args.stockCode
      ? `${args.subject} · ${args.stockCode}`
      : args.subject;
    const isHandoff = Boolean(args.handoffReason);
    console.log(
      `[STAFF NOTIFY] ${isHandoff ? "Bot handoff" : "New inquiry"} from ${args.name} (${args.phone}): ${summary}`,
    );

    await postWebhook(process.env.STAFF_NOTIFY_WEBHOOK_URL, {
      event: isHandoff ? "bot_handoff" : "inquiry_submitted",
      inquiryId: args.inquiryId,
      vehicleId: args.vehicleId ?? null,
      stockCode: args.stockCode ?? null,
      name: args.name,
      phone: args.phone,
      email: args.email ?? null,
      subject: args.subject,
      viewingRequested: args.viewingRequested,
      source: args.source ?? null,
      handoffReason: args.handoffReason ?? null,
    });

    if (args.email) {
      await postWebhook(process.env.CUSTOMER_NOTIFY_WEBHOOK_URL, {
        event: "inquiry_received",
        to: args.email,
        name: args.name,
        subject: args.subject,
        stockCode: args.stockCode ?? null,
      });
    }

    await ctx.runMutation(internal.notifications.recordInquiryNotice, {
      inquiryId: args.inquiryId,
      vehicleId: args.vehicleId,
      summary: args.handoffReason
        ? `${summary} · handoff: ${args.handoffReason}`
        : summary,
    });
    return null;
  },
});

export const notifyBooking = internalAction({
  args: {
    bookingId: v.id("bookings"),
    vehicleId: v.id("vehicles"),
    bookingNumber: v.string(),
    stockCode: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),
    depositOmr: v.number(),
    event: v.union(
      v.literal("booking_requested"),
      v.literal("booking_approved"),
      v.literal("booking_cancelled"),
      v.literal("booking_expired"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const summary = `${args.stockCode} · ${args.customerName} · ${args.depositOmr} OMR`;
    console.log(`[STAFF NOTIFY] ${args.event} ${args.bookingNumber}: ${summary}`);

    await postWebhook(process.env.STAFF_NOTIFY_WEBHOOK_URL, {
      event: args.event,
      bookingId: args.bookingId,
      bookingNumber: args.bookingNumber,
      vehicleId: args.vehicleId,
      stockCode: args.stockCode,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail ?? null,
      depositOmr: args.depositOmr,
    });

    if (args.customerEmail && args.event === "booking_requested") {
      await postWebhook(process.env.CUSTOMER_NOTIFY_WEBHOOK_URL, {
        event: "booking_received",
        to: args.customerEmail,
        name: args.customerName,
        bookingNumber: args.bookingNumber,
        stockCode: args.stockCode,
        depositOmr: args.depositOmr,
      });
    }

    await ctx.runMutation(internal.notifications.recordBookingNotice, {
      vehicleId: args.vehicleId,
      bookingNumber: args.bookingNumber,
      summary: `${args.event} · ${summary}`,
    });
    return null;
  },
});

export const notifyContractExpiry = internalAction({
  args: {
    vehicleId: v.id("vehicles"),
    stockCode: v.string(),
    kind: v.union(v.literal("expiring"), v.literal("expired")),
    endsAt: v.number(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const event = args.kind === "expired" ? "contract_expired" : "contract_expiring";
    console.log(
      `[STAFF NOTIFY] ${event} ${args.stockCode} ends ${new Date(args.endsAt).toISOString()}`,
    );

    await postWebhook(process.env.STAFF_NOTIFY_WEBHOOK_URL, {
      event,
      stockCode: args.stockCode,
      vehicleId: args.vehicleId,
      endsAt: args.endsAt,
    });
    return null;
  },
});

export const notifyHefflSyncFailed = internalAction({
  args: {
    inquiryId: v.id("inquiries"),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const inquiry = await ctx.runQuery(internal.integrations.heffl.getInquiry, {
      inquiryId: args.inquiryId,
    });
    const name = inquiry?.name ?? "unknown";
    const phone = inquiry?.phone ?? "";
    const subject = inquiry?.subject ?? "";
    console.error(
      `[STAFF NOTIFY] Heffl sync failed for ${name} (${phone}): ${args.reason}`,
    );

    await postWebhook(process.env.STAFF_NOTIFY_WEBHOOK_URL, {
      event: "heffl_sync_failed",
      inquiryId: args.inquiryId,
      name,
      phone,
      subject,
      stockCode: inquiry?.stockCode ?? null,
      reason: args.reason,
    });
    return null;
  },
});
