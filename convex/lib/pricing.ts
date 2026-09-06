export const PRICE_MODES = ["buy", "request", "finance"] as const;
export type PriceMode = (typeof PRICE_MODES)[number];

export function resolvePriceMode(value?: string): PriceMode {
  if (value === "request" || value === "finance") {
    return value;
  }
  return "buy";
}

export function pricingReady(vehicle: {
  priceMode?: string;
  priceOmr: number;
  financeMonthlyOmr?: number;
}): boolean {
  const mode = resolvePriceMode(vehicle.priceMode);
  if (mode === "request") {
    return true;
  }
  if (mode === "finance") {
    return (vehicle.financeMonthlyOmr ?? 0) > 0;
  }
  return vehicle.priceOmr > 0;
}

export function pricingBlocker(vehicle: {
  priceMode?: string;
  priceOmr: number;
  financeMonthlyOmr?: number;
}): string | null {
  if (pricingReady(vehicle)) {
    return null;
  }
  return resolvePriceMode(vehicle.priceMode) === "finance"
    ? "finance_price_required"
    : "price_required";
}

export function comparableBuyPrice(vehicle: {
  priceMode?: string;
  priceOmr: number;
}): number | null {
  return resolvePriceMode(vehicle.priceMode) === "buy" && vehicle.priceOmr > 0
    ? vehicle.priceOmr
    : null;
}

export function canBookPricedVehicle(vehicle: {
  priceMode?: string;
  priceOmr: number;
}): boolean {
  return comparableBuyPrice(vehicle) !== null;
}
