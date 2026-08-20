import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { logAudit } from "./lib/audit";
import { assertContractUpload, sanitizeContractFileName } from "./lib/contracts";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { normalizeOmaniPhone } from "./lib/identifiers";
import { normalizeOptionalEmail } from "./lib/bookings";
import { isOnPublicFloor } from "./lib/publish";
import {
  MAX_CONSIGNMENT_PHOTOS,
  MAX_OWNERSHIP_DOCS,
  assertImageUpload,
} from "./lib/uploads";
import {
  bodyTypeValidator,
  inquirySourceValidator,
  inquiryStatusValidator,
  localeValidator,
  preferredContactValidator,
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

function publicListingUrl(locale: "ar" | "en", slug: string): string {
  const origin = "https://allroads.om";
  const prefix = locale === "en" ? "/en" : "";
  return `${origin}${prefix}/inventory/${slug}`;
}

const inquiryValidator = v.object({
  _id: v.id("inquiries"),
  name: v.string(),
  phone: v.string(),
  email: v.optional(v.string()),
  subject: v.string(),
  message: v.string(),
  vehicleId: v.optional(v.id("vehicles")),
  locale: localeValidator,
  source: inquirySourceValidator,
  status: inquiryStatusValidator,
  preferredContact: v.optional(preferredContactValidator),
  viewingRequested: v.boolean(),
  handoffReason: v.optional(v.string()),
  hefflContactId: v.optional(v.string()),
  hefflLeadId: v.optional(v.string()),
  hefflSyncedAt: v.optional(v.number()),
  createdAt: v.number(),
  vehicleTitleEn: v.optional(v.string()),
  vehicleTitleAr: v.optional(v.string()),
  vehicleStockCode: v.optional(v.string()),
});

const OPEN_INQUIRY_STATUSES = [
  "new",
  "contacted",
  "viewing_scheduled",
  "negotiating",
  "booked",
  "in_progress",
] as const;

const ARCHIVE_INQUIRY_STATUSES = ["closed", "sold"] as const;

function isWebsiteInquiry(
  source: "web_form" | "consignment" | "waagents" | "whatsapp",
): boolean {
  return source === "web_form" || source === "waagents" || source === "whatsapp";
}

async function scheduleInquiryFollowUp(
  ctx: MutationCtx,
  args: {
    inquiryId: Doc<"inquiries">["_id"];
    vehicleId?: Doc<"vehicles">["_id"];
    stockCode?: string;
    name: string;
    phone: string;
    email?: string;
    subject: string;
    viewingRequested: boolean;
    source: "web_form" | "consignment" | "waagents" | "whatsapp";
    handoffReason?: string;
    notify?: boolean;
  },
) {
  if (args.notify !== false) {
    await ctx.scheduler.runAfter(0, internal.notifications.notifyInquiry, {
      inquiryId: args.inquiryId,
      ...(args.vehicleId ? { vehicleId: args.vehicleId } : {}),
      ...(args.stockCode ? { stockCode: args.stockCode } : {}),
      name: args.name,
      phone: args.phone,
      ...(args.email ? { email: args.email } : {}),
      subject: args.subject,
      viewingRequested: args.viewingRequested,
      source: args.source,
      ...(args.handoffReason ? { handoffReason: args.handoffReason } : {}),
    });
  }
  await ctx.scheduler.runAfter(0, internal.integrations.heffl.syncLead, {
    inquiryId: args.inquiryId,
    attempt: 0,
  });
}

export const createInquiry = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
    vehicleId: v.optional(v.id("vehicles")),
    locale: localeValidator,
    source: v.optional(inquirySourceValidator),
    preferredContact: v.optional(preferredContactValidator),
    viewingRequested: v.optional(v.boolean()),
  },
  returns: v.object({
    inquiryId: v.id("inquiries"),
  }),
  handler: async (ctx, args) => {
    if (args.source === "consignment") {
      throw new ConvexError("Use the consignment form to list a car");
    }
    if (args.source === "waagents") {
      throw new ConvexError("Wa-Agents inquiries must use the signed webhook");
    }
    if (args.name.trim().length < 2) {
      throw new ConvexError("Name must be at least 2 characters");
    }
    if (args.message.trim().length < 4) {
      throw new ConvexError("Message is too short");
    }

    const phone = normalizeOmaniPhone(args.phone);
    const email = normalizeOptionalEmail(args.email);
    const preferredContact = args.preferredContact ?? "phone";
    if (preferredContact === "email" && !email) {
      throw new ConvexError("Email is required when email is the preferred contact");
    }

    let stockCode: string | undefined;
    let subject = args.subject.trim();
    let message = args.message.trim();
    const vehicleId = args.vehicleId;
    if (vehicleId) {
      const vehicle = await ctx.db.get("vehicles", vehicleId);
      if (!vehicle || !isOnPublicFloor(vehicle)) {
        throw new ConvexError("Vehicle is not available");
      }
      stockCode = vehicle.stockCode;
      const title = args.locale === "ar" ? vehicle.titleAr : vehicle.titleEn;
      if (!subject) {
        subject = `${title} · ${vehicle.stockCode}`;
      } else if (!subject.includes(vehicle.stockCode)) {
        subject = `${subject} · ${title} · ${vehicle.stockCode}`;
      }
      const listingUrl = publicListingUrl(args.locale, vehicle.slug);
      message = `${message}\n\n${title}\n${vehicle.stockCode}\n${listingUrl}`;
    }

    const viewingRequested = args.viewingRequested === true;
    const inquiryId = await ctx.db.insert("inquiries", {
      name: args.name.trim(),
      phone,
      ...(email ? { email } : {}),
      subject,
      message,
      ...(vehicleId ? { vehicleId } : {}),
      locale: args.locale,
      source: args.source ?? "web_form",
      status: "new",
      preferredContact,
      viewingRequested,
      createdAt: Date.now(),
    });

    await scheduleInquiryFollowUp(ctx, {
      inquiryId,
      vehicleId,
      stockCode,
      name: args.name.trim(),
      phone,
      email,
      subject,
      viewingRequested,
      source: args.source ?? "web_form",
    });

    return { inquiryId };
  },
});

export const logWhatsAppIntent = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    locale: localeValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle || !isOnPublicFloor(vehicle)) {
      throw new ConvexError("Vehicle is not available");
    }
    await logAudit(ctx, {
      vehicleId: args.vehicleId,
      editType: "whatsapp_intent",
      notes: `${vehicle.stockCode} · ${args.locale}`,
    });
    return null;
  },
});

export const createFromWaAgents = internalMutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
    stockCode: v.optional(v.string()),
    vehicleId: v.optional(v.string()),
    locale: localeValidator,
    preferredContact: v.optional(preferredContactValidator),
    viewingRequested: v.boolean(),
    handoffReason: v.optional(v.string()),
  },
  returns: v.object({
    inquiryId: v.id("inquiries"),
  }),
  handler: async (ctx, args) => {
    if (args.name.trim().length < 2) {
      throw new ConvexError("Name must be at least 2 characters");
    }

    const phone = normalizeOmaniPhone(args.phone);
    const email = normalizeOptionalEmail(args.email);
    const preferredContact = args.preferredContact ?? "whatsapp";

    let vehicleId: Doc<"vehicles">["_id"] | undefined;
    let stockCode = args.stockCode?.trim().toUpperCase();
    if (args.vehicleId) {
      const normalized = ctx.db.normalizeId("vehicles", args.vehicleId);
      if (normalized) {
        const vehicle = await ctx.db.get("vehicles", normalized);
        if (vehicle && isOnPublicFloor(vehicle)) {
          vehicleId = vehicle._id;
          stockCode = vehicle.stockCode;
        }
      }
    }
    if (!vehicleId && stockCode) {
      const stock = stockCode;
      const vehicle = await ctx.db
        .query("vehicles")
        .withIndex("by_stock_code", (q) => q.eq("stockCode", stock))
        .first();
      if (vehicle && isOnPublicFloor(vehicle)) {
        vehicleId = vehicle._id;
        stockCode = vehicle.stockCode;
      }
    }

    let subject = args.subject.trim();
    if (vehicleId) {
      const vehicle = await ctx.db.get("vehicles", vehicleId);
      if (vehicle && !subject.includes(vehicle.stockCode)) {
        subject = `${subject} · ${vehicle.stockCode}`;
      }
    }

    const inquiryId = await ctx.db.insert("inquiries", {
      name: args.name.trim(),
      phone,
      ...(email ? { email } : {}),
      subject,
      message: args.message.trim(),
      ...(vehicleId ? { vehicleId } : {}),
      locale: args.locale,
      source: "waagents",
      status: "new",
      preferredContact,
      viewingRequested: args.viewingRequested,
      ...(args.handoffReason ? { handoffReason: args.handoffReason } : {}),
      createdAt: Date.now(),
    });

    await scheduleInquiryFollowUp(ctx, {
      inquiryId,
      vehicleId,
      stockCode,
      name: args.name.trim(),
      phone,
      email,
      subject,
      viewingRequested: args.viewingRequested,
      source: "waagents",
      handoffReason: args.handoffReason,
    });

    return { inquiryId };
  },
});

export const generateConsignmentUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
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
    priceOmr: v.number(),
    mileageKm: v.number(),
    bodyType: bodyTypeValidator,
    exteriorColor: v.string(),
    interiorColor: v.string(),
    vin: v.optional(v.string()),
    fuel: v.optional(vehicleWriteValidator.fuel),
    transmission: v.optional(vehicleWriteValidator.transmission),
    spec: v.optional(vehicleWriteValidator.spec),
    acceptedTerms: v.boolean(),
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
    ownershipDocs: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          fileName: v.string(),
        }),
      ),
    ),
  },
  returns: v.object({
    vehicleId: v.id("vehicles"),
    stockCode: v.string(),
    createdAt: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!args.acceptedTerms) {
      throw new ConvexError("Terms must be accepted");
    }
    if (args.ownerName.trim().length < 2) {
      throw new ConvexError("Name must be at least 2 characters");
    }
    if (args.make.trim().length < 2 || args.model.trim().length < 1) {
      throw new ConvexError("Make and model are required");
    }
    if (args.year < 1980 || args.year > 2100) {
      throw new ConvexError("Enter a valid year");
    }
    if (!(args.priceOmr > 0)) {
      throw new ConvexError("Asking price is required");
    }
    if (args.mileageKm < 0) {
      throw new ConvexError("Mileage cannot be negative");
    }
    if (args.exteriorColor.trim().length < 1 || args.interiorColor.trim().length < 1) {
      throw new ConvexError("Exterior and interior colors are required");
    }

    const photoStorageIds = args.photoStorageIds ?? [];
    const ownershipDocs = args.ownershipDocs ?? [];
    if (photoStorageIds.length > MAX_CONSIGNMENT_PHOTOS) {
      throw new ConvexError("Too many photos");
    }
    if (ownershipDocs.length > MAX_OWNERSHIP_DOCS) {
      throw new ConvexError("Too many ownership documents");
    }

    const ownerPhone = normalizeOmaniPhone(args.ownerPhone);
    const vin = args.vin?.trim() || undefined;
    const now = Date.now();
    const stockCode = await nextStockCode(ctx);
    await assertUniqueStockAndVin(ctx, { stockCode, vin });

    for (const storageId of photoStorageIds) {
      await assertImageUpload(ctx, storageId);
    }
    for (const doc of ownershipDocs) {
      await assertContractUpload(ctx, doc.storageId);
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
          mileageKm: args.mileageKm,
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
      vin,
      make: args.make.trim(),
      model: args.model.trim(),
      year: args.year,
      trim: args.trim,
      priceOmr: args.priceOmr,
      mileageKm: args.mileageKm,
      fuel: args.fuel ?? "petrol",
      transmission: args.transmission ?? "automatic",
      drivetrain: "awd",
      spec: args.spec ?? "gcc",
      condition: "used",
      bodyType: args.bodyType,
      exteriorColor: args.exteriorColor.trim(),
      interiorColor: args.interiorColor.trim(),
      features: [],
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn: ownerMessage,
      searchText: buildVehicleSearchText({
        stockCode,
        vin,
        make: args.make,
        model: args.model,
        trim: args.trim,
        titleAr,
        titleEn,
        year: args.year,
      }),
      ownership: "consignment",
      status: "new",
      featured: false,
      publicHidden: false,
      onSiteConfirmed: false,
      contractStatus: "unsigned",
      ownerName: args.ownerName.trim(),
      ownerPhone,
      ownerNotes: ownerMessage,
      createdAt: now,
      updatedAt: now,
    });

    for (const [index, storageId] of photoStorageIds.entries()) {
      await ctx.db.insert("vehiclePhotos", {
        vehicleId,
        storageId,
        sortOrder: index,
        altAr: titleAr,
        altEn: titleEn,
      });
    }
    for (const doc of ownershipDocs) {
      await ctx.db.insert("vehicleDocuments", {
        vehicleId,
        storageId: doc.storageId,
        fileName: sanitizeContractFileName(doc.fileName),
        kind: "ownership",
        createdAt: now,
      });
    }

    await logAudit(ctx, {
      vehicleId,
      editType: "consignment_submit",
      toValue: "new",
      notes: stockCode,
    });
    await logAudit(ctx, {
      vehicleId,
      editType: "status_change",
      toValue: "new",
    });
    await ctx.db.insert("vehicleStatusLogs", {
      vehicleId,
      toStatus: "new",
      notes: "Public consignment submitted",
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.notifyConsignment, {
      vehicleId,
      stockCode,
      ownerName: args.ownerName.trim(),
      ownerPhone,
      year: args.year,
      make: args.make.trim(),
      model: args.model.trim(),
    });

    const listingInquiryId = await ctx.db.insert("inquiries", {
      name: args.ownerName.trim(),
      phone: ownerPhone,
      subject: `List your car · ${stockCode}`,
      message: ownerMessage || `${args.year} ${args.make.trim()} ${args.model.trim()}`,
      vehicleId,
      locale: args.locale,
      source: "consignment",
      status: "new",
      preferredContact: "phone",
      viewingRequested: false,
      createdAt: now,
    });
    await scheduleInquiryFollowUp(ctx, {
      inquiryId: listingInquiryId,
      vehicleId,
      stockCode,
      name: args.ownerName.trim(),
      phone: ownerPhone,
      subject: `List your car · ${stockCode}`,
      viewingRequested: false,
      source: "consignment",
      notify: false,
    });

    return { vehicleId, stockCode, createdAt: now };
  },
});

async function toStaffInquiry(ctx: QueryCtx, inquiry: Doc<"inquiries">) {
  const vehicle = inquiry.vehicleId ? await ctx.db.get("vehicles", inquiry.vehicleId) : null;
  return {
    _id: inquiry._id,
    name: inquiry.name,
    phone: inquiry.phone,
    ...(inquiry.email ? { email: inquiry.email } : {}),
    subject: inquiry.subject,
    message: inquiry.message,
    ...(inquiry.vehicleId ? { vehicleId: inquiry.vehicleId } : {}),
    locale: inquiry.locale,
    source: inquiry.source,
    status: inquiry.status,
    ...(inquiry.preferredContact ? { preferredContact: inquiry.preferredContact } : {}),
    viewingRequested: inquiry.viewingRequested === true,
    ...(inquiry.handoffReason ? { handoffReason: inquiry.handoffReason } : {}),
    ...(inquiry.hefflContactId ? { hefflContactId: inquiry.hefflContactId } : {}),
    ...(inquiry.hefflLeadId ? { hefflLeadId: inquiry.hefflLeadId } : {}),
    ...(inquiry.hefflSyncedAt !== undefined ? { hefflSyncedAt: inquiry.hefflSyncedAt } : {}),
    createdAt: inquiry.createdAt,
    ...(vehicle?.titleEn ? { vehicleTitleEn: vehicle.titleEn } : {}),
    ...(vehicle ? { vehicleTitleAr: resolveArabicTitle(vehicle) } : {}),
    ...(vehicle?.stockCode ? { vehicleStockCode: vehicle.stockCode } : {}),
  };
}

export const listStaff = authedQuery({
  args: {
    status: v.optional(inquiryStatusValidator),
  },
  returns: v.array(inquiryValidator),
  handler: async (ctx, args) => {
    const statuses: Array<(typeof OPEN_INQUIRY_STATUSES)[number] | (typeof ARCHIVE_INQUIRY_STATUSES)[number]> =
      args.status === "closed"
        ? [...ARCHIVE_INQUIRY_STATUSES]
        : args.status
          ? [args.status]
          : [...OPEN_INQUIRY_STATUSES];

    const pages = await Promise.all(
      statuses.map((status) =>
        ctx.db
          .query("inquiries")
          .withIndex("by_status", (q) => q.eq("status", status))
          .take(200),
      ),
    );

    const page = [];
    for (const inquiry of pages.flat()) {
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
      if (!isWebsiteInquiry(inquiry.source)) {
        continue;
      }
      if (inquiry.status === "closed" || inquiry.status === "sold") {
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
        ...(vehicle?.stockCode ? { vehicleStockCode: vehicle.stockCode } : {}),
      });
    }
    return page;
  },
});

export const deskStats = authedQuery({
  args: {},
  returns: deskStatsValidator,
  handler: async (ctx) => {
    const pages = await Promise.all(
      OPEN_INQUIRY_STATUSES.map((status) =>
        ctx.db
          .query("inquiries")
          .withIndex("by_status", (q) => q.eq("status", status))
          .take(200),
      ),
    );

    let newCount = 0;
    let inProgressCount = 0;
    for (const row of pages.flat()) {
      if (!isWebsiteInquiry(row.source)) {
        continue;
      }
      if (row.status === "new") {
        newCount += 1;
      } else {
        inProgressCount += 1;
      }
    }

    return { newCount, inProgressCount };
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
