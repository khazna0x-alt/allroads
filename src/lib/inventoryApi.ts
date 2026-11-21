import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/lib/convex";

type FeedVehicle = {
  stockCode: string;
  slug: string;
  status: string;
  titleEn: string;
  titleAr: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  priceOmr: number;
  priceMode: string;
  financeMonthlyOmr?: number;
  mileageKm: number;
  fuel: string;
  transmission: string;
  drivetrain: string;
  spec: string;
  condition: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  engine?: string;
  features: string[];
  descriptionEn?: string;
  descriptionAr?: string;
  photos: Array<{ url: string }>;
};

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://allroads.om";
}

export function toInventoryVehicle(vehicle: FeedVehicle, extras?: { descriptions?: boolean }) {
  return {
    stockCode: vehicle.stockCode,
    slug: vehicle.slug,
    url: `${siteOrigin()}/inventory/${vehicle.slug}`,
    status: vehicle.status,
    titleEn: vehicle.titleEn,
    titleAr: vehicle.titleAr,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    trim: vehicle.trim ?? null,
    priceOmr: vehicle.priceOmr,
    priceMode: vehicle.priceMode,
    financeMonthlyOmr: vehicle.financeMonthlyOmr ?? null,
    mileageKm: vehicle.mileageKm,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    drivetrain: vehicle.drivetrain,
    spec: vehicle.spec,
    condition: vehicle.condition,
    bodyType: vehicle.bodyType,
    exteriorColor: vehicle.exteriorColor,
    interiorColor: vehicle.interiorColor,
    engine: vehicle.engine ?? null,
    features: vehicle.features,
    ...(extras?.descriptions
      ? {
          descriptionEn: vehicle.descriptionEn,
          descriptionAr: vehicle.descriptionAr,
        }
      : {}),
    photos: vehicle.photos.map((photo) => photo.url),
  };
}

function cleanCode(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function isPlaceholder(value: string) {
  return value === "{stockCode}" || value === ":stockCode";
}

/** Path segment wins. DM Champ sends GET inputs as a query string, not in a body. */
export function resolveStockCode(request: Request, pathCode?: string) {
  const query = cleanCode(new URL(request.url).searchParams.get("stockCode"));
  const path = cleanCode(pathCode);
  if (path && !isPlaceholder(path)) {
    return path;
  }
  return query || null;
}

export async function inventoryByStockCodeResponse(stockCode: string) {
  const vehicle = await fetchQuery(api.public.getPublishedByStockCode, { stockCode });
  if (!vehicle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(toInventoryVehicle(vehicle, { descriptions: true }));
}
