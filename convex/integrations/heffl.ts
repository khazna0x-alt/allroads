import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";

const HEFFL_V1 = "https://api.heffl.com/api/v1";
const HEFFL_V2 = "https://api.heffl.com/api/v2";
const MAX_ATTEMPTS = 3;

const hefflIdsValidator = v.object({
  hefflContactId: v.optional(v.string()),
  hefflLeadId: v.optional(v.string()),
});

function toE164Oman(phone: string): string {
  return phone.length === 8 ? `+968${phone}` : phone;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readId(value: unknown): string | undefined {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }
  if (typeof record.id === "string" && record.id.length > 0) {
    return record.id;
  }
  const nested = asRecord(record.data);
  if (nested && typeof nested.id === "string" && nested.id.length > 0) {
    return nested.id;
  }
  return undefined;
}

function readListItems(value: unknown): Record<string, unknown>[] {
  const record = asRecord(value);
  if (!record || !Array.isArray(record.data)) {
    return [];
  }
  const items: Record<string, unknown>[] = [];
  for (const item of record.data) {
    const row = asRecord(item);
    if (row) {
      items.push(row);
    }
  }
  return items;
}

function hefflHeaders(apiKey: string): HeadersInit {
  return {
    "x-api-key": apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function lookupHefflIds(
  apiKey: string,
  phone: string,
): Promise<{ hefflContactId?: string; hefflLeadId?: string }> {
  const mobile = toE164Oman(phone);
  const search = encodeURIComponent(mobile);
  const headers = hefflHeaders(apiKey);

  const contactResponse = await fetch(`${HEFFL_V2}/contacts?search=${search}&pageSize=5`, {
    headers,
  });
  if (contactResponse.ok) {
    const items = readListItems(await readJson(contactResponse));
    const match = items.find((item) => typeof item.id === "string");
    if (match && typeof match.id === "string") {
      return { hefflContactId: match.id };
    }
  }

  const leadResponse = await fetch(`${HEFFL_V2}/leads?search=${search}&pageSize=5`, {
    headers,
  });
  if (leadResponse.ok) {
    const items = readListItems(await readJson(leadResponse));
    const match = items.find((item) => typeof item.id === "string");
    if (match && typeof match.id === "string") {
      return { hefflLeadId: match.id };
    }
  }

  return {};
}

export const getInquiry = internalQuery({
  args: { inquiryId: v.id("inquiries") },
  returns: v.union(
    v.object({
      _id: v.id("inquiries"),
      name: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      subject: v.string(),
      message: v.string(),
      vehicleId: v.optional(v.id("vehicles")),
      source: v.string(),
      hefflContactId: v.optional(v.string()),
      hefflLeadId: v.optional(v.string()),
      hefflSyncedAt: v.optional(v.number()),
      stockCode: v.optional(v.string()),
      titleEn: v.optional(v.string()),
      vehicleHefflContactId: v.optional(v.string()),
      vehicleHefflLeadId: v.optional(v.string()),
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
      ...(inquiry.email ? { email: inquiry.email } : {}),
      subject: inquiry.subject,
      message: inquiry.message,
      ...(inquiry.vehicleId ? { vehicleId: inquiry.vehicleId } : {}),
      source: inquiry.source,
      ...(inquiry.hefflContactId ? { hefflContactId: inquiry.hefflContactId } : {}),
      ...(inquiry.hefflLeadId ? { hefflLeadId: inquiry.hefflLeadId } : {}),
      ...(inquiry.hefflSyncedAt !== undefined ? { hefflSyncedAt: inquiry.hefflSyncedAt } : {}),
      ...(vehicle?.stockCode ? { stockCode: vehicle.stockCode } : {}),
      ...(vehicle?.titleEn ? { titleEn: vehicle.titleEn } : {}),
      ...(vehicle?.hefflContactId ? { vehicleHefflContactId: vehicle.hefflContactId } : {}),
      ...(vehicle?.hefflLeadId ? { vehicleHefflLeadId: vehicle.hefflLeadId } : {}),
    };
  },
});

export const findExistingHefflIds = internalQuery({
  args: {
    phone: v.string(),
    excludeInquiryId: v.id("inquiries"),
  },
  returns: v.union(hefflIdsValidator, v.null()),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("inquiries")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .take(25);
    for (const row of rows) {
      if (row._id === args.excludeInquiryId) {
        continue;
      }
      if (row.hefflContactId || row.hefflLeadId) {
        return {
          ...(row.hefflContactId ? { hefflContactId: row.hefflContactId } : {}),
          ...(row.hefflLeadId ? { hefflLeadId: row.hefflLeadId } : {}),
        };
      }
    }
    return null;
  },
});

export const markSynced = internalMutation({
  args: {
    inquiryId: v.id("inquiries"),
    hefflContactId: v.optional(v.string()),
    hefflLeadId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const inquiry = await ctx.db.get("inquiries", args.inquiryId);
    if (!inquiry) {
      return null;
    }
    await ctx.db.patch("inquiries", args.inquiryId, {
      hefflSyncedAt: Date.now(),
      ...(args.hefflContactId ? { hefflContactId: args.hefflContactId } : {}),
      ...(args.hefflLeadId ? { hefflLeadId: args.hefflLeadId } : {}),
    });
    if (inquiry.vehicleId && (args.hefflContactId || args.hefflLeadId)) {
      await ctx.db.patch("vehicles", inquiry.vehicleId, {
        ...(args.hefflContactId ? { hefflContactId: args.hefflContactId } : {}),
        ...(args.hefflLeadId ? { hefflLeadId: args.hefflLeadId } : {}),
      });
    }
    return null;
  },
});

/**
 * Copy-sync a lead/contact into Heffl. Dashboard remains the system of record
 * for car status — this action never writes vehicle status, and there is no
 * Heffl→site reverse sync in V2.
 *
 * HEFFL_ENABLED must be the string "true". Leave unset/off until the owner
 * signs off. HEFFL_API_KEY is server-side only.
 */
export const syncLead = internalAction({
  args: {
    inquiryId: v.id("inquiries"),
    attempt: v.optional(v.number()),
  },
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
      await ctx.scheduler.runAfter(0, internal.notifications.notifyHefflSyncFailed, {
        inquiryId: args.inquiryId,
        reason: "HEFFL_API_KEY is missing",
      });
      return { skipped: true, synced: false };
    }

    const attempt = args.attempt ?? 0;
    try {
      const inquiry = await ctx.runQuery(internal.integrations.heffl.getInquiry, {
        inquiryId: args.inquiryId,
      });
      if (!inquiry) {
        return { skipped: true, synced: false };
      }
      if (inquiry.hefflSyncedAt) {
        return { skipped: true, synced: false };
      }

      const localIds = await ctx.runQuery(internal.integrations.heffl.findExistingHefflIds, {
        phone: inquiry.phone,
        excludeInquiryId: args.inquiryId,
      });
      const reused = {
        hefflContactId:
          inquiry.hefflContactId ??
          inquiry.vehicleHefflContactId ??
          localIds?.hefflContactId,
        hefflLeadId:
          inquiry.hefflLeadId ?? inquiry.vehicleHefflLeadId ?? localIds?.hefflLeadId,
      };
      if (reused.hefflContactId || reused.hefflLeadId) {
        await ctx.runMutation(internal.integrations.heffl.markSynced, {
          inquiryId: args.inquiryId,
          ...(reused.hefflContactId ? { hefflContactId: reused.hefflContactId } : {}),
          ...(reused.hefflLeadId ? { hefflLeadId: reused.hefflLeadId } : {}),
        });
        return { skipped: false, synced: true };
      }

      const lookedUp = await lookupHefflIds(apiKey, inquiry.phone);
      if (lookedUp.hefflContactId || lookedUp.hefflLeadId) {
        await ctx.runMutation(internal.integrations.heffl.markSynced, {
          inquiryId: args.inquiryId,
          ...lookedUp,
        });
        return { skipped: false, synced: true };
      }

      const response = await fetch(`${HEFFL_V1}/leads`, {
        method: "POST",
        headers: hefflHeaders(apiKey),
        body: JSON.stringify({
          name: inquiry.name,
          mobile: toE164Oman(inquiry.phone),
          ...(inquiry.email ? { email: inquiry.email } : {}),
          title: inquiry.subject,
          cf_vehicle: inquiry.titleEn,
          cf_stock: inquiry.stockCode,
          cf_source: inquiry.source,
          cf_message: inquiry.message,
        }),
      });

      const payload = await readJson(response);
      if (!response.ok) {
        const detail = typeof payload === "string" ? payload : JSON.stringify(payload);
        throw new Error(`Heffl lead create failed (${response.status}): ${detail}`);
      }

      const hefflLeadId = readId(payload);
      await ctx.runMutation(internal.integrations.heffl.markSynced, {
        inquiryId: args.inquiryId,
        ...(hefflLeadId ? { hefflLeadId } : {}),
      });
      return { skipped: false, synced: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Heffl sync failed";
      console.error("Heffl lead sync failed", reason);
      if (attempt + 1 < MAX_ATTEMPTS) {
        const delay = attempt === 0 ? 60_000 : 5 * 60_000;
        await ctx.scheduler.runAfter(delay, internal.integrations.heffl.syncLead, {
          inquiryId: args.inquiryId,
          attempt: attempt + 1,
        });
        return { skipped: false, synced: false };
      }
      await ctx.scheduler.runAfter(0, internal.notifications.notifyHefflSyncFailed, {
        inquiryId: args.inquiryId,
        reason,
      });
      return { skipped: false, synced: false };
    }
  },
});
