import { NextResponse } from "next/server";
import { inventoryByStockCodeResponse, resolveStockCode } from "@/lib/inventoryApi";

export const dynamic = "force-dynamic";

/** Public floor lookup. Includes reserved/booked with `status` so chat on those pages does not treat them as available. */
export async function GET(
  request: Request,
  context: { params: Promise<{ stockCode: string }> },
) {
  const { stockCode: pathCode } = await context.params;
  const stockCode = resolveStockCode(request, pathCode);
  if (!stockCode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return inventoryByStockCodeResponse(stockCode);
}
