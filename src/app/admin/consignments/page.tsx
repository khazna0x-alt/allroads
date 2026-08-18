"use client";

import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { ContractDesk } from "@/components/admin/ContractDesk";
import { InspectionForm } from "@/components/admin/InspectionForm";
import { OwnerDeskActions } from "@/components/admin/OwnerDeskActions";
import {
  DeskTime,
  EmptyState,
  GoldRule,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { BlankConsignmentFormLink } from "@/components/admin/ContractUploader";
import { api } from "@/lib/convex";
import { displayVehicleTitle } from "@/lib/format";

export default function ConsignmentsPage() {
  const t = useTranslations("Admin.consignments");
  const locale = useLocale();
  const queue = useQuery(api.vehicles.listQueue);

  return (
    <div>
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        lead={t("lead")}
        actions={<BlankConsignmentFormLink />}
      />
      <GoldRule />
      <div className="mt-8 space-y-6">
        {(queue ?? []).map((vehicle) => (
          <article key={vehicle._id} className="admin-card space-y-5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs tracking-[0.14em] text-[var(--sand)] uppercase">{vehicle.stockCode}</p>
                  <StatusBadge value={vehicle.status} />
                </div>
                <h2 className="font-display mt-1 text-2xl break-words">
                  {displayVehicleTitle(vehicle, locale)}
                </h2>
                <p className="mt-2 text-sm text-[var(--ivory-dim)]">
                  {t("owner", { name: vehicle.ownerName ?? "", phone: vehicle.ownerPhone ?? "" })}
                </p>
                <p className="mt-1 text-xs text-[var(--ivory-dim)]">
                  <DeskTime value={vehicle.createdAt} />
                </p>
                {vehicle.ownerNotes ? (
                  <p className="mt-3 max-w-2xl text-sm text-pretty">{vehicle.ownerNotes}</p>
                ) : null}
              </div>
            </div>
            <OwnerDeskActions vehicle={vehicle} />
            <ContractDesk
              vehicleId={vehicle._id}
              contractStatus={vehicle.contractStatus}
              contractStartsAt={vehicle.contractStartsAt}
              contractEndsAt={vehicle.contractEndsAt}
              contractUrl={vehicle.contractUrl}
              contractFileName={vehicle.contractFileName}
            />
            <details className="border border-[var(--line)] p-4">
              <summary className="cursor-pointer text-sm tracking-[0.12em] text-[var(--sand)] uppercase">
                {t("inspectionToggle")}
              </summary>
              <div className="mt-4">
                <InspectionForm vehicleId={vehicle._id} />
              </div>
            </details>
          </article>
        ))}
        {queue?.length === 0 ? <EmptyState title={t("empty")} body={t("lead")} /> : null}
      </div>
    </div>
  );
}
