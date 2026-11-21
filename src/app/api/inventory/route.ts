import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/lib/convex";
import { inventoryByStockCodeResponse, resolveStockCode, toInventoryVehicle } from "@/lib/inventoryApi";

export const dynamic = "force-dynamic";

/**
 * Published inventory feed, or one car when `stockCode` is a query parameter.
 * DM Champ custom functions send GET inputs as `?stockCode=`, not as a `{stockCode}` path.
 */
export async function GET(request: Request) {
  const stockCode = resolveStockCode(request);
  if (stockCode) {
    return inventoryByStockCodeResponse(stockCode);
  }

  const vehicles = (await fetchQuery(api.public.listPublishedFeed, {})).filter(
    (vehicle) => vehicle.status === "published",
  );

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      count: vehicles.length,
      vehicles: vehicles.map((vehicle) => toInventoryVehicle(vehicle)),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
