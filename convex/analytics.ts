import { v } from "convex/values";
import { authedQuery } from "./lib/customFunctions";
import { resolvePriceMode } from "./lib/pricing";
import { isOnPublicFloor } from "./lib/publish";
import { QUEUE_STATUSES } from "./lib/vehicleStatus";

const DAY_MS = 24 * 60 * 60 * 1000;
const SERIES_DAYS = 14;
const FLOOR_CAP = 200;

const dayCountValidator = v.object({
  day: v.string(),
  count: v.number(),
});

const namedCountValidator = v.object({
  key: v.string(),
  count: v.number(),
});

export const deskAnalytics = authedQuery({
  args: { now: v.number() },
  returns: v.object({
    floorValueOmr: v.number(),
    pricedOnFloor: v.number(),
    requestOnFloor: v.number(),
    financeOnFloor: v.number(),
    inquiries30d: v.number(),
    bookings30d: v.number(),
    soldCount: v.number(),
    closedInquiries: v.number(),
    inquirySeries: v.array(dayCountValidator),
    bookingSeries: v.array(dayCountValidator),
    inquirySources: v.array(namedCountValidator),
    makesOnFloor: v.array(namedCountValidator),
    pipeline: v.object({
      queue: v.number(),
      ready: v.number(),
      floor: v.number(),
      sold: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const now = args.now;
    const start14 = startOfUtcDay(now - (SERIES_DAYS - 1) * DAY_MS);
    const start30 = now - 30 * DAY_MS;

    const inquiryDays = emptySeries(start14, SERIES_DAYS);
    const bookingDays = emptySeries(start14, SERIES_DAYS);
    const inquirySources = new Map<string, number>();
    let inquiries30d = 0;
    let closedInquiries = 0;

    const recentInquiries = await ctx.db.query("inquiries").withIndex("by_created").order("desc").take(300);
    for (const inquiry of recentInquiries) {
      if (inquiry.createdAt >= start30) {
        inquiries30d += 1;
      }
      if (inquiry.status === "closed" || inquiry.status === "sold" || inquiry.status === "booked") {
        closedInquiries += 1;
      }
      bumpDay(inquiryDays, inquiry.createdAt, start14, now);
      inquirySources.set(inquiry.source, (inquirySources.get(inquiry.source) ?? 0) + 1);
    }

    let bookings30d = 0;
    const recentBookings = await ctx.db.query("bookings").withIndex("by_created").order("desc").take(300);
    for (const booking of recentBookings) {
      if (booking.createdAt >= start30) {
        bookings30d += 1;
      }
      bumpDay(bookingDays, booking.createdAt, start14, now);
    }

    const floorStatuses = ["published", "reserved", "booked"] as const;
    const floorRows = (
      await Promise.all(
        floorStatuses.map((status) =>
          ctx.db.query("vehicles").withIndex("by_status", (q) => q.eq("status", status)).take(FLOOR_CAP),
        ),
      )
    )
      .flat()
      .filter(isOnPublicFloor);

    let floorValueOmr = 0;
    let pricedOnFloor = 0;
    let requestOnFloor = 0;
    let financeOnFloor = 0;
    const makes = new Map<string, number>();
    for (const vehicle of floorRows) {
      const mode = resolvePriceMode(vehicle.priceMode);
      if (mode === "buy") {
        pricedOnFloor += 1;
        floorValueOmr += vehicle.priceOmr;
      } else if (mode === "request") {
        requestOnFloor += 1;
      } else {
        financeOnFloor += 1;
      }
      makes.set(vehicle.make, (makes.get(vehicle.make) ?? 0) + 1);
    }

    const sold = await ctx.db.query("vehicles").withIndex("by_status", (q) => q.eq("status", "sold")).take(FLOOR_CAP);
    const approved = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "approved_for_publishing"))
      .take(FLOOR_CAP);
    const queuePages = await Promise.all(
      QUEUE_STATUSES.map((status) =>
        ctx.db.query("vehicles").withIndex("by_status", (q) => q.eq("status", status)).take(FLOOR_CAP),
      ),
    );

    return {
      floorValueOmr,
      pricedOnFloor,
      requestOnFloor,
      financeOnFloor,
      inquiries30d,
      bookings30d,
      soldCount: sold.length,
      closedInquiries,
      inquirySeries: toSeries(inquiryDays, start14, SERIES_DAYS),
      bookingSeries: toSeries(bookingDays, start14, SERIES_DAYS),
      inquirySources: [...inquirySources.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 6)
        .map(([key, count]) => ({ key, count })),
      makesOnFloor: [...makes.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8)
        .map(([key, count]) => ({ key, count })),
      pipeline: {
        queue: queuePages.flat().length,
        ready: approved.length,
        floor: floorRows.length,
        sold: sold.length,
      },
    };
  },
});

function startOfUtcDay(value: number) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function emptySeries(start: number, days: number) {
  const map = new Map<string, number>();
  for (let index = 0; index < days; index += 1) {
    map.set(dayKey(start + index * DAY_MS), 0);
  }
  return map;
}

function bumpDay(map: Map<string, number>, createdAt: number, start: number, now: number) {
  if (createdAt < start || createdAt > now) {
    return;
  }
  const key = dayKey(startOfUtcDay(createdAt));
  if (map.has(key)) {
    map.set(key, (map.get(key) ?? 0) + 1);
  }
}

function toSeries(map: Map<string, number>, start: number, days: number) {
  const rows = [];
  for (let index = 0; index < days; index += 1) {
    const day = dayKey(start + index * DAY_MS);
    rows.push({ day, count: map.get(day) ?? 0 });
  }
  return rows;
}

function dayKey(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}
