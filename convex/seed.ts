import { createAccount } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { normalizeIdentifier } from "./lib/identifiers";
import { generatePassword } from "./lib/passwords";
import {
  buildVehicleSearchText,
  buildVehicleSlug,
} from "./lib/vehicles";

export const hasAdmin = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();
    return admin !== null;
  },
});

export const seedFirstAdmin = internalAction({
  args: {
    identifier: v.string(),
    name: v.string(),
    password: v.optional(v.string()),
  },
  returns: v.object({
    identifier: v.string(),
    password: v.string(),
    alreadyExisted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const exists = await ctx.runQuery(internal.seed.hasAdmin, {});
    if (exists) {
      throw new ConvexError("An admin already exists");
    }

    const parsed = normalizeIdentifier(args.identifier);
    const password = args.password ?? generatePassword();

    await createAccount(ctx, {
      provider: "password",
      account: { id: parsed.accountId, secret: password },
      profile: {
        name: args.name.trim(),
        email: parsed.email ?? parsed.accountId,
        phone: parsed.phone,
        role: "admin",
      },
    });

    return {
      identifier: parsed.accountId,
      password,
      alreadyExisted: false,
    };
  },
});

const sampleVehicles = [
  {
    stockCode: "AR-1001",
    make: "Lexus",
    model: "LX 600",
    year: 2023,
    trim: "F Sport",
    priceOmr: 58500,
    mileageKm: 24000,
    fuel: "petrol" as const,
    transmission: "automatic" as const,
    drivetrain: "4wd" as const,
    spec: "gcc" as const,
    condition: "used" as const,
    bodyType: "suv" as const,
    exteriorColor: "Sonic Titanium",
    interiorColor: "Black / Circuit Red",
    engine: "3.5L Twin-Turbo V6",
    features: ["360 camera", "cool box", "mark levinson", "rear entertainment"],
    titleAr: "لكزس LX 600 أف سبورت 2023",
    titleEn: "2023 Lexus LX 600 F Sport",
    descriptionAr:
      "مواصفات خليجية، عناية صالة، جاهزة للتسليم من معرض كل الطرق في العامرات.",
    descriptionEn:
      "GCC specification, showroom-kept, ready for delivery from All Roads in Al Amerat.",
    featured: true,
  },
  {
    stockCode: "AR-1002",
    make: "Mercedes-Benz",
    model: "G 63 AMG",
    year: 2022,
    trim: "AMG",
    priceOmr: 72000,
    mileageKm: 31000,
    fuel: "petrol" as const,
    transmission: "automatic" as const,
    drivetrain: "4wd" as const,
    spec: "gcc" as const,
    condition: "used" as const,
    bodyType: "suv" as const,
    exteriorColor: "Obsidian Black",
    interiorColor: "Nappa Classic Red",
    engine: "4.0L Twin-Turbo V8",
    features: ["burmester", "night package", "carbon interior", "side steps"],
    titleAr: "مرسيدس G 63 AMG 2022",
    titleEn: "2022 Mercedes-Benz G 63 AMG",
    descriptionAr:
      "أيقونة الطرق العُمانية. مفحوصة، موثّقة، ومعروضة تحت رعاية كل الطرق.",
    descriptionEn:
      "An icon for Omani roads. Inspected, documented, and presented under All Roads care.",
    featured: true,
  },
  {
    stockCode: "AR-1003",
    make: "Toyota",
    model: "Land Cruiser 300",
    year: 2024,
    trim: "VX.R",
    priceOmr: 42900,
    mileageKm: 12000,
    fuel: "petrol" as const,
    transmission: "automatic" as const,
    drivetrain: "4wd" as const,
    spec: "gcc" as const,
    condition: "used" as const,
    bodyType: "suv" as const,
    exteriorColor: "White Pearl",
    interiorColor: "Beige",
    engine: "3.5L Twin-Turbo V6",
    features: ["cool box", "sunroof", "360 camera", "seven seats"],
    titleAr: "تويوتا لاند كروزر 300 VX.R 2024",
    titleEn: "2024 Toyota Land Cruiser 300 VX.R",
    descriptionAr:
      "الخليجي الأصيل. صيانة وكالة، جاهز للرحلات وللمدينة على حد سواء.",
    descriptionEn:
      "The essential GCC cruiser. Agency-serviced and ready for city or desert.",
    featured: true,
  },
  {
    stockCode: "AR-1004",
    make: "Porsche",
    model: "Cayenne",
    year: 2021,
    trim: "S",
    priceOmr: 26800,
    mileageKm: 41000,
    fuel: "petrol" as const,
    transmission: "automatic" as const,
    drivetrain: "awd" as const,
    spec: "gcc" as const,
    condition: "used" as const,
    bodyType: "suv" as const,
    exteriorColor: "Mahogany Metallic",
    interiorColor: "Black Leather",
    engine: "2.9L Twin-Turbo V6",
    features: ["air suspension", "pano roof", "sport chrono", "BOSE"],
    titleAr: "بورشه كايين S 2021",
    titleEn: "2021 Porsche Cayenne S",
    descriptionAr: "فخامة ألمانية بمواصفات خليجية، معروضة في صالة كل الطرق.",
    descriptionEn: "German luxury in GCC spec, now on the All Roads floor.",
    featured: false,
  },
  {
    stockCode: "AR-1005",
    make: "Land Rover",
    model: "Range Rover Sport",
    year: 2023,
    trim: "HSE",
    priceOmr: 39500,
    mileageKm: 18000,
    fuel: "petrol" as const,
    transmission: "automatic" as const,
    drivetrain: "awd" as const,
    spec: "gcc" as const,
    condition: "used" as const,
    bodyType: "suv" as const,
    exteriorColor: "Santorini Black",
    interiorColor: "Ebony / Ivory",
    engine: "3.0L Inline-6",
    features: ["meridian", "pixel LED", "hot stone massage", "head-up display"],
    titleAr: "رينج روفر سبورت HSE 2023",
    titleEn: "2023 Range Rover Sport HSE",
    descriptionAr:
      "حضور ملكي على طريق العامرات. مفحوصة وجاهزة للتسليم الفوري.",
    descriptionEn:
      "A regal presence on the Amerat road. Inspected and ready for immediate delivery.",
    featured: true,
  },
];

export const seedSampleVehicles = internalMutation({
  args: {},
  returns: v.object({ inserted: v.number(), skipped: v.boolean() }),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("vehicles")
      .withIndex("by_stock_code", (q) => q.eq("stockCode", "AR-1001"))
      .unique();
    if (existing) {
      return { inserted: 0, skipped: true };
    }

    const now = Date.now();
    for (const sample of sampleVehicles) {
      await ctx.db.insert("vehicles", {
        ...sample,
        slug: buildVehicleSlug(sample),
        searchText: buildVehicleSearchText(sample),
        ownership: "dealership",
        status: "published",
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    const counter = await ctx.db
      .query("counters")
      .withIndex("by_key", (q) => q.eq("key", "stock"))
      .unique();
    if (counter) {
      await ctx.db.patch("counters", counter._id, { value: Math.max(counter.value, 1005) });
    } else {
      await ctx.db.insert("counters", { key: "stock", value: 1005 });
    }

    return { inserted: sampleVehicles.length, skipped: false };
  },
});

const featuredExamplePhotos = [
  {
    stockCode: "AR-1001",
    url: "https://hushed-jackal-243.eu-west-1.convex.cloud/api/storage/e8c5f82d-035e-4c71-8793-9a4388099077",
    altAr: "لكزس LX 600 أف سبورت 2023",
    altEn: "2023 Lexus LX 600 F Sport",
  },
  {
    stockCode: "AR-1002",
    url: "https://hushed-jackal-243.eu-west-1.convex.cloud/api/storage/c401efef-6f69-43f2-99ab-7acecf87cda8",
    altAr: "مرسيدس G 63 AMG 2022",
    altEn: "2022 Mercedes-Benz G 63 AMG",
  },
  {
    stockCode: "AR-1003",
    url: "https://hushed-jackal-243.eu-west-1.convex.cloud/api/storage/0cfb13d7-4794-4e65-8bb3-062dd8ad84c0",
    altAr: "تويوتا لاند كروزر 300 VX.R 2024",
    altEn: "2024 Toyota Land Cruiser 300 VX.R",
  },
  {
    stockCode: "AR-1005",
    url: "https://hushed-jackal-243.eu-west-1.convex.cloud/api/storage/f718a73c-4bd3-465b-811c-bfa2c865b47a",
    altAr: "رينج روفر سبورت HSE 2023",
    altEn: "2023 Range Rover Sport HSE",
  },
];

export const alignFeaturedExamples = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const porsche = await ctx.db
      .query("vehicles")
      .withIndex("by_stock_code", (q) => q.eq("stockCode", "AR-1004"))
      .unique();
    if (porsche && porsche.status !== "hidden") {
      await ctx.db.patch("vehicles", porsche._id, { status: "hidden", updatedAt: now });
    }

    const cruiser = await ctx.db
      .query("vehicles")
      .withIndex("by_stock_code", (q) => q.eq("stockCode", "AR-1003"))
      .unique();
    if (cruiser) {
      await ctx.db.patch("vehicles", cruiser._id, {
        exteriorColor: "Black",
        searchText: buildVehicleSearchText(cruiser),
        updatedAt: now,
      });
    }

    const sport = await ctx.db
      .query("vehicles")
      .withIndex("by_stock_code", (q) => q.eq("stockCode", "AR-1005"))
      .unique();
    if (sport) {
      const titleAr = sport.titleAr;
      const titleEn = sport.titleEn;
      await ctx.db.patch("vehicles", sport._id, {
        exteriorColor: "Santorini Red",
        descriptionAr: "حضور ملكي وجاهزة للتسليم الفوري.",
        descriptionEn: "A regal presence ready for immediate delivery.",
        searchText: buildVehicleSearchText({
          stockCode: sport.stockCode,
          make: sport.make,
          model: sport.model,
          trim: sport.trim,
          titleAr,
          titleEn,
          year: sport.year,
        }),
        updatedAt: now,
      });
    }

    return null;
  },
});

export const attachSeedPhoto = internalMutation({
  args: {
    stockCode: v.string(),
    storageId: v.id("_storage"),
    altAr: v.string(),
    altEn: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_stock_code", (q) => q.eq("stockCode", args.stockCode))
      .unique();
    if (!vehicle) {
      throw new ConvexError(`Vehicle ${args.stockCode} not found`);
    }

    const existing = await ctx.db
      .query("vehiclePhotos")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
      .first();
    if (existing) {
      return null;
    }

    await ctx.db.insert("vehiclePhotos", {
      vehicleId: vehicle._id,
      storageId: args.storageId,
      sortOrder: 0,
      altAr: args.altAr,
      altEn: args.altEn,
    });
    return null;
  },
});

export const copyFeaturedExamplePhotos = internalAction({
  args: {},
  returns: v.object({ copied: v.number() }),
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.alignFeaturedExamples, {});

    let copied = 0;
    for (const photo of featuredExamplePhotos) {
      const response = await fetch(photo.url);
      if (!response.ok) {
        throw new ConvexError(`Could not copy photo for ${photo.stockCode}`);
      }
      const blob = await response.blob();
      const storageId = await ctx.storage.store(blob);
      await ctx.runMutation(internal.seed.attachSeedPhoto, {
        stockCode: photo.stockCode,
        storageId: storageId as Id<"_storage">,
        altAr: photo.altAr,
        altEn: photo.altEn,
      });
      copied += 1;
    }

    return { copied };
  },
});
