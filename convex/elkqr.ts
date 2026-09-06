import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { authedAction, authedQuery } from "./lib/customFunctions";
import { isOnPublicFloor } from "./lib/publish";

const LISTING_ORIGIN = "https://allroads.om";

const qrStateValidator = v.object({
  configured: v.boolean(),
  listed: v.boolean(),
  elkqrId: v.optional(v.string()),
  scanUrl: v.optional(v.string()),
  imageUrl: v.union(v.string(), v.null()),
  targetUrl: v.optional(v.string()),
});

function listingUrl(slug: string) {
  const origin = (
    process.env.QR_TARGET_ORIGIN ??
    process.env.ELKQR_TARGET_ORIGIN ??
    LISTING_ORIGIN
  ).replace(/\/$/, "");
  return `${origin}/inventory/${slug}`;
}

export const getVehicleQrState = internalQuery({
  args: { vehicleId: v.id("vehicles") },
  returns: v.union(
    v.object({
      vehicleId: v.id("vehicles"),
      listed: v.boolean(),
      slug: v.string(),
      stockCode: v.string(),
      year: v.number(),
      make: v.string(),
      elkqrId: v.optional(v.string()),
      elkqrScanUrl: v.optional(v.string()),
      elkqrTargetUrl: v.optional(v.string()),
      elkqrImageStorageId: v.optional(v.id("_storage")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      return null;
    }
    return {
      vehicleId: vehicle._id,
      listed: isOnPublicFloor(vehicle),
      slug: vehicle.slug,
      stockCode: vehicle.stockCode,
      year: vehicle.year,
      make: vehicle.make,
      elkqrId: vehicle.elkqrId,
      elkqrScanUrl: vehicle.elkqrScanUrl,
      elkqrTargetUrl: vehicle.elkqrTargetUrl,
      elkqrImageStorageId: vehicle.elkqrImageStorageId,
    };
  },
});

export const saveVehicleQr = internalMutation({
  args: {
    vehicleId: v.id("vehicles"),
    elkqrId: v.string(),
    elkqrScanUrl: v.string(),
    elkqrTargetUrl: v.string(),
    elkqrImageStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      return null;
    }
    if (
      vehicle.elkqrImageStorageId &&
      args.elkqrImageStorageId &&
      vehicle.elkqrImageStorageId !== args.elkqrImageStorageId
    ) {
      await ctx.storage.delete(vehicle.elkqrImageStorageId);
    }
    await ctx.db.patch("vehicles", args.vehicleId, {
      elkqrId: args.elkqrId,
      elkqrScanUrl: args.elkqrScanUrl,
      elkqrTargetUrl: args.elkqrTargetUrl,
      elkqrImageStorageId: args.elkqrImageStorageId ?? vehicle.elkqrImageStorageId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const clearVehicleQr = internalMutation({
  args: {
    vehicleId: v.id("vehicles"),
    deleteStorage: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      return null;
    }
    if (args.deleteStorage !== false && vehicle.elkqrImageStorageId) {
      await ctx.storage.delete(vehicle.elkqrImageStorageId);
    }
    await ctx.db.patch("vehicles", args.vehicleId, {
      elkqrId: undefined,
      elkqrScanUrl: undefined,
      elkqrTargetUrl: undefined,
      elkqrImageStorageId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const syncVehicleQr = internalAction({
  args: {
    vehicleId: v.id("vehicles"),
    force: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const state: {
      vehicleId: Id<"vehicles">;
      listed: boolean;
      slug: string;
      stockCode: string;
      year: number;
      make: string;
      elkqrId?: string;
      elkqrScanUrl?: string;
      elkqrTargetUrl?: string;
      elkqrImageStorageId?: Id<"_storage">;
    } | null = await ctx.runQuery(internal.elkqr.getVehicleQrState, {
      vehicleId: args.vehicleId,
    });
    if (!state) {
      return null;
    }

    if (!state.listed) {
      if (state.elkqrId || state.elkqrImageStorageId) {
        await ctx.runAction(internal.elkqr.deleteExternalQr, {
          storageId: state.elkqrImageStorageId,
        });
        await ctx.runMutation(internal.elkqr.clearVehicleQr, {
          vehicleId: args.vehicleId,
          deleteStorage: false,
        });
      }
      return null;
    }

    const targetUrl = listingUrl(state.slug);
    const needsImage = !state.elkqrImageStorageId || args.force === true;
    const targetChanged = state.elkqrTargetUrl !== targetUrl;
    if (state.elkqrId && !needsImage && !targetChanged) {
      return null;
    }

    const pngBase64: string = await ctx.runAction(internal.qrGenerate.renderPng, {
      text: targetUrl,
    });
    const bytes = Uint8Array.from(atob(pngBase64), (char) => char.charCodeAt(0));
    const storageId = await ctx.storage.store(
      new Blob([bytes], { type: "image/png" }),
    );

    await ctx.runMutation(internal.elkqr.saveVehicleQr, {
      vehicleId: args.vehicleId,
      elkqrId: `local:${args.vehicleId}`,
      elkqrScanUrl: targetUrl,
      elkqrTargetUrl: targetUrl,
      elkqrImageStorageId: storageId,
    });
    return null;
  },
});

export const deleteExternalQr = internalAction({
  args: {
    elkqrId: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.storageId) {
      await ctx.storage.delete(args.storageId);
    }
    return null;
  },
});

export const forVehicle = authedQuery({
  args: { vehicleId: v.id("vehicles") },
  returns: qrStateValidator,
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) {
      return {
        configured: true,
        listed: false,
        imageUrl: null,
      };
    }
    return {
      configured: true,
      listed: isOnPublicFloor(vehicle),
      elkqrId: vehicle.elkqrId,
      scanUrl: vehicle.elkqrScanUrl,
      imageUrl: vehicle.elkqrImageStorageId
        ? await ctx.storage.getUrl(vehicle.elkqrImageStorageId)
        : null,
      targetUrl: vehicle.elkqrTargetUrl ?? listingUrl(vehicle.slug),
    };
  },
});

export const refreshVehicleQr = authedAction({
  args: { vehicleId: v.id("vehicles") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.runQuery(internal.staff.requireStaffCaller, {});
    await ctx.runAction(internal.elkqr.syncVehicleQr, {
      vehicleId: args.vehicleId,
      force: true,
    });
    return null;
  },
});

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export const downloadPng = authedAction({
  args: { vehicleId: v.id("vehicles") },
  returns: v.object({
    fileName: v.string(),
    contentType: v.literal("image/png"),
    base64: v.string(),
    scanUrl: v.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    fileName: string;
    contentType: "image/png";
    base64: string;
    scanUrl: string;
  }> => {
    await ctx.runQuery(internal.staff.requireStaffCaller, {});
    await ctx.runAction(internal.elkqr.syncVehicleQr, {
      vehicleId: args.vehicleId,
      force: false,
    });
    const state: {
      vehicleId: Id<"vehicles">;
      listed: boolean;
      slug: string;
      stockCode: string;
      year: number;
      make: string;
      elkqrId?: string;
      elkqrScanUrl?: string;
      elkqrTargetUrl?: string;
      elkqrImageStorageId?: Id<"_storage">;
    } | null = await ctx.runQuery(internal.elkqr.getVehicleQrState, {
      vehicleId: args.vehicleId,
    });
    if (!state?.listed) {
      throw new ConvexError("QR code is only available for listed cars");
    }
    let storageId = state.elkqrImageStorageId;
    if (!storageId) {
      await ctx.runAction(internal.elkqr.syncVehicleQr, {
        vehicleId: args.vehicleId,
        force: true,
      });
      const retry: {
        elkqrImageStorageId?: Id<"_storage">;
        elkqrScanUrl?: string;
      } | null = await ctx.runQuery(internal.elkqr.getVehicleQrState, {
        vehicleId: args.vehicleId,
      });
      storageId = retry?.elkqrImageStorageId;
    }
    if (!storageId) {
      throw new ConvexError("Could not download the QR image");
    }
    const fileUrl = await ctx.storage.getUrl(storageId);
    if (!fileUrl) {
      throw new ConvexError("Could not download the QR image");
    }
    const image = await fetch(fileUrl);
    if (!image.ok) {
      throw new ConvexError("Could not download the QR image");
    }
    const png = new Uint8Array(await image.arrayBuffer());
    return {
      fileName: `${state.stockCode.toLowerCase()}-qr.png`,
      contentType: "image/png" as const,
      base64: bytesToBase64(png),
      scanUrl: state.elkqrScanUrl ?? listingUrl(state.slug),
    };
  },
});
