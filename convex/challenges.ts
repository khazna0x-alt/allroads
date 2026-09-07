import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { issueFormChallenge } from "./lib/formChallenge";
import { consumeRateLimit, HOUR_MS } from "./lib/rateLimit";

export const issue = mutation({
  args: {},
  returns: v.object({
    challengeId: v.id("formChallenges"),
    a: v.number(),
    b: v.number(),
  }),
  handler: async (ctx) => {
    await consumeRateLimit(ctx, "challenge:issue", 200, HOUR_MS);
    return await issueFormChallenge(ctx);
  },
});

export const sweepExpired = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("formChallenges")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .take(100);
    for (const row of expired) {
      await ctx.db.delete("formChallenges", row._id);
    }
    return null;
  },
});
