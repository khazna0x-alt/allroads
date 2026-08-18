"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ContractUploader } from "@/components/admin/ContractUploader";
import { AdminButton, AdminField, AdminSelect, DeskCard } from "@/components/admin/ui";
import { dateInputToMs, msToDateInput } from "@/lib/adminDates";
import { api, type Id } from "@/lib/convex";

const STATUSES = ["unsigned", "awaiting_signature", "signed", "expired", "cancelled"] as const;

export function ContractDesk({
  vehicleId,
  contractStatus,
  contractStartsAt,
  contractEndsAt,
  contractUrl,
  contractFileName,
}: {
  vehicleId: Id<"vehicles">;
  contractStatus?: (typeof STATUSES)[number];
  contractStartsAt?: number;
  contractEndsAt?: number;
  contractUrl?: string | null;
  contractFileName?: string;
}) {
  const t = useTranslations("Admin");
  const updateContract = useMutation(api.vehicles.updateContract);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(formData: FormData) {
    const statusRaw = String(formData.get("contractStatus") ?? "unsigned");
    const status = STATUSES.find((item) => item === statusRaw) ?? "unsigned";
    setSaving(true);
    setError("");
    try {
      await updateContract({
        vehicleId,
        contractStatus: status,
        contractStartsAt: dateInputToMs(String(formData.get("contractStartsAt") ?? "")),
        contractEndsAt: dateInputToMs(String(formData.get("contractEndsAt") ?? "")),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inventory.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DeskCard>
      <h2 className="font-display text-xl">{t("inventory.sections.contract")}</h2>
      <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("fields.contract")}</p>
      <form action={onSubmit} className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
        <AdminSelect
          name="contractStatus"
          label={t("fields.contractStatus")}
          defaultValue={contractStatus ?? "unsigned"}
          options={[...STATUSES]}
          formatLabel={(value) => t(`contractStatus.${value}`)}
        />
        <AdminField
          name="contractStartsAt"
          label={t("fields.contractStartsAt")}
          type="date"
          defaultValue={msToDateInput(contractStartsAt)}
        />
        <AdminField
          name="contractEndsAt"
          label={t("fields.contractEndsAt")}
          type="date"
          defaultValue={msToDateInput(contractEndsAt)}
        />
        <div className="md:col-span-2">
          <AdminButton type="submit" disabled={saving}>
            {t("inventory.saveContract")}
          </AdminButton>
        </div>
      </form>
      {error ? (
        <p className="mt-3 text-sm text-[#f2c4c6]" role="alert">
          {error}
        </p>
      ) : null}
      <ContractUploader
        vehicleId={vehicleId}
        contractUrl={contractUrl}
        contractFileName={contractFileName}
      />
    </DeskCard>
  );
}
