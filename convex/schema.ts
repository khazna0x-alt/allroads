import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  auditEditTypeValidator,
  bodyTypeValidator,
  conditionValidator,
  contractStatusValidator,
  drivetrainValidator,
  fuelValidator,
  bookingDurationDaysValidator,
  bookingStatusValidator,
  inquirySourceValidator,
  inquiryStatusValidator,
  inspectionVerdictValidator,
  paymentMethodValidator,
  paymentStatusValidator,
  preferredContactValidator,
  localeValidator,
  ownershipDocKindValidator,
  ownershipValidator,
  photoAngleValidator,
  specValidator,
  staffRoleValidator,
  storedVehicleStatusValidator,
  transmissionValidator,
} from "./lib/validators";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(staffRoleValidator),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_role", ["role"]),

  vehicles: defineTable({
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
    searchText: v.string(),
    ownership: ownershipValidator,
    status: storedVehicleStatusValidator,
    featured: v.boolean(),
    publicHidden: v.optional(v.boolean()),
    onSiteConfirmed: v.optional(v.boolean()),
    onSiteConfirmedAt: v.optional(v.number()),
    contractStatus: v.optional(contractStatusValidator),
    contractStartsAt: v.optional(v.number()),
    contractEndsAt: v.optional(v.number()),
    contractExpiryAlertedAt: v.optional(v.number()),
    publishGrandfathered: v.optional(v.boolean()),
    ownerName: v.optional(v.string()),
    ownerPhone: v.optional(v.string()),
    ownerNotes: v.optional(v.string()),
    staffNotes: v.optional(v.string()),
    hefflContactId: v.optional(v.string()),
    hefflLeadId: v.optional(v.string()),
    contractStorageId: v.optional(v.id("_storage")),
    contractFileName: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_make_model", ["make", "model"])
    .index("by_status_and_price", ["status", "priceOmr"])
    .index("by_status_and_year", ["status", "year"])
    .index("by_ownership", ["ownership"])
    .index("by_stock_code", ["stockCode"])
    .index("by_slug", ["slug"])
    .index("by_vin", ["vin"])
    .index("by_status_and_featured", ["status", "featured"])
    .index("by_contract_status_and_ends_at", ["contractStatus", "contractEndsAt"])
    .searchIndex("search_vehicles", {
      searchField: "searchText",
      filterFields: ["status"],
    }),

  vehiclePhotos: defineTable({
    vehicleId: v.id("vehicles"),
    storageId: v.id("_storage"),
    sortOrder: v.number(),
    altAr: v.string(),
    altEn: v.string(),
    angle: v.optional(photoAngleValidator),
  }).index("by_vehicle", ["vehicleId"]),

  vehicleDocuments: defineTable({
    vehicleId: v.id("vehicles"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    kind: ownershipDocKindValidator,
    createdAt: v.number(),
  }).index("by_vehicle", ["vehicleId"]),

  inspections: defineTable({
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
  }).index("by_vehicle", ["vehicleId"]),

  inspectionPhotos: defineTable({
    inspectionId: v.id("inspections"),
    vehicleId: v.id("vehicles"),
    storageId: v.id("_storage"),
    caption: v.string(),
    sortOrder: v.number(),
    createdAt: v.number(),
  })
    .index("by_inspection", ["inspectionId"])
    .index("by_vehicle", ["vehicleId"]),

  vehicleStatusLogs: defineTable({
    vehicleId: v.id("vehicles"),
    actorUserId: v.optional(v.id("users")),
    fromStatus: v.optional(v.string()),
    toStatus: storedVehicleStatusValidator,
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_vehicle", ["vehicleId"])
    .index("by_created", ["createdAt"]),

  auditLogs: defineTable({
    actorUserId: v.optional(v.id("users")),
    vehicleId: v.optional(v.id("vehicles")),
    editType: auditEditTypeValidator,
    fromValue: v.optional(v.string()),
    toValue: v.optional(v.string()),
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_vehicle", ["vehicleId"])
    .index("by_actor", ["actorUserId"])
    .index("by_created", ["createdAt"]),

  counters: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),

  inquiries: defineTable({
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
    viewingRequested: v.optional(v.boolean()),
    handoffReason: v.optional(v.string()),
    hefflContactId: v.optional(v.string()),
    hefflLeadId: v.optional(v.string()),
    hefflSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_source", ["source"])
    .index("by_phone", ["phone"])
    .index("by_created", ["createdAt"]),

  bookings: defineTable({
    bookingNumber: v.string(),
    vehicleId: v.id("vehicles"),
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),
    durationDays: bookingDurationDaysValidator,
    startsAt: v.number(),
    endsAt: v.number(),
    depositOmr: v.number(),
    paymentMethod: paymentMethodValidator,
    notes: v.optional(v.string()),
    status: bookingStatusValidator,
    locale: localeValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_booking_number", ["bookingNumber"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_vehicle_and_status", ["vehicleId", "status"])
    .index("by_status", ["status"])
    .index("by_status_and_ends_at", ["status", "endsAt"])
    .index("by_created", ["createdAt"]),

  payments: defineTable({
    bookingId: v.id("bookings"),
    amountOmr: v.number(),
    status: paymentStatusValidator,
    method: paymentMethodValidator,
    receiptStorageId: v.optional(v.id("_storage")),
    receiptFileName: v.optional(v.string()),
    notes: v.optional(v.string()),
    refundNotes: v.optional(v.string()),
    refundedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_booking", ["bookingId"]),
});
