import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function scheduleQrSync(ctx: MutationCtx, vehicleId: Id<"vehicles">) {
  await ctx.scheduler.runAfter(0, internal.elkqr.syncVehicleQr, { vehicleId });
}

export async function scheduleQrDelete(
  ctx: MutationCtx,
  args: { elkqrId?: string; storageId?: Id<"_storage"> },
) {
  if (!args.elkqrId && !args.storageId) {
    return;
  }
  await ctx.scheduler.runAfter(0, internal.elkqr.deleteExternalQr, {
    elkqrId: args.elkqrId,
    storageId: args.storageId,
  });
}
