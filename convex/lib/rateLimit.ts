import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export async function consumeRateLimit(
  ctx: MutationCtx,
  key: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const now = Date.now();
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();

  if (!existing || now - existing.windowStart >= windowMs) {
    if (existing) {
      await ctx.db.patch("rateLimits", existing._id, {
        windowStart: now,
        count: 1,
      });
    } else {
      await ctx.db.insert("rateLimits", {
        key,
        windowStart: now,
        count: 1,
      });
    }
    return;
  }

  if (existing.count >= limit) {
    throw new ConvexError("Too many attempts. Please wait and try again.");
  }

  await ctx.db.patch("rateLimits", existing._id, {
    count: existing.count + 1,
  });
}
