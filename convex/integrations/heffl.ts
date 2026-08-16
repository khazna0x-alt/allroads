import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";

export const getInquiry = internalQuery({
  args: { inquiryId: v.id("inquiries") },
  returns: v.union(
    v.object({
      _id: v.id("inquiries"),
      name: v.string(),
      phone: v.string(),
      subject: v.string(),
      message: v.string(),
      vehicleId: v.optional(v.id("vehicles")),
      source: v.string(),
      hefflSyncedAt: v.optional(v.number()),
      stockCode: v.optional(v.string()),
      titleEn: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const inquiry = await ctx.db.get("inquiries", args.inquiryId);
    if (!inquiry) {
      return null;
    }
    const vehicle = inquiry.vehicleId
      ? await ctx.db.get("vehicles", inquiry.vehicleId)
      : null;
    return {
      _id: inquiry._id,
      name: inquiry.name,
      phone: inquiry.phone,
      subject: inquiry.subject,
      message: inquiry.message,
      vehicleId: inquiry.vehicleId,
      source: inquiry.source,
      hefflSyncedAt: inquiry.hefflSyncedAt,
      stockCode: vehicle?.stockCode,
      titleEn: vehicle?.titleEn,
    };
  },
});

export const markSynced = internalMutation({
  args: { inquiryId: v.id("inquiries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("inquiries", args.inquiryId, { hefflSyncedAt: Date.now() });
    return null;
  },
});

export const syncLead = internalAction({
  args: { inquiryId: v.id("inquiries") },
  returns: v.object({
    skipped: v.boolean(),
    synced: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (process.env.HEFFL_ENABLED !== "true") {
      return { skipped: true, synced: false };
    }

    const apiKey = process.env.HEFFL_API_KEY;
    if (!apiKey) {
      console.error("HEFFL_ENABLED is true but HEFFL_API_KEY is missing");
      return { skipped: true, synced: false };
    }

    const inquiry = await ctx.runQuery(internal.integrations.heffl.getInquiry, {
      inquiryId: args.inquiryId,
    });
    if (!inquiry || inquiry.hefflSyncedAt) {
      return { skipped: true, synced: false };
    }

    const response = await fetch("https://api.heffl.com/v1/leads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: inquiry.name,
        mobile: inquiry.phone.length === 8 ? `+968${inquiry.phone}` : inquiry.phone,
        title: inquiry.subject,
        cf_vehicle: inquiry.titleEn,
        cf_stock: inquiry.stockCode,
        cf_source: inquiry.source,
        cf_message: inquiry.message,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Heffl lead sync failed", detail);
      throw new Error("Unable to sync lead to Heffl");
    }

    await ctx.runMutation(internal.integrations.heffl.markSynced, {
      inquiryId: args.inquiryId,
    });
    return { skipped: false, synced: true };
  },
});
