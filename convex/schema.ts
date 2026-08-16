import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  bodyTypeValidator,
  conditionValidator,
  drivetrainValidator,
  fuelValidator,
  inquirySourceValidator,
  inquiryStatusValidator,
  localeValidator,
  ownershipValidator,
  specValidator,
  staffRoleValidator,
  transmissionValidator,
  vehicleStatusValidator,
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
    status: vehicleStatusValidator,
    featured: v.boolean(),
    ownerName: v.optional(v.string()),
    ownerPhone: v.optional(v.string()),
    ownerNotes: v.optional(v.string()),
    staffNotes: v.optional(v.string()),
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
  }).index("by_vehicle", ["vehicleId"]),

  counters: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),

  inquiries: defineTable({
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
  })
    .index("by_status", ["status"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_source", ["source"])
    .index("by_created", ["createdAt"]),
});
