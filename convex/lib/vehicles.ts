import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { buildSearchText, slugify } from "./identifiers";
import { resolveArabicDescription, resolveArabicTitle } from "./vehicleCopy";

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
    await ctx.db.patch(counter._id, { value: next });
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
  return toStaffVehicle(vehicle, photos, contract);
}

export function toPublicVehicle(
  vehicle: Doc<"vehicles">,
  photos: PublicVehiclePhoto[],
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
) {
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
    status: vehicle.status,
    featured: vehicle.featured,
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
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    maxMileage?: number;
    fuel?: Doc<"vehicles">["fuel"];
    transmission?: Doc<"vehicles">["transmission"];
    spec?: Doc<"vehicles">["spec"];
    bodyType?: Doc<"vehicles">["bodyType"];
    condition?: Doc<"vehicles">["condition"];
    feature?: string;
    ownership?: Doc<"vehicles">["ownership"];
  },
): boolean {
  if (filters.make && vehicle.make.toLowerCase() !== filters.make.toLowerCase()) {
    return false;
  }
  if (filters.model && !vehicle.model.toLowerCase().includes(filters.model.toLowerCase())) {
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
    status: Doc<"vehicles">["status"];
    staffNotes?: string;
  },
): Promise<boolean> {
  const vehicle = await ctx.db.get("vehicles", args.vehicleId);
  if (!vehicle) {
    return false;
  }

  const now = Date.now();
  await ctx.db.patch("vehicles", args.vehicleId, {
    status: args.status,
    staffNotes: args.staffNotes ?? vehicle.staffNotes,
    publishedAt:
      args.status === "published" ? (vehicle.publishedAt ?? now) : vehicle.publishedAt,
    updatedAt: now,
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
  await ctx.db.delete("vehicles", vehicleId);
  return true;
}
