import type { Infer } from "convex/values";
import {
  publicFloorStatusValidator,
  storedVehicleStatusValidator,
  vehicleStatusValidator,
} from "./validators";

export type VehicleStatus = Infer<typeof vehicleStatusValidator>;
export type StoredVehicleStatus = Infer<typeof storedVehicleStatusValidator>;
export type PublicFloorStatus = Infer<typeof publicFloorStatusValidator>;

export const VEHICLE_STATUSES: readonly VehicleStatus[] = [
  "new",
  "under_review",
  "inspection_scheduled",
  "under_inspection",
  "awaiting_contract",
  "approved",
  "not_accepted",
  "approved_for_publishing",
  "published",
  "reserved",
  "booked",
  "sold",
  "withdrawn",
  "expired",
];

export const QUEUE_STATUSES: readonly VehicleStatus[] = ["new", "under_review"];

export const OWNER_DESK_STATUSES: readonly VehicleStatus[] = [
  "new",
  "under_review",
  "inspection_scheduled",
  "under_inspection",
  "awaiting_contract",
  "approved",
  "approved_for_publishing",
];

export const PUBLIC_FLOOR_STATUSES: readonly PublicFloorStatus[] = [
  "published",
  "reserved",
  "booked",
];

const VEHICLE_STATUS_SET = new Set<string>(VEHICLE_STATUSES);
const PUBLIC_FLOOR_SET = new Set<string>(PUBLIC_FLOOR_STATUSES);

export function mapLegacyVehicleStatus(status: StoredVehicleStatus | string): VehicleStatus {
  switch (status) {
    case "pending_review":
      return "under_review";
    case "draft":
      return "approved";
    case "rejected":
      return "not_accepted";
    case "hidden":
      return "withdrawn";
    default:
      if (VEHICLE_STATUS_SET.has(status)) {
        return status as VehicleStatus;
      }
      return "under_review";
  }
}

export function isPublicFloorStatus(
  status: StoredVehicleStatus | VehicleStatus | string,
): status is PublicFloorStatus {
  return PUBLIC_FLOOR_SET.has(mapLegacyVehicleStatus(status));
}

export function isQueueStatus(status: StoredVehicleStatus | VehicleStatus | string): boolean {
  const mapped = mapLegacyVehicleStatus(status);
  return mapped === "new" || mapped === "under_review";
}

export function requiresStatusReason(status: VehicleStatus): boolean {
  return status === "not_accepted" || status === "withdrawn";
}
