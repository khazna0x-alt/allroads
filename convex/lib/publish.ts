import type { Doc } from "../_generated/dataModel";
import {
  isPublicFloorStatus,
  mapLegacyVehicleStatus,
  type PublicFloorStatus,
} from "./vehicleStatus";

export type PublishGateInput = {
  status: Doc<"vehicles">["status"];
  publicHidden?: boolean;
  publishGrandfathered?: boolean;
};

export type PublishCheck = {
  ok: boolean;
  grandfathered: boolean;
  reasons: string[];
};

export function isPublicHidden(vehicle: { publicHidden?: boolean; status: string }): boolean {
  return vehicle.publicHidden === true || vehicle.status === "hidden";
}

export function isOnPublicFloor(vehicle: {
  status: string;
  publicHidden?: boolean;
}): boolean {
  if (isPublicHidden(vehicle)) {
    return false;
  }
  return isPublicFloorStatus(vehicle.status);
}

export function publicFloorStatus(vehicle: {
  status: string;
  publicHidden?: boolean;
}): PublicFloorStatus | null {
  if (!isOnPublicFloor(vehicle)) {
    return null;
  }
  const mapped = mapLegacyVehicleStatus(vehicle.status);
  if (mapped === "published" || mapped === "reserved" || mapped === "booked") {
    return mapped;
  }
  return null;
}

export function canPublish(vehicle: PublishGateInput, photoCount: number): PublishCheck {
  const reasons: string[] = [];
  if (isPublicHidden(vehicle)) {
    reasons.push("public_hidden");
  }
  if (photoCount < 1) {
    reasons.push("photos_required");
  }
  return {
    ok: reasons.length === 0,
    grandfathered: vehicle.publishGrandfathered === true,
    reasons,
  };
}
