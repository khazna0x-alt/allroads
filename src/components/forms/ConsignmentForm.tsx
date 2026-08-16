"use client";

import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { api } from "@/lib/convex";

export function ConsignmentForm() {
  const t = useTranslations("Consign");
  const locale = useLocale();
  const submit = useMutation(api.inquiries.submitConsignment);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError("");
    try {
      await submit({
        ownerName: String(formData.get("ownerName") ?? ""),
        ownerPhone: String(formData.get("ownerPhone") ?? ""),
        message: String(formData.get("notes") ?? ""),
        locale: locale === "ar" ? "ar" : "en",
        make: String(formData.get("make") ?? ""),
        model: String(formData.get("model") ?? ""),
        year: Number(formData.get("year")),
        priceOmr: Number(formData.get("priceOmr") || 0) || undefined,
        mileageKm: Number(formData.get("mileageKm") || 0) || undefined,
      });
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (status === "ok") {
    return (
      <p className="border border-[var(--sand)] p-5 text-[var(--sand)]">{t("success")}</p>
    );
  }

  return (
    <form action={onSubmit} className="grid min-w-0 gap-4 md:grid-cols-2">
      <Input label={t("ownerName")} name="ownerName" required />
      <Input label={t("ownerPhone")} name="ownerPhone" required />
      <Input label={t("make")} name="make" required />
      <Input label={t("model")} name="model" required />
      <Input label={t("year")} name="year" type="number" required />
      <Input label={t("price")} name="priceOmr" type="number" />
      <Input label={t("mileage")} name="mileageKm" type="number" />
      <label className="md:col-span-2 text-sm">
        <FieldLabel label={t("notes")} required />
        <textarea name="notes" required rows={5} className="field-input" />
      </label>
      {error ? <p className="md:col-span-2 text-sm text-red-400">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-primary md:col-span-2 disabled:opacity-60">
        {busy ? t("sending") : t("submit")}
      </button>
    </form>
  );
}

function Input({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="min-w-0 text-sm">
      <FieldLabel label={label} required={required} />
      <input name={name} type={type} required={required} className="field-input" />
    </label>
  );
}
