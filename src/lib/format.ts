import { resolveArabicTitle } from "./vehicleCopy";

export function formatOmr(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    style: "currency",
    currency: "OMR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKm(value: number, locale: string): string {
  const amount = new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM").format(value);
  return locale === "ar" ? `${amount} كم` : `${amount} km`;
}

export function formatDate(value: number, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function cylindersFromEngine(engine?: string): number | undefined {
  if (!engine) {
    return undefined;
  }
  const labeled = engine.match(/(\d+)\s*(?:cyl|cylinders?|سلندر)/i);
  if (labeled) {
    const count = Number(labeled[1]);
    return Number.isFinite(count) ? count : undefined;
  }
  const vee = engine.match(/\bV(\d+)\b/i);
  if (vee) {
    const count = Number(vee[1]);
    return Number.isFinite(count) ? count : undefined;
  }
  return undefined;
}

export function displayVehicleTitle(
  vehicle: {
    titleAr?: string;
    titleEn?: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
  },
  locale: string,
): string {
  if (locale === "ar") {
    return resolveArabicTitle({ ...vehicle, titleAr: vehicle.titleAr ?? "" });
  }
  return vehicle.titleEn || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

export function displayStaffIdentifier(email?: string, phone?: string): string {
  const raw = (email ?? phone ?? "").trim();
  if (raw.startsWith("+968")) {
    return raw.slice(4);
  }
  if (/^968\d{8}$/.test(raw)) {
    return raw.slice(3);
  }
  return raw;
}

export function generateDeskPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => chars[byte % chars.length] ?? "A").join("");
}
