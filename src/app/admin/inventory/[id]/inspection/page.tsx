"use client";

import { Suspense, use } from "react";
import { useTranslations } from "next-intl";
import { InspectionReport } from "@/components/admin/InspectionReport";
import { AdminButton, GoldRule, PageHeader } from "@/components/admin/ui";
import type { Id } from "@/lib/convex";

export default function InspectionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--ivory-dim)]">…</p>}>
      <InspectionPrintDesk params={params} />
    </Suspense>
  );
}

function InspectionPrintDesk({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("Admin");
  const { id } = use(params);
  const vehicleId = id as Id<"vehicles">;

  return (
    <div className="inspection-print-page">
      <div className="print:hidden">
        <PageHeader
          kicker={t("inspection.reportKicker")}
          title={t("inspection.reportTitle")}
          back={
            <AdminButton href={`/admin/inventory/${vehicleId}`} variant="ghost">
              {t("inventory.back")}
            </AdminButton>
          }
        />
        <GoldRule className="mb-8 mt-6" />
      </div>
      <InspectionReport vehicleId={vehicleId} />
    </div>
  );
}
