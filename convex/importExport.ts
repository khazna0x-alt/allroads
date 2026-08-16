import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import {
  bodyTypeValidator,
  conditionValidator,
  drivetrainValidator,
  fuelValidator,
  missingImportStrategyValidator,
  ownershipValidator,
  specValidator,
  transmissionValidator,
  vehicleStatusValidator,
} from "./lib/validators";
import {
  assertUniqueStockAndVin,
  buildVehicleSearchText,
  buildVehicleSlug,
  nextStockCode,
} from "./lib/vehicles";
import { buildArabicDescription, buildArabicTitle, pickArabicText } from "./lib/vehicleCopy";

const importRowValidator = v.object({
  stockCode: v.optional(v.string()),
  vin: v.optional(v.string()),
  make: v.string(),
  model: v.string(),
  year: v.number(),
  trim: v.optional(v.string()),
  priceOmr: v.number(),
  mileageKm: v.number(),
  fuel: v.optional(fuelValidator),
  transmission: v.optional(transmissionValidator),
  drivetrain: v.optional(drivetrainValidator),
  spec: v.optional(specValidator),
  condition: v.optional(conditionValidator),
  bodyType: v.optional(bodyTypeValidator),
  exteriorColor: v.optional(v.string()),
  interiorColor: v.optional(v.string()),
  engine: v.optional(v.string()),
  features: v.optional(v.array(v.string())),
  titleAr: v.optional(v.string()),
  titleEn: v.optional(v.string()),
  descriptionAr: v.optional(v.string()),
  descriptionEn: v.optional(v.string()),
  ownership: v.optional(ownershipValidator),
  status: v.optional(vehicleStatusValidator),
  staffNotes: v.optional(v.string()),
});

export const exportVehicles = adminQuery({
  args: {},
  returns: v.array(
    v.object({
      stockCode: v.string(),
      vin: v.string(),
      make: v.string(),
      model: v.string(),
      year: v.number(),
      trim: v.string(),
      priceOmr: v.number(),
      mileageKm: v.number(),
      fuel: fuelValidator,
      transmission: transmissionValidator,
      drivetrain: drivetrainValidator,
      spec: specValidator,
      condition: conditionValidator,
      bodyType: bodyTypeValidator,
      exteriorColor: v.string(),
      interiorColor: v.string(),
      engine: v.string(),
      features: v.string(),
      titleAr: v.string(),
      titleEn: v.string(),
      descriptionAr: v.string(),
      descriptionEn: v.string(),
      ownership: ownershipValidator,
      status: vehicleStatusValidator,
      staffNotes: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const vehicles = await ctx.db.query("vehicles").take(500);
    return vehicles.map((vehicle) => ({
      stockCode: vehicle.stockCode,
      vin: vehicle.vin ?? "",
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim ?? "",
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
      engine: vehicle.engine ?? "",
      features: vehicle.features.join("|"),
      titleAr: vehicle.titleAr,
      titleEn: vehicle.titleEn,
      descriptionAr: vehicle.descriptionAr,
      descriptionEn: vehicle.descriptionEn,
      ownership: vehicle.ownership,
      status: vehicle.status,
      staffNotes: vehicle.staffNotes ?? "",
    }));
  },
});

export const importVehicles = adminMutation({
  args: {
    rows: v.array(importRowValidator),
    missingStrategy: missingImportStrategyValidator,
  },
  returns: v.object({
    upserted: v.number(),
    marked: v.number(),
  }),
  handler: async (ctx, args) => {
    if (args.rows.length === 0) {
      throw new ConvexError("Import file has no rows");
    }

    const incomingCodes = new Set<string>();
    let upserted = 0;
    const now = Date.now();

    for (const row of args.rows) {
      const stockCode = row.stockCode?.trim() || (await nextStockCode(ctx));
      incomingCodes.add(stockCode);
      const vin = row.vin?.trim() || undefined;

      const existingByCode = await ctx.db
        .query("vehicles")
        .withIndex("by_stock_code", (q) => q.eq("stockCode", stockCode))
        .unique();
      const existingByVin =
        !existingByCode && vin
          ? await ctx.db
              .query("vehicles")
              .withIndex("by_vin", (q) => q.eq("vin", vin))
              .unique()
          : null;
      const existing = existingByCode ?? existingByVin;

      const make = row.make.trim();
      const model = row.model.trim();
      const titleEn = nonempty(row.titleEn) ?? existing?.titleEn ?? `${row.year} ${make} ${model}`;
      const trim = nonempty(row.trim) ?? existing?.trim;
      const spec = row.spec ?? existing?.spec ?? "gcc";
      const condition = row.condition ?? existing?.condition ?? (row.mileageKm === 0 ? "new" : "used");
      const titleAr = pickArabicText(
        [nonempty(row.titleAr), existing?.titleAr],
        buildArabicTitle({ year: row.year, make, model, trim }),
      );
      const descriptionAr = pickArabicText(
        [nonempty(row.descriptionAr), existing?.descriptionAr],
        buildArabicDescription({
          year: row.year,
          make,
          model,
          mileageKm: row.mileageKm,
          spec,
          condition,
        }),
      );
      const features = mergeFeatures(existing?.features ?? [], row.features);
      const status = row.status ?? existing?.status ?? "draft";
      const payload = {
        stockCode,
        slug: buildVehicleSlug({
          year: row.year,
          make,
          model,
          stockCode,
        }),
        vin: vin ?? existing?.vin,
        make,
        model,
        year: row.year,
        trim,
        priceOmr: row.priceOmr,
        mileageKm: row.mileageKm,
        fuel: row.fuel ?? existing?.fuel ?? "petrol",
        transmission: row.transmission ?? existing?.transmission ?? "automatic",
        drivetrain: row.drivetrain ?? existing?.drivetrain ?? "awd",
        spec,
        condition,
        bodyType: row.bodyType ?? existing?.bodyType ?? "suv",
        exteriorColor: nonempty(row.exteriorColor) ?? existing?.exteriorColor ?? "",
        interiorColor: nonempty(row.interiorColor) ?? existing?.interiorColor ?? "",
        engine: nonempty(row.engine) ?? existing?.engine,
        features,
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn: nonempty(row.descriptionEn) ?? existing?.descriptionEn ?? "",
        searchText: buildVehicleSearchText({
          stockCode,
          vin: vin ?? existing?.vin,
          make,
          model,
          trim,
          titleAr,
          titleEn,
          year: row.year,
        }),
        ownership: row.ownership ?? existing?.ownership ?? "dealership",
        status,
        staffNotes: nonempty(row.staffNotes) ?? existing?.staffNotes,
        featured: existing?.featured ?? false,
        updatedAt: now,
      };

      if (existing) {
        await assertUniqueStockAndVin(ctx, {
          stockCode,
          vin: payload.vin,
          excludeId: existing._id,
        });
        await ctx.db.patch(existing._id, {
          ...payload,
          publishedAt:
            payload.status === "published"
              ? (existing.publishedAt ?? now)
              : existing.publishedAt,
        });
      } else {
        await assertUniqueStockAndVin(ctx, { stockCode, vin: payload.vin });
        await ctx.db.insert("vehicles", {
          ...payload,
          publishedAt: payload.status === "published" ? now : undefined,
          createdAt: now,
        });
      }
      upserted += 1;
    }

    let marked = 0;
    if (args.missingStrategy !== "keep") {
      const all = await ctx.db.query("vehicles").take(500);
      for (const vehicle of all) {
        if (!incomingCodes.has(vehicle.stockCode) && vehicle.status === "published") {
          await ctx.db.patch(vehicle._id, {
            status: args.missingStrategy,
            updatedAt: now,
          });
          marked += 1;
        }
      }
    }

    return { upserted, marked };
  },
});

function nonempty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function mergeFeatures(existing: string[], incoming: string[] | undefined): string[] {
  if (!incoming || incoming.length === 0) {
    return existing;
  }
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const feature of [...existing, ...incoming]) {
    const key = feature.trim();
    if (!key) {
      continue;
    }
    const normalized = key.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    merged.push(key);
  }
  return merged;
}
