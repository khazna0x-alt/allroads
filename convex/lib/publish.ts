import type { Doc } from "../_generated/dataModel";
import {
  isPublicFloorStatus,
  mapLegacyVehicleStatus,
  type PublicFloorStatus,
} from "./vehicleStatus";

export type PublishGateInput = {
  status: Doc<"vehicles">["status"];
  publicHidden?: boolean;
  onSiteConfirmed?: boolean;
  priceOmr: number;
  vin?: string;
  contractStatus?: Doc<"vehicles">["contractStatus"];
  contractEndsAt?: number;
  contractStorageId?: Doc<"vehicles">["contractStorageId"];
  publishGrandfathered?: boolean;
};

export type InspectionGateInput = {
  verdict?: Doc<"inspections">["verdict"];
  chassisMatchesDocs?: boolean;
} | null;

export type PublishCheck = {
  ok: boolean;
  grandfathered: boolean;
  reasons: string[];
};

const ACCEPTED_VERDICTS = new Set(["accepted", "accepted_with_notes"]);

export function isPublicHidden(vehicle: { publicHidden?: boolean; status: string }): boolean {
  return vehicle.publicHidden === true || vehicle.status === "hidden";
}

export function isOnPublicFloor(vehicle: {
  status: string;
  publicHidden?: boolean;
  onSiteConfirmed?: boolean;
  publishGrandfathered?: boolean;
}): boolean {
  if (isPublicHidden(vehicle)) {
    return false;
  }
  if (!isPublicFloorStatus(vehicle.status)) {
    return false;
  }
  if (vehicle.publishGrandfathered === true || vehicle.onSiteConfirmed === true) {
    return true;
  }
  return vehicle.onSiteConfirmed !== false;
}

export function publicFloorStatus(vehicle: {
  status: string;
  publicHidden?: boolean;
  onSiteConfirmed?: boolean;
  publishGrandfathered?: boolean;
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

export function canPublish(
  vehicle: PublishGateInput,
  inspection: InspectionGateInput,
  now?: number,
): PublishCheck {
  if (vehicle.publishGrandfathered === true) {
    return { ok: true, grandfathered: true, reasons: [] };
  }

  const reasons: string[] = [];
  if (isPublicHidden(vehicle)) {
    reasons.push("public_hidden");
  }
  if (vehicle.onSiteConfirmed !== true) {
    reasons.push("not_on_site");
  }
  if (!(vehicle.priceOmr > 0)) {
    reasons.push("price_required");
  }
  const vin = vehicle.vin?.trim();
  if (!vin) {
    reasons.push("vin_required");
  }
  if (vehicle.contractStatus === "expired") {
    reasons.push("contract_expired");
  } else if (vehicle.contractStatus !== "signed") {
    reasons.push("contract_not_signed");
  } else if (!vehicle.contractStorageId) {
    reasons.push("contract_file_missing");
  } else if (
    now !== undefined &&
    vehicle.contractEndsAt !== undefined &&
    vehicle.contractEndsAt < now
  ) {
    reasons.push("contract_expired");
  }
  if (!inspection || !inspection.verdict || !ACCEPTED_VERDICTS.has(inspection.verdict)) {
    reasons.push("inspection_not_accepted");
  } else if (inspection.chassisMatchesDocs !== true) {
    reasons.push("chassis_mismatch");
  }

  return { ok: reasons.length === 0, grandfathered: false, reasons };
}
