"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { clientPublishLock, PublishLockNote, publishLockTitle } from "@/components/admin/PublishLock";
import { AdminButton, AdminTextarea } from "@/components/admin/ui";
import { api, type Id } from "@/lib/convex";

type DeskVehicle = {
  _id: Id<"vehicles">;
  status: string;
  publishReady: boolean;
  publishBlockers: string[];
  publishGrandfathered?: boolean;
  onSiteConfirmed: boolean;
  contractEndsAt?: number;
  staffNotes?: string;
};

export function OwnerDeskActions({
  vehicle,
  showNotes = true,
  showEditLink = true,
}: {
  vehicle: DeskVehicle;
  showNotes?: boolean;
  showEditLink?: boolean;
}) {
  const t = useTranslations("Admin");
  const confirm = useConfirmDialog();
  const setStatus = useMutation(api.vehicles.setStatus);
  const patchNotes = useMutation(api.vehicles.patchStaffNotes);
  const [notesError, setNotesError] = useState("");
  const lock = clientPublishLock(vehicle);
  const approveTitle = lock.ready
    ? undefined
    : publishLockTitle(lock.blockers, (key) => t(`publishBlockers.${key}`));
  const inPipeline =
    vehicle.status === "new" ||
    vehicle.status === "under_review" ||
    vehicle.status === "inspection_scheduled" ||
    vehicle.status === "under_inspection" ||
    vehicle.status === "awaiting_contract" ||
    vehicle.status === "approved";

  async function saveNotes(formData: FormData) {
    setNotesError("");
    try {
      await patchNotes({
        vehicleId: vehicle._id,
        staffNotes: String(formData.get("staffNotes") ?? ""),
      });
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : t("inventory.saveFailed"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {vehicle.status === "new" ? (
          <AdminButton onClick={() => void setStatus({ vehicleId: vehicle._id, status: "under_review" })}>
            {t("consignments.startReview")}
          </AdminButton>
        ) : null}
        {vehicle.status === "new" || vehicle.status === "under_review" ? (
          <AdminButton
            onClick={() => void setStatus({ vehicleId: vehicle._id, status: "inspection_scheduled" })}
          >
            {t("consignments.scheduleInspection")}
          </AdminButton>
        ) : null}
        {vehicle.status === "inspection_scheduled" ? (
          <AdminButton
            onClick={() => void setStatus({ vehicleId: vehicle._id, status: "under_inspection" })}
          >
            {t("consignments.startInspection")}
          </AdminButton>
        ) : null}
        {inPipeline ? (
          <AdminButton
            variant="primary"
            disabled={!lock.ready}
            title={approveTitle}
            onClick={() =>
              void setStatus({ vehicleId: vehicle._id, status: "approved_for_publishing" })
            }
          >
            {t("consignments.approveForPublish")}
          </AdminButton>
        ) : null}
        {vehicle.status === "approved_for_publishing" ? (
          <AdminButton
            variant="primary"
            disabled={!lock.ready || !vehicle.onSiteConfirmed}
            title={
              !vehicle.onSiteConfirmed ? t("publishBlockers.not_on_site") : approveTitle
            }
            onClick={() => void setStatus({ vehicleId: vehicle._id, status: "published" })}
          >
            {t("consignments.publish")}
          </AdminButton>
        ) : null}
        {vehicle.status !== "not_accepted" && vehicle.status !== "published" ? (
          <AdminButton
            variant="danger"
            onClick={() => {
              void confirm({
                title: t("confirm.rejectTitle"),
                message: t("confirm.reject"),
                confirmLabel: t("consignments.reject"),
                cancelLabel: t("confirm.cancel"),
                tone: "danger",
                reasonLabel: t("confirm.reasonLabel"),
                reasonRequired: true,
              }).then((result) => {
                if (result.confirmed) {
                  void setStatus({
                    vehicleId: vehicle._id,
                    status: "not_accepted",
                    reason: result.reason,
                  });
                }
              });
            }}
          >
            {t("consignments.reject")}
          </AdminButton>
        ) : null}
        {showEditLink ? (
          <AdminButton href={`/admin/inventory/${vehicle._id}`} variant="ghost">
            {t("consignments.edit")}
          </AdminButton>
        ) : null}
      </div>
      <PublishLockNote ready={lock.ready} blockers={lock.blockers} />
      {showNotes ? (
        <form action={saveNotes} className="space-y-3">
          <AdminTextarea
            name="staffNotes"
            label={t("fields.staffNotes")}
            defaultValue={vehicle.staffNotes}
          />
          {notesError ? (
            <p className="text-sm text-[#f2c4c6]" role="alert">
              {notesError}
            </p>
          ) : null}
          <AdminButton type="submit">{t("consignments.saveNotes")}</AdminButton>
        </form>
      ) : null}
    </div>
  );
}
