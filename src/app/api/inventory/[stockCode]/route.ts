import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/lib/convex";

export const dynamic = "force-dynamic";

/** Public floor lookup. Includes reserved/booked with `status` so chat on those pages does not treat them as available. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ stockCode: string }> },
) {
  const { stockCode } = await context.params;
  const vehicle = await fetchQuery(api.public.getPublishedByStockCode, {
    stockCode,
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://allroads.om";
  return NextResponse.json({
    stockCode: vehicle.stockCode,
    slug: vehicle.slug,
    url: `${site}/inventory/${vehicle.slug}`,
    status: vehicle.status,
    titleEn: vehicle.titleEn,
    titleAr: vehicle.titleAr,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    trim: vehicle.trim ?? null,
    priceOmr: vehicle.priceOmr,
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
    descriptionEn: vehicle.descriptionEn,
    descriptionAr: vehicle.descriptionAr,
    photos: vehicle.photos.map((photo) => photo.url),
  });
}
