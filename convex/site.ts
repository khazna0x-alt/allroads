import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { adminMutation } from "./lib/customFunctions";
import { normalizeOmaniPhone } from "./lib/identifiers";
import {
  DEFAULT_WHATSAPP_LOCAL,
  SITE_SETTINGS_KEY,
  whatsappChatUrl,
  whatsappDisplay,
} from "./lib/siteContact";

const contactReturn = v.object({
  whatsappLocal: v.string(),
  whatsappHref: v.string(),
  whatsappDisplay: v.string(),
});

export const getContact = query({
  args: {},
  returns: contactReturn,
  handler: async (ctx) => {
    const row = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", SITE_SETTINGS_KEY))
      .unique();
    const whatsappLocal = row?.whatsappPhone ?? DEFAULT_WHATSAPP_LOCAL;
    return {
      whatsappLocal,
      whatsappHref: whatsappChatUrl(whatsappLocal),
      whatsappDisplay: whatsappDisplay(whatsappLocal),
    };
  },
});

export const setWhatsappPhone = adminMutation({
  args: {
    phone: v.string(),
  },
  returns: contactReturn,
  handler: async (ctx, args) => {
    let whatsappLocal: string;
    try {
      whatsappLocal = normalizeOmaniPhone(args.phone);
    } catch (error) {
      throw new ConvexError(
        error instanceof Error ? error.message : "Enter a valid Omani phone number",
      );
    }

    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", SITE_SETTINGS_KEY))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch("siteSettings", existing._id, {
        whatsappPhone: whatsappLocal,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("siteSettings", {
        key: SITE_SETTINGS_KEY,
        whatsappPhone: whatsappLocal,
        updatedAt: now,
      });
    }

    return {
      whatsappLocal,
      whatsappHref: whatsappChatUrl(whatsappLocal),
      whatsappDisplay: whatsappDisplay(whatsappLocal),
    };
  },
});
