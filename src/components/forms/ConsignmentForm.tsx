"use client";

import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ContractUploadField } from "@/components/consign/ContractUploadField";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { api, type Id } from "@/lib/convex";

const MAX_CONTRACT_BYTES = 15 * 1024 * 1024;

function isAllowedContractFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (
    type === "application/pdf" ||
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "image/heic" ||
    type === "image/heif"
  ) {
    return true;
  }
  return /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

function contentTypeForFile(file: File): string {
  if (file.type) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (name.endsWith(".png")) {
    return "image/png";
  }
  if (name.endsWith(".webp")) {
    return "image/webp";
  }
  if (name.endsWith(".heic")) {
    return "image/heic";
  }
  if (name.endsWith(".heif")) {
    return "image/heif";
  }
  return "image/jpeg";
}

export function ConsignmentForm() {
  const t = useTranslations("Consign");
  const locale = useLocale();
  const submit = useMutation(api.inquiries.submitConsignment);
  const generateUploadUrl = useMutation(api.inquiries.generateConsignmentUploadUrl);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError("");
    try {
      const file = contractFile ?? formData.get("contract");
      let contractStorageId: Id<"_storage"> | undefined;
      let contractFileName: string | undefined;

      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_CONTRACT_BYTES) {
          setStatus("error");
          setError(t("fileTooLarge"));
          return;
        }
        if (!isAllowedContractFile(file)) {
          setStatus("error");
          setError(t("fileType"));
          return;
        }
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": contentTypeForFile(file) },
          body: file,
        });
        if (!result.ok) {
          throw new Error(t("uploadFailed"));
        }
        const json = (await result.json()) as { storageId: Id<"_storage"> };
        contractStorageId = json.storageId;
        contractFileName = file.name;
      }

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
        contractStorageId,
        contractFileName,
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
      <ContractUploadField file={contractFile} onFileChange={setContractFile} />
      {error ? <p className="md:col-span-2 text-sm text-red-400">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-primary md:col-span-2 disabled:opacity-60">
        {busy ? t("uploading") : t("submit")}
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
