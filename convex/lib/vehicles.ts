import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { deleteVehicleRelatedRows, latestInspection, logAudit, logVehicleStatusChange, requireStatusReason } from "./audit";
import { depositOmrForPrice, isBookableStatus } from "./bookings";
import { canPublish, isPublicHidden, publicFloorStatus } from "./publish";
import { buildSearchText, slugify } from "./identifiers";
import { resolveArabicDescription, resolveArabicTitle } from "./vehicleCopy";
import {
  mapLegacyVehicleStatus,
  requiresStatusReason,
  type VehicleStatus,
} from "./vehicleStatus";

export type VehicleWrite = {
  stockCode?: string;
  vin?: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  priceOmr: number;
  mileageKm: number;
  fuel: Doc<"vehicles">["fuel"];
  transmission: Doc<"vehicles">["transmission"];
  drivetrain: Doc<"vehicles">["drivetrain"];
  spec: Doc<"vehicles">["spec"];
  condition: Doc<"vehicles">["condition"];
  bodyType: Doc<"vehicles">["bodyType"];
  exteriorColor: string;
  interiorColor: string;
  engine?: string;
  features: string[];
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  ownership: Doc<"vehicles">["ownership"];
  featured?: boolean;
  ownerName?: string;
  ownerPhone?: string;
  ownerNotes?: string;
  staffNotes?: string;
  publicHidden?: boolean;
  onSiteConfirmed?: boolean;
  contractStatus?: Doc<"vehicles">["contractStatus"];
  contractStartsAt?: number;
  contractEndsAt?: number;
};

export function buildVehicleSlug(input: {
  year: number;
  make: string;
  model: string;
  stockCode: string;
}): string {
  const base = slugify(`${input.year}-${input.make}-${input.model}-${input.stockCode}`);
  return base.length > 0 ? base : slugify(input.stockCode);
}

export function buildVehicleSearchText(input: {
  stockCode: string;
  vin?: string;
  make: string;
  model: string;
  trim?: string;
  titleAr: string;
  titleEn: string;
  year: number;
}): string {
  return buildSearchText([
    input.stockCode,
    input.vin,
    input.make,
    input.model,
    input.trim,
    input.titleAr,
    input.titleEn,
    String(input.year),
  ]);
}

export async function nextStockCode(ctx: MutationCtx): Promise<string> {
  const counter = await ctx.db
    .query("counters")
    .withIndex("by_key", (q) => q.eq("key", "stock"))
    .unique();

  const next = (counter?.value ?? 1000) + 1;
  if (counter) {
    await ctx.db.patch("counters", counter._id, { value: next });
  } else {
    await ctx.db.insert("counters", { key: "stock", value: next });
  }
  return `AR-${next}`;
}

export async function assertUniqueStockAndVin(
  ctx: MutationCtx,
  args: { stockCode: string; vin?: string; excludeId?: Id<"vehicles"> },
): Promise<void> {
  const byCode = await ctx.db
    .query("vehicles")
    .withIndex("by_stock_code", (q) => q.eq("stockCode", args.stockCode))
    .unique();
  if (byCode && byCode._id !== args.excludeId) {
    throw new ConvexError("Stock code already exists");
  }

  if (args.vin) {
    const byVin = await ctx.db
      .query("vehicles")
      .withIndex("by_vin", (q) => q.eq("vin", args.vin))
      .unique();
    if (byVin && byVin._id !== args.excludeId) {
      throw new ConvexError("VIN already exists");
    }
  }
}

export type PublicVehiclePhoto = {
  url: string;
  altAr: string;
  altEn: string;
};

export type StaffVehiclePhoto = {
  _id: Id<"vehiclePhotos">;
  url: string | null;
  sortOrder: number;
  altAr: string;
  altEn: string;
  angle?: Doc<"vehiclePhotos">["angle"];
};

export type StaffVehicleContract = {
  contractFileName?: string;
  contractUrl: string | null;
};

export async function photosForVehicle(
  ctx: QueryCtx,
  vehicleId: Id<"vehicles">,
): Promise<PublicVehiclePhoto[]> {
  const photos = await ctx.db
    .query("vehiclePhotos")
    .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicleId))
    .collect();

  const sorted = photos.sort((a, b) => a.sortOrder - b.sortOrder);
  const withUrls: PublicVehiclePhoto[] = [];

  for (const photo of sorted) {
    const url = await ctx.storage.getUrl(photo.storageId);
    if (url) {
      withUrls.push({
        url,
        altAr: photo.altAr,
        altEn: photo.altEn,
      });
    }
  }

  return withUrls;
}

export async function staffPhotosForVehicle(
  ctx: QueryCtx,
  vehicleId: Id<"vehicles">,
): Promise<StaffVehiclePhoto[]> {
  const photos = await ctx.db
    .query("vehiclePhotos")
    .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicleId))
    .collect();

  const photoRows: StaffVehiclePhoto[] = [];
  for (const photo of photos.sort((a, b) => a.sortOrder - b.sortOrder)) {
    photoRows.push({
      _id: photo._id,
      url: await ctx.storage.getUrl(photo.storageId),
      sortOrder: photo.sortOrder,
      altAr: photo.altAr,
      altEn: photo.altEn,
      ...(photo.angle ? { angle: photo.angle } : {}),
    });
  }
  return photoRows;
}

export async function staffContractForVehicle(
  ctx: QueryCtx,
  vehicle: Doc<"vehicles">,
): Promise<StaffVehicleContract> {
  if (!vehicle.contractStorageId) {
    return { contractUrl: null };
  }
  return {
    contractFileName: vehicle.contractFileName,
    contractUrl: await ctx.storage.getUrl(vehicle.contractStorageId),
  };
}

export async function toStaffVehicleRecord(ctx: QueryCtx, vehicle: Doc<"vehicles">) {
  const photos = await staffPhotosForVehicle(ctx, vehicle._id);
  const contract = await staffContractForVehicle(ctx, vehicle);
  const inspection = await latestInspection(ctx, vehicle._id);
  return toStaffVehicle(vehicle, photos, contract, inspection);
}

export function toPublicVehicle(
  vehicle: Doc<"vehicles">,
  photos: PublicVehiclePhoto[],
  extras?: { inspectedAt?: number },
) {
  const titleAr = resolveArabicTitle(vehicle);
  const descriptionAr = resolveArabicDescription(vehicle);
  return {
    _id: vehicle._id,
    _creationTime: vehicle._creationTime,
    stockCode: vehicle.stockCode,
    slug: vehicle.slug,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    trim: vehicle.trim,
    priceOmr: vehicle.priceOmr,
    mileageKm: vehicle.mileageKm,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    drivetrain: vehicle.drivetrain,
    spec: vehicle.spec,
    condition: vehicle.condition,
    bodyType: vehicle.bodyType,
    exteriorColor: vehicle.exteriorColor,
    interiorColor: vehicle.interiorColor,
    engine: vehicle.engine,
    features: vehicle.features,
    titleAr,
    titleEn: vehicle.titleEn,
    descriptionAr,
    descriptionEn: vehicle.descriptionEn,
    ownership: vehicle.ownership,
    featured: vehicle.featured,
    status: publicFloorStatus(vehicle) ?? "published",
    updatedAt: vehicle.updatedAt,
    depositOmr: depositOmrForPrice(vehicle.priceOmr),
    canBook: isBookableStatus(vehicle.status),
    ...(extras?.inspectedAt !== undefined ? { inspectedAt: extras.inspectedAt } : {}),
    photos: photos.map((photo) => ({
      ...photo,
      altAr: resolveArabicTitle({
        titleAr: photo.altAr,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
      }),
    })),
  };
}

export function toStaffVehicle(
  vehicle: Doc<"vehicles">,
  photos: StaffVehiclePhoto[],
  contract: StaffVehicleContract,
  inspection: Doc<"inspections"> | null,
) {
  const publish = canPublish(vehicle, inspection);
  return {
    _id: vehicle._id,
    _creationTime: vehicle._creationTime,
    stockCode: vehicle.stockCode,
    slug: vehicle.slug,
    vin: vehicle.vin,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    trim: vehicle.trim,
    priceOmr: vehicle.priceOmr,
    mileageKm: vehicle.mileageKm,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    drivetrain: vehicle.drivetrain,
    spec: vehicle.spec,
    condition: vehicle.condition,
    bodyType: vehicle.bodyType,
    exteriorColor: vehicle.exteriorColor,
    interiorColor: vehicle.interiorColor,
    engine: vehicle.engine,
    features: vehicle.features,
    titleAr: vehicle.titleAr,
    titleEn: vehicle.titleEn,
    descriptionAr: vehicle.descriptionAr,
    descriptionEn: vehicle.descriptionEn,
    ownership: vehicle.ownership,
    status: mapLegacyVehicleStatus(vehicle.status),
    featured: vehicle.featured,
    publicHidden: isPublicHidden(vehicle),
    onSiteConfirmed: vehicle.onSiteConfirmed === true,
    onSiteConfirmedAt: vehicle.onSiteConfirmedAt,
    contractStatus: vehicle.contractStatus,
    contractStartsAt: vehicle.contractStartsAt,
    contractEndsAt: vehicle.contractEndsAt,
    hasContractFile: vehicle.contractStorageId !== undefined,
    publishGrandfathered: vehicle.publishGrandfathered === true,
    publishReady: publish.ok,
    publishBlockers: publish.reasons,
    ownerName: vehicle.ownerName,
    ownerPhone: vehicle.ownerPhone,
    ownerNotes: vehicle.ownerNotes,
    staffNotes: vehicle.staffNotes,
    contractFileName: contract.contractFileName,
    contractUrl: contract.contractUrl,
    publishedAt: vehicle.publishedAt,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
    photos,
  };
}

export function matchesPublicFilters(
  vehicle: Doc<"vehicles">,
  filters: {
    keyword?: string;
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    maxMileage?: number;
    color?: string;
    status?: "published" | "reserved" | "booked";
    fuel?: Doc<"vehicles">["fuel"];
    transmission?: Doc<"vehicles">["transmission"];
    spec?: Doc<"vehicles">["spec"];
    bodyType?: Doc<"vehicles">["bodyType"];
    condition?: Doc<"vehicles">["condition"];
    feature?: string;
    ownership?: Doc<"vehicles">["ownership"];
  },
): boolean {
  const keyword = filters.keyword?.trim().toLowerCase();
  if (keyword) {
    const haystack = [
      vehicle.searchText,
      vehicle.stockCode,
      vehicle.make,
      vehicle.model,
      vehicle.titleEn,
      vehicle.titleAr,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(keyword)) {
      return false;
    }
  }
  if (filters.make && vehicle.make.toLowerCase() !== filters.make.toLowerCase()) {
    return false;
  }
  if (filters.model && vehicle.model.toLowerCase() !== filters.model.toLowerCase()) {
    return false;
  }
  if (
    filters.color &&
    vehicle.exteriorColor.toLowerCase() !== filters.color.toLowerCase()
  ) {
    return false;
  }
  if (filters.status && publicFloorStatus(vehicle) !== filters.status) {
    return false;
  }
  if (filters.minPrice !== undefined && vehicle.priceOmr < filters.minPrice) {
    return false;
  }
  if (filters.maxPrice !== undefined && vehicle.priceOmr > filters.maxPrice) {
    return false;
  }
  if (filters.minYear !== undefined && vehicle.year < filters.minYear) {
    return false;
  }
  if (filters.maxYear !== undefined && vehicle.year > filters.maxYear) {
    return false;
  }
  if (filters.maxMileage !== undefined && vehicle.mileageKm > filters.maxMileage) {
    return false;
  }
  if (filters.fuel && vehicle.fuel !== filters.fuel) {
    return false;
  }
  if (filters.transmission && vehicle.transmission !== filters.transmission) {
    return false;
  }
  if (filters.spec && vehicle.spec !== filters.spec) {
    return false;
  }
  if (filters.bodyType && vehicle.bodyType !== filters.bodyType) {
    return false;
  }
  if (filters.condition && vehicle.condition !== filters.condition) {
    return false;
  }
  if (filters.ownership && vehicle.ownership !== filters.ownership) {
    return false;
  }
  if (
    filters.feature &&
    !vehicle.features.some((feature) =>
      feature.toLowerCase().includes(filters.feature!.toLowerCase()),
    )
  ) {
    return false;
  }
  return true;
}

export async function applyVehicleStatus(
  ctx: MutationCtx,
  args: {
    vehicleId: Id<"vehicles">;
    status: VehicleStatus;
    staffNotes?: string;
    reason?: string;
    notes?: string;
    actorUserId?: Id<"users">;
  },
): Promise<boolean> {
  const vehicle = await ctx.db.get("vehicles", args.vehicleId);
  if (!vehicle) {
    return false;
  }

  const fromStatus = mapLegacyVehicleStatus(vehicle.status);
  if (requiresStatusReason(args.status)) {
    requireStatusReason(args.status, args.reason);
  }

  const releasingHold =
    args.status === "published" &&
    (fromStatus === "reserved" || fromStatus === "booked");

  if (
    (args.status === "published" || args.status === "approved_for_publishing") &&
    !releasingHold
  ) {
    const inspection = await latestInspection(ctx, vehicle._id);
    const gate = canPublish(vehicle, inspection, Date.now());
    const alreadyPublished = fromStatus === "published" && args.status === "published";
    if (!gate.ok && !alreadyPublished) {
      await logAudit(ctx, {
        actorUserId: args.actorUserId,
        vehicleId: vehicle._id,
        editType: "publish_blocked",
        fromValue: fromStatus,
        toValue: args.status,
        notes: gate.reasons.join(","),
      });
      throw new ConvexError(`Cannot publish: ${gate.reasons.join(", ")}`);
    }
    if (
      args.status === "published" &&
      vehicle.onSiteConfirmed !== true &&
      !gate.grandfathered
    ) {
      throw new ConvexError("Cannot publish: not_on_site");
    }
  }

  const now = Date.now();
  await ctx.db.patch("vehicles", args.vehicleId, {
    status: args.status,
    staffNotes: args.staffNotes ?? vehicle.staffNotes,
    publicHidden:
      args.status === "published" || args.status === "reserved" || args.status === "booked"
        ? false
        : vehicle.publicHidden,
    publishedAt:
      args.status === "published" ? (vehicle.publishedAt ?? now) : vehicle.publishedAt,
    updatedAt: now,
  });

  if (fromStatus !== args.status) {
    await logVehicleStatusChange(ctx, {
      vehicleId: args.vehicleId,
      actorUserId: args.actorUserId,
      fromStatus,
      toStatus: args.status,
      reason: args.reason,
      notes: args.notes ?? args.staffNotes,
    });
  }
  return true;
}

export async function applyPublicHidden(
  ctx: MutationCtx,
  args: {
    vehicleId: Id<"vehicles">;
    publicHidden: boolean;
    actorUserId?: Id<"users">;
  },
): Promise<boolean> {
  const vehicle = await ctx.db.get("vehicles", args.vehicleId);
  if (!vehicle) {
    return false;
  }
  const wasHidden = isPublicHidden(vehicle);
  if (wasHidden === args.publicHidden) {
    return true;
  }
  await ctx.db.patch("vehicles", args.vehicleId, {
    publicHidden: args.publicHidden,
    updatedAt: Date.now(),
  });
  await logAudit(ctx, {
    actorUserId: args.actorUserId,
    vehicleId: args.vehicleId,
    editType: "public_hidden",
    fromValue: wasHidden ? "true" : "false",
    toValue: args.publicHidden ? "true" : "false",
  });
  return true;
}

export async function deleteVehicleWithAssets(
  ctx: MutationCtx,
  vehicleId: Id<"vehicles">,
): Promise<boolean> {
  const vehicle = await ctx.db.get("vehicles", vehicleId);
  if (!vehicle) {
    return false;
  }

  const photos = await ctx.db
    .query("vehiclePhotos")
    .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicleId))
    .collect();
  for (const photo of photos) {
    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete("vehiclePhotos", photo._id);
  }
  if (vehicle.contractStorageId) {
    await ctx.storage.delete(vehicle.contractStorageId);
  }
  await deleteVehicleRelatedRows(ctx, vehicleId);
  await ctx.db.delete("vehicles", vehicleId);
  return true;
}
