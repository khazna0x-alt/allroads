import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { assertContractUpload, sanitizeContractFileName } from "./lib/contracts";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { normalizeOmaniPhone } from "./lib/identifiers";
import {
  inquirySourceValidator,
  inquiryStatusValidator,
  localeValidator,
  vehicleWriteValidator,
} from "./lib/validators";
import {
  assertUniqueStockAndVin,
  buildVehicleSearchText,
  buildVehicleSlug,
  nextStockCode,
} from "./lib/vehicles";
import {
  buildArabicDescription,
  buildArabicTitle,
  hasArabicScript,
  resolveArabicTitle,
} from "./lib/vehicleCopy";

const inquiryValidator = v.object({
  _id: v.id("inquiries"),
  name: v.string(),
  phone: v.string(),
  subject: v.string(),
  message: v.string(),
  vehicleId: v.optional(v.id("vehicles")),
  locale: localeValidator,
  source: inquirySourceValidator,
  status: inquiryStatusValidator,
  hefflSyncedAt: v.optional(v.number()),
  createdAt: v.number(),
  vehicleTitleEn: v.optional(v.string()),
  vehicleTitleAr: v.optional(v.string()),
  vehicleStockCode: v.optional(v.string()),
});

function isWebsiteInquiry(source: "web_form" | "consignment" | "waagents"): boolean {
  return source === "web_form" || source === "waagents";
}

export const createInquiry = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    subject: v.string(),
    message: v.string(),
    vehicleId: v.optional(v.id("vehicles")),
    locale: localeValidator,
    source: v.optional(inquirySourceValidator),
  },
  returns: v.id("inquiries"),
  handler: async (ctx, args) => {
    if (args.source === "consignment") {
      throw new ConvexError("Use the consignment form to list a car");
    }
    if (args.name.trim().length < 2) {
      throw new ConvexError("Name must be at least 2 characters");
    }
    if (args.message.trim().length < 4) {
      throw new ConvexError("Message is too short");
    }

    const phone = normalizeOmaniPhone(args.phone);
    const vehicleId = args.vehicleId;
    if (vehicleId) {
      const vehicle = await ctx.db.get("vehicles", vehicleId);
      if (!vehicle || vehicle.status !== "published") {
        throw new ConvexError("Vehicle is not available");
      }
    }

    const inquiryId = await ctx.db.insert("inquiries", {
      name: args.name.trim(),
      phone,
      subject: args.subject.trim(),
      message: args.message.trim(),
      vehicleId,
      locale: args.locale,
      source: args.source ?? "web_form",
      status: "new",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.integrations.heffl.syncLead, {
      inquiryId,
    });

    return inquiryId;
  },
});

export const submitConsignment = mutation({
  args: {
    ownerName: v.string(),
    ownerPhone: v.string(),
    message: v.string(),
    locale: localeValidator,
    make: v.string(),
    model: v.string(),
    year: v.number(),
    trim: v.optional(v.string()),
    priceOmr: v.optional(v.number()),
    mileageKm: v.optional(v.number()),
    fuel: v.optional(vehicleWriteValidator.fuel),
    transmission: v.optional(vehicleWriteValidator.transmission),
    spec: v.optional(vehicleWriteValidator.spec),
    bodyType: v.optional(vehicleWriteValidator.bodyType),
    exteriorColor: v.optional(v.string()),
    interiorColor: v.optional(v.string()),
    engine: v.optional(v.string()),
    contractStorageId: v.optional(v.id("_storage")),
    contractFileName: v.optional(v.string()),
  },
  returns: v.object({
    vehicleId: v.id("vehicles"),
  }),
  handler: async (ctx, args) => {
    if (args.ownerName.trim().length < 2) {
      throw new ConvexError("Name must be at least 2 characters");
    }

    const ownerPhone = normalizeOmaniPhone(args.ownerPhone);
    const now = Date.now();
    const stockCode = await nextStockCode(ctx);
    await assertUniqueStockAndVin(ctx, { stockCode });

    const contractStorageId = args.contractStorageId;
    let contractFileName: string | undefined;
    if (contractStorageId) {
      await assertContractUpload(ctx, contractStorageId);
      contractFileName = sanitizeContractFileName(args.contractFileName ?? "contract");
    }

    const titleEn = `${args.year} ${args.make} ${args.model}`.trim();
    const titleAr = buildArabicTitle({
      year: args.year,
      make: args.make,
      model: args.model,
      trim: args.trim,
    });
    const ownerMessage = args.message.trim();
    const descriptionAr = hasArabicScript(ownerMessage)
      ? ownerMessage
      : buildArabicDescription({
          year: args.year,
          make: args.make,
          model: args.model,
          mileageKm: args.mileageKm ?? 0,
          spec: args.spec ?? "gcc",
          condition: "used",
        });
    const vehicleId = await ctx.db.insert("vehicles", {
      stockCode,
      slug: buildVehicleSlug({
        year: args.year,
        make: args.make,
        model: args.model,
        stockCode,
      }),
      make: args.make.trim(),
      model: args.model.trim(),
      year: args.year,
      trim: args.trim,
      priceOmr: args.priceOmr ?? 0,
      mileageKm: args.mileageKm ?? 0,
      fuel: args.fuel ?? "petrol",
      transmission: args.transmission ?? "automatic",
      drivetrain: "awd",
      spec: args.spec ?? "gcc",
      condition: "used",
      bodyType: args.bodyType ?? "suv",
      exteriorColor: args.exteriorColor ?? "",
      interiorColor: args.interiorColor ?? "",
      engine: args.engine,
      features: [],
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn: ownerMessage,
      searchText: buildVehicleSearchText({
        stockCode,
        make: args.make,
        model: args.model,
        trim: args.trim,
        titleAr,
        titleEn,
        year: args.year,
      }),
      ownership: "consignment",
      status: "pending_review",
      featured: false,
      ownerName: args.ownerName.trim(),
      ownerPhone,
      ownerNotes: ownerMessage,
      contractStorageId,
      contractFileName,
      createdAt: now,
      updatedAt: now,
    });

    return { vehicleId };
  },
});

export const generateConsignmentUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

async function toStaffInquiry(ctx: QueryCtx, inquiry: Doc<"inquiries">) {
  const vehicle = inquiry.vehicleId ? await ctx.db.get("vehicles", inquiry.vehicleId) : null;
  return {
    _id: inquiry._id,
    name: inquiry.name,
    phone: inquiry.phone,
    subject: inquiry.subject,
    message: inquiry.message,
    vehicleId: inquiry.vehicleId,
    locale: inquiry.locale,
    source: inquiry.source,
    status: inquiry.status,
    hefflSyncedAt: inquiry.hefflSyncedAt,
    createdAt: inquiry.createdAt,
    vehicleTitleEn: vehicle?.titleEn,
    vehicleTitleAr: vehicle ? resolveArabicTitle(vehicle) : undefined,
    vehicleStockCode: vehicle?.stockCode,
  };
}

export const listStaff = authedQuery({
  args: {
    status: v.optional(inquiryStatusValidator),
  },
  returns: v.array(inquiryValidator),
  handler: async (ctx, args) => {
    const rows = args.status
      ? await ctx.db
          .query("inquiries")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .take(200)
      : (
          await Promise.all([
            ctx.db
              .query("inquiries")
              .withIndex("by_status", (q) => q.eq("status", "new"))
              .take(200),
            ctx.db
              .query("inquiries")
              .withIndex("by_status", (q) => q.eq("status", "in_progress"))
              .take(200),
          ])
        ).flat();

    const page = [];
    for (const inquiry of rows) {
      if (!isWebsiteInquiry(inquiry.source)) {
        continue;
      }
      page.push(await toStaffInquiry(ctx, inquiry));
    }

    page.sort((a, b) => b.createdAt - a.createdAt);
    return page;
  },
});

const recentInquiryValidator = v.object({
  _id: v.id("inquiries"),
  name: v.string(),
  subject: v.string(),
  status: inquiryStatusValidator,
  source: inquirySourceValidator,
  createdAt: v.number(),
  vehicleStockCode: v.optional(v.string()),
});

const deskStatsValidator = v.object({
  newCount: v.number(),
  inProgressCount: v.number(),
});

export const listRecent = authedQuery({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(recentInquiryValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 6, 1), 20);
    const rows = await ctx.db
      .query("inquiries")
      .withIndex("by_created")
      .order("desc")
      .take(80);

    const page = [];
    for (const inquiry of rows) {
      if (!isWebsiteInquiry(inquiry.source) || inquiry.status === "closed") {
        continue;
      }
      if (page.length >= limit) {
        break;
      }
      const vehicle = inquiry.vehicleId ? await ctx.db.get("vehicles", inquiry.vehicleId) : null;
      page.push({
        _id: inquiry._id,
        name: inquiry.name,
        subject: inquiry.subject,
        status: inquiry.status,
        source: inquiry.source,
        createdAt: inquiry.createdAt,
        vehicleStockCode: vehicle?.stockCode,
      });
    }
    return page;
  },
});

export const deskStats = authedQuery({
  args: {},
  returns: deskStatsValidator,
  handler: async (ctx) => {
    const [fresh, open] = await Promise.all([
      ctx.db
        .query("inquiries")
        .withIndex("by_status", (q) => q.eq("status", "new"))
        .take(200),
      ctx.db
        .query("inquiries")
        .withIndex("by_status", (q) => q.eq("status", "in_progress"))
        .take(200),
    ]);

    return {
      newCount: fresh.filter((row) => isWebsiteInquiry(row.source)).length,
      inProgressCount: open.filter((row) => isWebsiteInquiry(row.source)).length,
    };
  },
});

export const setStatus = authedMutation({
  args: {
    inquiryId: v.id("inquiries"),
    status: inquiryStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const inquiry = await ctx.db.get("inquiries", args.inquiryId);
    if (!inquiry || !isWebsiteInquiry(inquiry.source)) {
      throw new ConvexError("Inquiry not found");
    }
    await ctx.db.patch("inquiries", args.inquiryId, { status: args.status });
    return null;
  },
});

export const remove = authedMutation({
  args: {
    inquiryId: v.id("inquiries"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const inquiry = await ctx.db.get("inquiries", args.inquiryId);
    if (!inquiry || !isWebsiteInquiry(inquiry.source)) {
      throw new ConvexError("Inquiry not found");
    }
    await ctx.db.delete("inquiries", args.inquiryId);
    return null;
  },
});
