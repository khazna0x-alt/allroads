import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/lib/convex";

export const dynamic = "force-dynamic";

export async function GET() {
  const vehicles = await fetchQuery(api.public.listPublishedFeed, {});
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://allroads.om";

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      count: vehicles.length,
      vehicles: vehicles.map((vehicle) => ({
        stockCode: vehicle.stockCode,
        slug: vehicle.slug,
        url: `${site}/inventory/${vehicle.slug}`,
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
        photos: vehicle.photos.map((photo) => photo.url),
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
