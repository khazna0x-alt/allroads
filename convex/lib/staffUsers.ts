import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { displayStaffIdentifier } from "./identifiers";

export function toStaffUser(user: Doc<"users">) {
  if (user.role !== "admin" && user.role !== "editor") {
    throw new ConvexError("Staff access required");
  }
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    identifier: displayStaffIdentifier(user.email, user.phone),
  };
}

export async function countAdmins(ctx: MutationCtx): Promise<number> {
  const admins = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .take(50);
  return admins.length;
}

export async function deleteStaffUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();

  for (const account of accounts) {
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", account._id))
      .collect();
    for (const code of codes) {
      await ctx.db.delete("authVerificationCodes", code._id);
    }
    await ctx.db.delete("authAccounts", account._id);
  }

  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();

  for (const session of sessions) {
    const tokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const token of tokens) {
      await ctx.db.delete("authRefreshTokens", token._id);
    }
    await ctx.db.delete("authSessions", session._id);
  }

  await ctx.db.delete("users", userId);
}
