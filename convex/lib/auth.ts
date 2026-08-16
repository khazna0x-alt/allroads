import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type StaffUser = Doc<"users"> & {
  role: "admin" | "editor";
};

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<StaffUser> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not authenticated");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError("User not found");
  }
  if (user.role !== "admin" && user.role !== "editor") {
    throw new ConvexError("Staff access required");
  }

  return user as StaffUser;
}

export async function getCurrentUserOrNull(
  ctx: QueryCtx | MutationCtx,
): Promise<StaffUser | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  const user = await ctx.db.get(userId);
  if (!user || (user.role !== "admin" && user.role !== "editor")) {
    return null;
  }
  return user as StaffUser;
}

export function requireAdmin(user: StaffUser): void {
  if (user.role !== "admin") {
    throw new ConvexError("Admin access required");
  }
}
