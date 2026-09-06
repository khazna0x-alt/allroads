import { formatOmr } from "./format";

export type PriceMode = "buy" | "request" | "finance";

export function resolvePriceMode(value?: string): PriceMode {
  if (value === "request" || value === "finance") {
    return value;
  }
  return "buy";
}

export function formatVehiclePrice(
  vehicle: {
    priceMode?: string;
    priceOmr: number;
    financeMonthlyOmr?: number;
  },
  locale: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const mode = resolvePriceMode(vehicle.priceMode);
  if (mode === "request") {
    return t("requestPrice");
  }
  if (mode === "finance") {
    return t("financeMonthly", { price: formatOmr(vehicle.financeMonthlyOmr ?? 0, locale) });
  }
  return formatOmr(vehicle.priceOmr, locale);
}

export function formatStaffVehiclePrice(
  vehicle: {
    priceMode?: string;
    priceOmr: number;
    financeMonthlyOmr?: number;
  },
  locale: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const mode = resolvePriceMode(vehicle.priceMode);
  if (mode === "request") {
    return t("priceModes.request");
  }
  if (mode === "finance") {
    return t("priceModes.financeValue", {
      price: formatOmr(vehicle.financeMonthlyOmr ?? 0, locale),
    });
  }
  return formatOmr(vehicle.priceOmr, locale);
}
