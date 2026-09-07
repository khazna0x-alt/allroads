import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const CHALLENGE_TTL_MS = 30 * 60 * 1000;

export async function issueFormChallenge(
  ctx: MutationCtx,
): Promise<{ challengeId: Id<"formChallenges">; a: number; b: number }> {
  const now = Date.now();
  const expired = await ctx.db
    .query("formChallenges")
    .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
    .take(40);
  for (const row of expired) {
    await ctx.db.delete("formChallenges", row._id);
  }

  const a = 2 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  const challengeId = await ctx.db.insert("formChallenges", {
    sum: a + b,
    expiresAt: now + CHALLENGE_TTL_MS,
    consumed: false,
  });
  return { challengeId, a, b };
}

export async function consumeFormChallenge(
  ctx: MutationCtx,
  challengeId: Id<"formChallenges">,
  answer: number,
): Promise<void> {
  const challenge = await ctx.db.get("formChallenges", challengeId);
  if (!challenge || challenge.consumed || challenge.expiresAt <= Date.now()) {
    throw new ConvexError("Human check expired. Refresh and try again.");
  }
  if (answer !== challenge.sum) {
    throw new ConvexError("Incorrect answer, please try again.");
  }
  await ctx.db.patch("formChallenges", challengeId, { consumed: true });
}
