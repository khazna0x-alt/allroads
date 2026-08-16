import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  bodyTypeValidator,
  conditionValidator,
  fuelValidator,
  ownershipValidator,
  publicVehicleValidator,
  specValidator,
  transmissionValidator,
} from "./lib/validators";
import { matchesPublicFilters, photosForVehicle, toPublicVehicle } from "./lib/vehicles";

const publicFilters = {
  keyword: v.optional(v.string()),
  make: v.optional(v.string()),
  model: v.optional(v.string()),
  minPrice: v.optional(v.number()),
  maxPrice: v.optional(v.number()),
  minYear: v.optional(v.number()),
  maxYear: v.optional(v.number()),
  maxMileage: v.optional(v.number()),
  fuel: v.optional(fuelValidator),
  transmission: v.optional(transmissionValidator),
  spec: v.optional(specValidator),
  bodyType: v.optional(bodyTypeValidator),
  condition: v.optional(conditionValidator),
  feature: v.optional(v.string()),
  ownership: v.optional(ownershipValidator),
};

export const listPublished = query({
  args: {
    paginationOpts: paginationOptsValidator,
    ...publicFilters,
  },
  returns: v.object({
    page: v.array(publicVehicleValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const keyword = args.keyword?.trim();
    const result = keyword
      ? await ctx.db
          .query("vehicles")
          .withSearchIndex("search_vehicles", (q) =>
            q.search("searchText", keyword).eq("status", "published"),
          )
          .paginate(args.paginationOpts)
      : await ctx.db
          .query("vehicles")
          .withIndex("by_status_and_price", (q) => q.eq("status", "published"))
          .paginate(args.paginationOpts);

    const filtered = result.page.filter((vehicle) =>
      matchesPublicFilters(vehicle, args),
    );

    const page = [];
    for (const vehicle of filtered) {
      const photos = await photosForVehicle(ctx, vehicle._id);
      page.push(toPublicVehicle(vehicle, photos));
    }

    return {
      page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const featuredPublished = query({
  args: {},
  returns: v.array(publicVehicleValidator),
  handler: async (ctx) => {
    const featured = await ctx.db
      .query("vehicles")
      .withIndex("by_status_and_featured", (q) =>
        q.eq("status", "published").eq("featured", true),
      )
      .take(6);

    const fallback =
      featured.length > 0
        ? featured
        : await ctx.db
            .query("vehicles")
            .withIndex("by_status", (q) => q.eq("status", "published"))
            .take(6);

    const page = [];
    for (const vehicle of fallback) {
      const photos = await photosForVehicle(ctx, vehicle._id);
      page.push(toPublicVehicle(vehicle, photos));
    }
    return page;
  },
});

export const getPublishedBySlug = query({
  args: { slug: v.string() },
  returns: v.union(publicVehicleValidator, v.null()),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!vehicle || vehicle.status !== "published") {
      return null;
    }

    const photos = await photosForVehicle(ctx, vehicle._id);
    return toPublicVehicle(vehicle, photos);
  },
});

export const getPublishedByStockCode = query({
  args: { stockCode: v.string() },
  returns: v.union(publicVehicleValidator, v.null()),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_stock_code", (q) => q.eq("stockCode", args.stockCode))
      .unique();

    if (!vehicle || vehicle.status !== "published") {
      return null;
    }

    const photos = await photosForVehicle(ctx, vehicle._id);
    return toPublicVehicle(vehicle, photos);
  },
});

export const listPublishedFeed = query({
  args: {},
  returns: v.array(publicVehicleValidator),
  handler: async (ctx) => {
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(200);

    const page = [];
    for (const vehicle of vehicles) {
      const photos = await photosForVehicle(ctx, vehicle._id);
      page.push(toPublicVehicle(vehicle, photos));
    }
    return page;
  },
});

export const listMakes = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(200);
    const makes = [...new Set(vehicles.map((vehicle) => vehicle.make))].sort();
    return makes;
  },
});

export const filterBounds = query({
  args: {},
  returns: v.object({
    minPrice: v.number(),
    maxPrice: v.number(),
    minYear: v.number(),
    maxYear: v.number(),
  }),
  handler: async (ctx) => {
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(200);

    if (vehicles.length === 0) {
      return { minPrice: 0, maxPrice: 25000, minYear: 2010, maxYear: 2026 };
    }

    const first = vehicles[0];
    if (!first) {
      return { minPrice: 0, maxPrice: 25000, minYear: 2010, maxYear: 2026 };
    }

    let minPrice = first.priceOmr;
    let maxPrice = first.priceOmr;
    let minYear = first.year;
    let maxYear = first.year;
    for (const vehicle of vehicles) {
      minPrice = Math.min(minPrice, vehicle.priceOmr);
      maxPrice = Math.max(maxPrice, vehicle.priceOmr);
      minYear = Math.min(minYear, vehicle.year);
      maxYear = Math.max(maxYear, vehicle.year);
    }

    const roundedMin = Math.max(0, Math.floor(minPrice / 500) * 500);
    const roundedMax = Math.max(Math.ceil(maxPrice / 500) * 500, roundedMin + 500);

    return {
      minPrice: roundedMin,
      maxPrice: roundedMax,
      minYear,
      maxYear: Math.max(maxYear, minYear),
    };
  },
});
