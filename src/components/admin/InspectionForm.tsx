"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InspectionPhotos } from "@/components/admin/InspectionPhotos";
import { AdminButton, AdminField, AdminSelect, AdminTextarea, DeskCard } from "@/components/admin/ui";
import { datetimeLocalToMs, msToDatetimeLocal, optNumber, optText } from "@/lib/adminDates";
import { api, type Id } from "@/lib/convex";

const VERDICTS = ["accepted", "accepted_with_notes", "not_accepted"] as const;

export function InspectionForm({
  vehicleId,
}: {
  vehicleId: Id<"vehicles">;
}) {
  const t = useTranslations("Admin");
  const inspection = useQuery(api.inspections.getForVehicle, { vehicleId });
  const save = useMutation(api.inspections.save);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (inspection === undefined) {
    return <p className="text-sm text-[var(--ivory-dim)]">{t("inventory.loading")}</p>;
  }

  async function onSubmit(formData: FormData) {
    const verdictRaw = String(formData.get("verdict") ?? "");
    const verdict = VERDICTS.find((item) => item === verdictRaw);
    setSaving(true);
    setError("");
    try {
      await save({
        vehicleId,
        inspectorName: optText(formData.get("inspectorName")),
        inspectedAt: datetimeLocalToMs(String(formData.get("inspectedAt") ?? "")),
        notes: optText(formData.get("notes")),
        chassisMatchesDocs: formData.get("chassisMatchesDocs") === "on",
        bodyNotes: optText(formData.get("bodyNotes")),
        paintNotes: optText(formData.get("paintNotes")),
        accidentHistory: optText(formData.get("accidentHistory")),
        engineNotes: optText(formData.get("engineNotes")),
        transmissionNotes: optText(formData.get("transmissionNotes")),
        acNotes: optText(formData.get("acNotes")),
        interiorNotes: optText(formData.get("interiorNotes")),
        tiresNotes: optText(formData.get("tiresNotes")),
        actualMileageKm: optNumber(formData.get("actualMileageKm")),
        ownershipReview: optText(formData.get("ownershipReview")),
        verdict,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inspection.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <DeskCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">{t("inspection.title")}</h2>
            <p className="mt-1 text-sm text-[var(--ivory-dim)]">{t("inspection.lead")}</p>
          </div>
          <AdminButton href={`/admin/inventory/${vehicleId}/inspection`} variant="ghost" className="print:hidden">
            {t("inspection.print")}
          </AdminButton>
        </div>
        <form action={onSubmit} className="mt-5 space-y-4">
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <AdminField
              name="inspectorName"
              label={t("inspection.inspectorName")}
              defaultValue={inspection?.inspectorName}
              autoComplete="name"
            />
            <AdminField
              name="inspectedAt"
              label={t("inspection.inspectedAt")}
              type="datetime-local"
              defaultValue={msToDatetimeLocal(inspection?.inspectedAt)}
            />
            <AdminField
              name="actualMileageKm"
              label={t("inspection.actualMileage")}
              type="number"
              inputMode="numeric"
              defaultValue={inspection?.actualMileageKm}
            />
            <AdminSelect
              name="verdict"
              label={t("inspection.verdict")}
              defaultValue={inspection?.verdict ?? ""}
              options={["", ...VERDICTS]}
              formatLabel={(value) => (value ? t(`inspection.verdicts.${value}`) : t("inspection.verdictUnset"))}
            />
            <label className="flex min-h-11 items-center gap-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                name="chassisMatchesDocs"
                defaultChecked={inspection?.chassisMatchesDocs === true}
                className="size-4 accent-[var(--sand)]"
              />
              {t("inspection.chassisMatch")}
            </label>
            <AdminTextarea name="bodyNotes" label={t("inspection.body")} defaultValue={inspection?.bodyNotes} />
            <AdminTextarea name="paintNotes" label={t("inspection.paint")} defaultValue={inspection?.paintNotes} />
            <AdminTextarea
              name="accidentHistory"
              label={t("inspection.accident")}
              defaultValue={inspection?.accidentHistory}
            />
            <AdminTextarea name="engineNotes" label={t("inspection.engine")} defaultValue={inspection?.engineNotes} />
            <AdminTextarea
              name="transmissionNotes"
              label={t("inspection.transmission")}
              defaultValue={inspection?.transmissionNotes}
            />
            <AdminTextarea name="acNotes" label={t("inspection.ac")} defaultValue={inspection?.acNotes} />
            <AdminTextarea
              name="interiorNotes"
              label={t("inspection.interior")}
              defaultValue={inspection?.interiorNotes}
            />
            <AdminTextarea name="tiresNotes" label={t("inspection.tires")} defaultValue={inspection?.tiresNotes} />
            <AdminTextarea
              name="ownershipReview"
              label={t("inspection.ownership")}
              defaultValue={inspection?.ownershipReview}
            />
            <AdminTextarea name="notes" label={t("inspection.notes")} defaultValue={inspection?.notes} />
          </div>
          {error ? (
            <p className="text-sm text-[#f2c4c6]" role="alert">
              {error}
            </p>
          ) : null}
          <AdminButton type="submit" variant="primary" disabled={saving}>
            {t("inspection.save")}
          </AdminButton>
        </form>
      </DeskCard>
      <InspectionPhotos vehicleId={vehicleId} />
    </div>
  );
}
