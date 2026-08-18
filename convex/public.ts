import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { latestInspection } from "./lib/audit";
import {
  bodyTypeValidator,
  conditionValidator,
  fuelValidator,
  ownershipValidator,
  publicFloorStatusValidator,
  publicSortValidator,
  publicVehicleValidator,
  specValidator,
  transmissionValidator,
} from "./lib/validators";
import { isOnPublicFloor } from "./lib/publish";
import { PUBLIC_FLOOR_STATUSES } from "./lib/vehicleStatus";
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
  color: v.optional(v.string()),
  status: v.optional(publicFloorStatusValidator),
  fuel: v.optional(fuelValidator),
  transmission: v.optional(transmissionValidator),
  spec: v.optional(specValidator),
  bodyType: v.optional(bodyTypeValidator),
  condition: v.optional(conditionValidator),
  feature: v.optional(v.string()),
  ownership: v.optional(ownershipValidator),
  sort: v.optional(publicSortValidator),
};

type PublicSort = "newest" | "price_asc" | "price_desc" | "mileage_asc";

async function toPublicFloorVehicle(
  ctx: QueryCtx,
  vehicle: Doc<"vehicles">,
  extras?: { includeInspection?: boolean },
) {
  const photos = await photosForVehicle(ctx, vehicle._id);
  if (!extras?.includeInspection) {
    return toPublicVehicle(vehicle, photos);
  }
  const inspection = await latestInspection(ctx, vehicle._id);
  return toPublicVehicle(vehicle, photos, { inspectedAt: inspection?.inspectedAt });
}

async function takeFloorVehicles(ctx: QueryCtx, limit: number) {
  const pages = await Promise.all(
    PUBLIC_FLOOR_STATUSES.map((status) =>
      ctx.db
        .query("vehicles")
        .withIndex("by_status", (q) => q.eq("status", status))
        .take(limit),
    ),
  );
  return pages.flat().filter(isOnPublicFloor);
}

function sortFloorVehicles(vehicles: Doc<"vehicles">[], sort: PublicSort) {
  const copy = [...vehicles];
  copy.sort((left, right) => {
    if (sort === "price_asc") {
      return left.priceOmr - right.priceOmr || right._creationTime - left._creationTime;
    }
    if (sort === "price_desc") {
      return right.priceOmr - left.priceOmr || right._creationTime - left._creationTime;
    }
    if (sort === "mileage_asc") {
      return left.mileageKm - right.mileageKm || right._creationTime - left._creationTime;
    }
    const leftNewest = left.publishedAt ?? left._creationTime;
    const rightNewest = right.publishedAt ?? right._creationTime;
    return rightNewest - leftNewest;
  });
  return copy;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort((left, right) =>
    left.localeCompare(right),
  );
}

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
    const filtered = (await takeFloorVehicles(ctx, 200)).filter((vehicle) =>
      matchesPublicFilters(vehicle, args),
    );
    const sorted = sortFloorVehicles(filtered, args.sort ?? "newest");
    const parsedOffset = args.paginationOpts.cursor
      ? Number.parseInt(args.paginationOpts.cursor, 10)
      : 0;
    const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;
    const limit = Math.min(Math.max(Math.floor(args.paginationOpts.numItems), 1), 48);
    const slice = sorted.slice(offset, offset + limit);
    const page = [];
    for (const vehicle of slice) {
      page.push(await toPublicFloorVehicle(ctx, vehicle));
    }
    const nextOffset = offset + slice.length;
    return {
      page,
      isDone: nextOffset >= sorted.length,
      continueCursor: String(nextOffset),
    };
  },
});

export const featuredPublished = query({
  args: {},
  returns: v.array(publicVehicleValidator),
  handler: async (ctx) => {
    const featured = (
      await ctx.db
        .query("vehicles")
        .withIndex("by_status_and_featured", (q) =>
          q.eq("status", "published").eq("featured", true),
        )
        .take(6)
    ).filter(isOnPublicFloor);

    const fallback =
      featured.length > 0
        ? featured
        : sortFloorVehicles(await takeFloorVehicles(ctx, 6), "newest").slice(0, 6);

    const page = [];
    for (const vehicle of fallback) {
      page.push(await toPublicFloorVehicle(ctx, vehicle));
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

    if (!vehicle || !isOnPublicFloor(vehicle)) {
      return null;
    }

    return await toPublicFloorVehicle(ctx, vehicle, { includeInspection: true });
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

    if (!vehicle || !isOnPublicFloor(vehicle)) {
      return null;
    }

    return await toPublicFloorVehicle(ctx, vehicle, { includeInspection: true });
  },
});

export const listPublishedFeed = query({
  args: {},
  returns: v.array(publicVehicleValidator),
  handler: async (ctx) => {
    const vehicles = await takeFloorVehicles(ctx, 200);
    const page = [];
    for (const vehicle of vehicles) {
      page.push(await toPublicFloorVehicle(ctx, vehicle));
    }
    return page;
  },
});

export const listSimilar = query({
  args: { slug: v.string() },
  returns: v.array(publicVehicleValidator),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!vehicle || !isOnPublicFloor(vehicle)) {
      return [];
    }

    const band = Math.max(vehicle.priceOmr * 0.25, 1000);
    const candidates = (await takeFloorVehicles(ctx, 200))
      .filter((candidate) => candidate._id !== vehicle._id)
      .filter((candidate) => {
        const sameFamily =
          candidate.make.toLowerCase() === vehicle.make.toLowerCase() ||
          candidate.bodyType === vehicle.bodyType;
        return sameFamily && Math.abs(candidate.priceOmr - vehicle.priceOmr) <= band;
      })
      .sort((left, right) => {
        const leftMake =
          left.make.toLowerCase() === vehicle.make.toLowerCase() ? 0 : 1;
        const rightMake =
          right.make.toLowerCase() === vehicle.make.toLowerCase() ? 0 : 1;
        if (leftMake !== rightMake) {
          return leftMake - rightMake;
        }
        return (
          Math.abs(left.priceOmr - vehicle.priceOmr) -
          Math.abs(right.priceOmr - vehicle.priceOmr)
        );
      })
      .slice(0, 6);

    const page = [];
    for (const candidate of candidates) {
      page.push(await toPublicFloorVehicle(ctx, candidate));
    }
    return page;
  },
});

export const listMakes = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const vehicles = await takeFloorVehicles(ctx, 200);
    return uniqueSorted(vehicles.map((vehicle) => vehicle.make));
  },
});

export const listModels = query({
  args: { make: v.optional(v.string()) },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const make = args.make?.trim().toLowerCase();
    const vehicles = (await takeFloorVehicles(ctx, 200)).filter((vehicle) =>
      make ? vehicle.make.toLowerCase() === make : true,
    );
    return uniqueSorted(vehicles.map((vehicle) => vehicle.model));
  },
});

export const listColors = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const vehicles = await takeFloorVehicles(ctx, 200);
    return uniqueSorted(vehicles.map((vehicle) => vehicle.exteriorColor));
  },
});

export const filterBounds = query({
  args: {},
  returns: v.object({
    minPrice: v.number(),
    maxPrice: v.number(),
    minYear: v.number(),
    maxYear: v.number(),
    maxMileage: v.number(),
    makes: v.array(v.string()),
    models: v.array(
      v.object({
        make: v.string(),
        model: v.string(),
      }),
    ),
    colors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const vehicles = await takeFloorVehicles(ctx, 200);

    if (vehicles.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 25000,
        minYear: 2010,
        maxYear: 2026,
        maxMileage: 200000,
        makes: [],
        models: [],
        colors: [],
      };
    }

    const first = vehicles[0];
    if (!first) {
      return {
        minPrice: 0,
        maxPrice: 25000,
        minYear: 2010,
        maxYear: 2026,
        maxMileage: 200000,
        makes: [],
        models: [],
        colors: [],
      };
    }

    let minPrice = first.priceOmr;
    let maxPrice = first.priceOmr;
    let minYear = first.year;
    let maxYear = first.year;
    let maxMileage = first.mileageKm;
    for (const vehicle of vehicles) {
      minPrice = Math.min(minPrice, vehicle.priceOmr);
      maxPrice = Math.max(maxPrice, vehicle.priceOmr);
      minYear = Math.min(minYear, vehicle.year);
      maxYear = Math.max(maxYear, vehicle.year);
      maxMileage = Math.max(maxMileage, vehicle.mileageKm);
    }

    const roundedMin = Math.max(0, Math.floor(minPrice / 500) * 500);
    const roundedMax = Math.max(Math.ceil(maxPrice / 500) * 500, roundedMin + 500);
    const models = uniqueSorted(
      vehicles.map((vehicle) => `${vehicle.make}\u0000${vehicle.model}`),
    ).map((entry) => {
      const [make, model] = entry.split("\u0000");
      return { make: make ?? "", model: model ?? "" };
    });

    return {
      minPrice: roundedMin,
      maxPrice: roundedMax,
      minYear,
      maxYear: Math.max(maxYear, minYear),
      maxMileage: Math.max(Math.ceil(maxMileage / 1000) * 1000, 1000),
      makes: uniqueSorted(vehicles.map((vehicle) => vehicle.make)),
      models,
      colors: uniqueSorted(vehicles.map((vehicle) => vehicle.exteriorColor)),
    };
  },
});
