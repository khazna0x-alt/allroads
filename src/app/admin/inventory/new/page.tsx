"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { VehicleForm } from "@/components/admin/VehicleForm";
import { AdminButton, GoldRule, PageHeader, staffInventoryPath } from "@/components/admin/ui";

export default function NewVehiclePage() {
  return (
    <Suspense fallback={<NewFallback />}>
      <NewVehicleDesk />
    </Suspense>
  );
}

function NewFallback() {
  const t = useTranslations("Admin.inventory");
  return <p className="text-sm text-[var(--ivory-dim)]">{t("loading")}</p>;
}

function NewVehicleDesk() {
  const t = useTranslations("Admin.inventory");
  const searchParams = useSearchParams();
  const backHref = staffInventoryPath(searchParams.get("status"));

  return (
    <div>
      <PageHeader
        kicker={t("title")}
        title={t("add")}
        back={
          <AdminButton href={backHref} variant="ghost">
            {t("back")}
          </AdminButton>
        }
      />
      <GoldRule className="mb-8 mt-6" />
      <VehicleForm />
    </div>
  );
}
