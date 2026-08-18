import { v } from "convex/values";

export const staffRoleValidator = v.union(
  v.literal("admin"),
  v.literal("editor"),
);

export const vehicleStatusValidator = v.union(
  v.literal("new"),
  v.literal("under_review"),
  v.literal("inspection_scheduled"),
  v.literal("under_inspection"),
  v.literal("awaiting_contract"),
  v.literal("approved"),
  v.literal("not_accepted"),
  v.literal("approved_for_publishing"),
  v.literal("published"),
  v.literal("reserved"),
  v.literal("booked"),
  v.literal("sold"),
  v.literal("withdrawn"),
  v.literal("expired"),
);

/** Accept V2 statuses plus pre-migration values so schema push does not reject live rows. */
export const storedVehicleStatusValidator = v.union(
  vehicleStatusValidator,
  v.literal("pending_review"),
  v.literal("draft"),
  v.literal("hidden"),
  v.literal("rejected"),
);

export const publicFloorStatusValidator = v.union(
  v.literal("published"),
  v.literal("reserved"),
  v.literal("booked"),
);

export const publicSortValidator = v.union(
  v.literal("newest"),
  v.literal("price_asc"),
  v.literal("price_desc"),
  v.literal("mileage_asc"),
);

export const photoAngleValidator = v.union(
  v.literal("front"),
  v.literal("rear"),
  v.literal("side"),
  v.literal("interior"),
  v.literal("seats"),
  v.literal("dash"),
  v.literal("wheels"),
  v.literal("engine"),
  v.literal("trunk"),
  v.literal("damage"),
);

export const contractStatusValidator = v.union(
  v.literal("unsigned"),
  v.literal("awaiting_signature"),
  v.literal("signed"),
  v.literal("expired"),
  v.literal("cancelled"),
);

export const inspectionVerdictValidator = v.union(
  v.literal("accepted"),
  v.literal("accepted_with_notes"),
  v.literal("not_accepted"),
);

export const ownershipDocKindValidator = v.literal("ownership");

export const auditEditTypeValidator = v.union(
  v.literal("status_change"),
  v.literal("public_hidden"),
  v.literal("field_edit"),
  v.literal("consignment_submit"),
  v.literal("staff_notify"),
  v.literal("publish_blocked"),
  v.literal("migration"),
  v.literal("inspection_saved"),
  v.literal("contract_update"),
  v.literal("contract_expiry_alert"),
  v.literal("contract_expired"),
  v.literal("inquiry_submit"),
  v.literal("whatsapp_intent"),
  v.literal("booking_submit"),
  v.literal("booking_update"),
  v.literal("booking_expired"),
  v.literal("payment_update"),
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
  v.literal("whatsapp"),
);

export const inquiryStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("viewing_scheduled"),
  v.literal("negotiating"),
  v.literal("booked"),
  v.literal("sold"),
  v.literal("closed"),
  v.literal("in_progress"),
);

export const preferredContactValidator = v.union(
  v.literal("phone"),
  v.literal("whatsapp"),
  v.literal("email"),
);

export const bookingStatusValidator = v.union(
  v.literal("reserved"),
  v.literal("booked"),
  v.literal("cancelled"),
  v.literal("expired"),
);

export const bookingDurationDaysValidator = v.union(
  v.literal(3),
  v.literal(7),
  v.literal(14),
);

export const paymentMethodValidator = v.union(
  v.literal("bank_transfer"),
  v.literal("gateway_later"),
);

export const paymentStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("cancelled"),
  v.literal("refunded"),
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
  publicHidden: v.optional(v.boolean()),
  onSiteConfirmed: v.optional(v.boolean()),
  contractStatus: v.optional(contractStatusValidator),
  contractStartsAt: v.optional(v.number()),
  contractEndsAt: v.optional(v.number()),
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
  status: publicFloorStatusValidator,
  updatedAt: v.number(),
  inspectedAt: v.optional(v.number()),
  depositOmr: v.number(),
  canBook: v.boolean(),
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
  publicHidden: v.boolean(),
  onSiteConfirmed: v.boolean(),
  onSiteConfirmedAt: v.optional(v.number()),
  contractStatus: v.optional(contractStatusValidator),
  contractStartsAt: v.optional(v.number()),
  contractEndsAt: v.optional(v.number()),
  hasContractFile: v.boolean(),
  publishGrandfathered: v.boolean(),
  publishReady: v.boolean(),
  publishBlockers: v.array(v.string()),
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
      angle: v.optional(photoAngleValidator),
    }),
  ),
});

export const staffInspectionPhotoValidator = v.object({
  _id: v.id("inspectionPhotos"),
  url: v.union(v.string(), v.null()),
  caption: v.string(),
  sortOrder: v.number(),
});

export const staffInspectionValidator = v.object({
  _id: v.id("inspections"),
  vehicleId: v.id("vehicles"),
  verdict: v.optional(inspectionVerdictValidator),
  inspectorName: v.optional(v.string()),
  inspectedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  chassisMatchesDocs: v.optional(v.boolean()),
  bodyNotes: v.optional(v.string()),
  paintNotes: v.optional(v.string()),
  accidentHistory: v.optional(v.string()),
  engineNotes: v.optional(v.string()),
  transmissionNotes: v.optional(v.string()),
  acNotes: v.optional(v.string()),
  interiorNotes: v.optional(v.string()),
  tiresNotes: v.optional(v.string()),
  actualMileageKm: v.optional(v.number()),
  ownershipReview: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  photos: v.array(staffInspectionPhotoValidator),
});

export const staffUserValidator = v.object({
  _id: v.id("users"),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  role: staffRoleValidator,
  identifier: v.string(),
});
