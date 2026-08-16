import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalQuery, query } from "./_generated/server";
import { getCurrentUser, getCurrentUserOrNull, requireAdmin } from "./lib/auth";
import { adminMutation, authedQuery } from "./lib/customFunctions";
import { displayStaffIdentifier, normalizeIdentifier } from "./lib/identifiers";
import { generatePassword } from "./lib/passwords";
import { countAdmins, deleteStaffUser, toStaffUser } from "./lib/staffUsers";
import { staffRoleValidator, staffUserValidator } from "./lib/validators";

const credentialsReturn = v.object({
  identifier: v.string(),
  password: v.string(),
});

export const me = query({
  args: {},
  returns: v.union(staffUserValidator, v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (user === null) {
      return null;
    }
    return toStaffUser(user);
  },
});

export const list = authedQuery({
  args: {},
  returns: v.array(staffUserValidator),
  handler: async (ctx) => {
    requireAdmin(ctx.user);
    const users = await ctx.db.query("users").take(100);
    const staff: Array<ReturnType<typeof toStaffUser>> = [];
    for (const user of users) {
      if (user.role === "admin" || user.role === "editor") {
        staff.push(toStaffUser(user));
      }
    }
    return staff;
  },
});

export const setRole = adminMutation({
  args: {
    userId: v.id("users"),
    role: staffRoleValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.userId === ctx.user._id) {
      throw new ConvexError("You cannot change your own role");
    }
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }
    if (user.role === "admin" && args.role !== "admin") {
      const admins = await countAdmins(ctx);
      if (admins <= 1) {
        throw new ConvexError("Keep at least one admin");
      }
    }
    await ctx.db.patch("users", args.userId, { role: args.role });
    return null;
  },
});

export const updateStaff = adminMutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    identifier: v.string(),
    role: staffRoleValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }
    if (args.userId === ctx.user._id && args.role !== "admin") {
      throw new ConvexError("You cannot change your own role");
    }
    if (user.role === "admin" && args.role !== "admin") {
      const admins = await countAdmins(ctx);
      if (admins <= 1) {
        throw new ConvexError("Keep at least one admin");
      }
    }

    const parsed = normalizeIdentifier(args.identifier);
    const name = args.name.trim();
    if (name.length < 2) {
      throw new ConvexError("Name must be at least 2 characters");
    }

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", args.userId).eq("provider", "password"),
      )
      .unique();

    if (account && account.providerAccountId !== parsed.accountId) {
      const taken = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", parsed.accountId),
        )
        .unique();
      if (taken) {
        throw new ConvexError("That login is already in use");
      }
      await ctx.db.patch("authAccounts", account._id, { providerAccountId: parsed.accountId });
    }

    await ctx.db.patch("users", args.userId, {
      name,
      email: parsed.email,
      phone: parsed.phone,
      role: args.role,
    });
    return null;
  },
});

export const removeStaff = adminMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.userId === ctx.user._id) {
      throw new ConvexError("You cannot remove your own account");
    }
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }
    if (user.role === "admin") {
      const admins = await countAdmins(ctx);
      if (admins <= 1) {
        throw new ConvexError("Keep at least one admin");
      }
    }
    await deleteStaffUser(ctx, args.userId);
    return null;
  },
});

export const requireAdminCaller = internalQuery({
  args: {},
  returns: staffUserValidator,
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    requireAdmin(user);
    return toStaffUser(user);
  },
});

export const requireStaffCaller = internalQuery({
  args: {},
  returns: staffUserValidator,
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return toStaffUser(user);
  },
});

export const getUserIdentifier = internalQuery({
  args: { userId: v.id("users") },
  returns: v.object({
    accountId: v.string(),
    identifier: v.string(),
    name: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", args.userId).eq("provider", "password"),
      )
      .unique();
    const accountId = account?.providerAccountId ?? user.email ?? user.phone;
    if (!accountId) {
      throw new ConvexError("User has no login identifier");
    }
    return {
      accountId,
      identifier: displayStaffIdentifier(user.email, user.phone) || accountId,
      name: user.name,
    };
  },
});

function resolvePassword(password: string | undefined): string {
  const trimmed = password?.trim() ?? "";
  if (trimmed.length === 0) {
    return generatePassword();
  }
  if (trimmed.length < 8) {
    throw new ConvexError("Password must be at least 8 characters");
  }
  return trimmed;
}

export const createStaff = action({
  args: {
    name: v.string(),
    identifier: v.string(),
    role: staffRoleValidator,
    password: v.optional(v.string()),
  },
  returns: credentialsReturn,
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.staff.requireAdminCaller, {});
    const parsed = normalizeIdentifier(args.identifier);
    const password = resolvePassword(args.password);
    const name = args.name.trim();
    if (name.length < 2) {
      throw new ConvexError("Name must be at least 2 characters");
    }

    await createAccount(ctx, {
      provider: "password",
      account: { id: parsed.accountId, secret: password },
      profile: {
        name,
        email: parsed.email,
        phone: parsed.phone,
        role: args.role,
      },
    });

    return {
      identifier: parsed.accountId,
      password,
    };
  },
});

export const setStaffPassword = action({
  args: {
    userId: v.id("users"),
    password: v.optional(v.string()),
  },
  returns: credentialsReturn,
  handler: async (ctx, args): Promise<{ identifier: string; password: string }> => {
    await ctx.runQuery(internal.staff.requireAdminCaller, {});
    const target: { accountId: string; identifier: string; name?: string } = await ctx.runQuery(
      internal.staff.getUserIdentifier,
      { userId: args.userId },
    );
    const password = resolvePassword(args.password);
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: target.accountId, secret: password },
    });
    return { identifier: target.identifier, password };
  },
});

export const resetPassword = action({
  args: { userId: v.id("users") },
  returns: credentialsReturn,
  handler: async (ctx, args): Promise<{ identifier: string; password: string }> => {
    await ctx.runQuery(internal.staff.requireAdminCaller, {});
    const target: { accountId: string; identifier: string; name?: string } = await ctx.runQuery(
      internal.staff.getUserIdentifier,
      { userId: args.userId },
    );
    const password = generatePassword();
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: target.accountId, secret: password },
    });
    return { identifier: target.identifier, password };
  },
});

export const changePassword = action({
  args: { newPassword: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const caller = await ctx.runQuery(internal.staff.requireStaffCaller, {});
    if (args.newPassword.length < 8) {
      throw new ConvexError("Password must be at least 8 characters");
    }
    const target = await ctx.runQuery(internal.staff.getUserIdentifier, {
      userId: caller._id,
    });
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: target.accountId, secret: args.newPassword },
    });
    return null;
  },
});
