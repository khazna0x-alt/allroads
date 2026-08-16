import { v } from "convex/values";

export const staffRoleValidator = v.union(
  v.literal("admin"),
  v.literal("editor"),
);

export const vehicleStatusValidator = v.union(
  v.literal("pending_review"),
  v.literal("draft"),
  v.literal("published"),
  v.literal("hidden"),
  v.literal("sold"),
  v.literal("rejected"),
);

export const ownershipValidator = v.union(
  v.literal("dealership"),
  v.literal("consignment"),
);

export const specValidator = v.union(
  v.literal("gcc"),
  v.literal("american"),
  v.literal("other"),
);

export const conditionValidator = v.union(
  v.literal("new"),
  v.literal("used"),
);

export const fuelValidator = v.union(
  v.literal("petrol"),
  v.literal("diesel"),
  v.literal("hybrid"),
  v.literal("plugin_hybrid"),
  v.literal("electric"),
);

export const transmissionValidator = v.union(
  v.literal("automatic"),
  v.literal("manual"),
);

export const drivetrainValidator = v.union(
  v.literal("awd"),
  v.literal("4wd"),
  v.literal("rwd"),
  v.literal("fwd"),
);

export const bodyTypeValidator = v.union(
  v.literal("suv"),
  v.literal("sedan"),
  v.literal("coupe"),
  v.literal("convertible"),
  v.literal("hatchback"),
  v.literal("wagon"),
  v.literal("pickup"),
  v.literal("van"),
);

export const localeValidator = v.union(v.literal("ar"), v.literal("en"));

export const inquirySourceValidator = v.union(
  v.literal("web_form"),
  v.literal("consignment"),
  v.literal("waagents"),
);

export const inquiryStatusValidator = v.union(
  v.literal("new"),
  v.literal("in_progress"),
  v.literal("closed"),
);

export const missingImportStrategyValidator = v.union(
  v.literal("keep"),
  v.literal("sold"),
  v.literal("hidden"),
);

export const vehicleWriteValidator = {
  stockCode: v.optional(v.string()),
  vin: v.optional(v.string()),
  make: v.string(),
  model: v.string(),
  year: v.number(),
  trim: v.optional(v.string()),
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
  engine: v.optional(v.string()),
  features: v.array(v.string()),
  titleAr: v.string(),
  titleEn: v.string(),
  descriptionAr: v.string(),
  descriptionEn: v.string(),
  ownership: ownershipValidator,
  featured: v.optional(v.boolean()),
  ownerName: v.optional(v.string()),
  ownerPhone: v.optional(v.string()),
  ownerNotes: v.optional(v.string()),
  staffNotes: v.optional(v.string()),
};

export const publicVehicleValidator = v.object({
  _id: v.id("vehicles"),
  _creationTime: v.number(),
  stockCode: v.string(),
  slug: v.string(),
  make: v.string(),
  model: v.string(),
  year: v.number(),
  trim: v.optional(v.string()),
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
  engine: v.optional(v.string()),
  features: v.array(v.string()),
  titleAr: v.string(),
  titleEn: v.string(),
  descriptionAr: v.string(),
  descriptionEn: v.string(),
  ownership: ownershipValidator,
  featured: v.boolean(),
  photos: v.array(
    v.object({
      url: v.string(),
      altAr: v.string(),
      altEn: v.string(),
    }),
  ),
});

export const staffVehicleValidator = v.object({
  _id: v.id("vehicles"),
  _creationTime: v.number(),
  stockCode: v.string(),
  slug: v.string(),
  vin: v.optional(v.string()),
  make: v.string(),
  model: v.string(),
  year: v.number(),
  trim: v.optional(v.string()),
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
  engine: v.optional(v.string()),
  features: v.array(v.string()),
  titleAr: v.string(),
  titleEn: v.string(),
  descriptionAr: v.string(),
  descriptionEn: v.string(),
  ownership: ownershipValidator,
  status: vehicleStatusValidator,
  featured: v.boolean(),
  ownerName: v.optional(v.string()),
  ownerPhone: v.optional(v.string()),
  ownerNotes: v.optional(v.string()),
  staffNotes: v.optional(v.string()),
  contractFileName: v.optional(v.string()),
  contractUrl: v.union(v.string(), v.null()),
  publishedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
  photos: v.array(
    v.object({
      _id: v.id("vehiclePhotos"),
      url: v.union(v.string(), v.null()),
      sortOrder: v.number(),
      altAr: v.string(),
      altEn: v.string(),
    }),
  ),
});

export const staffUserValidator = v.object({
  _id: v.id("users"),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  role: staffRoleValidator,
  identifier: v.string(),
});
