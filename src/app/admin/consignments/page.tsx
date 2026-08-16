"use client";

import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import {
  AdminButton,
  DeskTime,
  EmptyState,
  GoldRule,
  PageHeader,
} from "@/components/admin/ui";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { BlankConsignmentFormLink, ContractUploader } from "@/components/admin/ContractUploader";
import { api } from "@/lib/convex";
import { displayVehicleTitle } from "@/lib/format";

export default function ConsignmentsPage() {
  const t = useTranslations("Admin.consignments");
  const tConfirm = useTranslations("Admin.confirm");
  const locale = useLocale();
  const confirm = useConfirmDialog();
  const queue = useQuery(api.vehicles.listQueue);
  const setStatus = useMutation(api.vehicles.setStatus);

  return (
    <div>
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        lead={t("lead")}
        actions={<BlankConsignmentFormLink />}
      />
      <GoldRule />
      <div className="mt-8 space-y-4">
        {(queue ?? []).map((vehicle) => (
          <article key={vehicle._id} className="admin-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs tracking-[0.14em] text-[var(--sand)] uppercase">{vehicle.stockCode}</p>
                <h2 className="font-display mt-1 text-2xl break-words">
                  {displayVehicleTitle(vehicle, locale)}
                </h2>
                <p className="mt-2 text-sm text-[var(--ivory-dim)]">
                  {t("owner", { name: vehicle.ownerName ?? "", phone: vehicle.ownerPhone ?? "" })}
                </p>
                <p className="mt-1 text-xs text-[var(--ivory-dim)]">
                  <DeskTime value={vehicle.createdAt} />
                </p>
                {vehicle.ownerNotes ? <p className="mt-3 max-w-2xl text-sm text-pretty">{vehicle.ownerNotes}</p> : null}
                <ContractUploader
                  vehicleId={vehicle._id}
                  contractUrl={vehicle.contractUrl}
                  contractFileName={vehicle.contractFileName}
                />
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <AdminButton onClick={() => void setStatus({ vehicleId: vehicle._id, status: "draft" })}>
                  {t("approveDraft")}
                </AdminButton>
                <AdminButton
                  variant="primary"
                  onClick={() => void setStatus({ vehicleId: vehicle._id, status: "published" })}
                >
                  {t("publish")}
                </AdminButton>
                <AdminButton
                  variant="danger"
                  onClick={() => {
                    void confirm({
                      title: tConfirm("rejectTitle"),
                      message: tConfirm("reject"),
                      confirmLabel: t("reject"),
                      cancelLabel: tConfirm("cancel"),
                      tone: "danger",
                    }).then((ok) => {
                      if (ok) {
                        void setStatus({ vehicleId: vehicle._id, status: "rejected" });
                      }
                    });
                  }}
                >
                  {t("reject")}
                </AdminButton>
                <AdminButton href={`/admin/inventory/${vehicle._id}`} variant="ghost">
                  {t("edit")}
                </AdminButton>
              </div>
            </div>
          </article>
        ))}
        {queue?.length === 0 ? <EmptyState title={t("empty")} body={t("lead")} /> : null}
      </div>
    </div>
  );
}
