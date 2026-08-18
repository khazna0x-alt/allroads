"use client";

import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { FileListField, type ListedFile } from "@/components/forms/FileListField";
import { Link } from "@/i18n/navigation";
import { api, type Id } from "@/lib/convex";
import {
  contentTypeForFile,
  isAllowedContractFile,
  MAX_CONTRACT_BYTES,
} from "@/lib/contractFile";
import { isAllowedVehiclePhoto, MAX_VEHICLE_PHOTO_BYTES } from "@/lib/imageUpload";

const BODY_TYPES = [
  "suv",
  "sedan",
  "coupe",
  "convertible",
  "hatchback",
  "wagon",
  "pickup",
  "van",
] as const;

const MAX_PHOTOS = 12;
const MAX_DOCS = 8;

export function ConsignmentForm() {
  const t = useTranslations("Consign");
  const nav = useTranslations("Nav");
  const locale = useLocale();
  const submit = useMutation(api.inquiries.submitConsignment);
  const generateUploadUrl = useMutation(api.inquiries.generateConsignmentUploadUrl);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [stockCode, setStockCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<ListedFile[]>([]);
  const [docs, setDocs] = useState<ListedFile[]>([]);
  const [captcha, setCaptcha] = useState<{ a: number; b: number; sum: number } | null>(null);

  useEffect(() => {
    const a = Math.floor(Math.random() * 6) + 2;
    const b = Math.floor(Math.random() * 6) + 1;
    setCaptcha({ a, b, sum: a + b });
  }, []);

  async function uploadFile(file: File): Promise<Id<"_storage">> {
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
    return json.storageId;
  }

  async function onSubmit(formData: FormData) {
    const answer = Number(formData.get("captcha"));
    if (!captcha || answer !== captcha.sum) {
      setStatus("error");
      setError(t("captchaError"));
      return;
    }
    if (formData.get("acceptedTerms") !== "on") {
      setStatus("error");
      setError(t("termsRequired"));
      return;
    }

    setBusy(true);
    setError("");
    try {
      const photoFiles = photos.map((item) => item.file);
      const docFiles = docs.map((item) => item.file);
      if (photoFiles.length > MAX_PHOTOS) {
        throw new Error(t("tooManyPhotos"));
      }
      if (docFiles.length > MAX_DOCS) {
        throw new Error(t("tooManyDocs"));
      }
      for (const photo of photoFiles) {
        if (photo.size > MAX_VEHICLE_PHOTO_BYTES || !isAllowedVehiclePhoto(photo)) {
          throw new Error(t("photoType"));
        }
      }
      for (const doc of docFiles) {
        if (doc.size > MAX_CONTRACT_BYTES || !isAllowedContractFile(doc)) {
          throw new Error(t("docType"));
        }
      }

      const photoStorageIds: Id<"_storage">[] = [];
      for (const photo of photoFiles) {
        photoStorageIds.push(await uploadFile(photo));
      }
      const ownershipDocs: Array<{ storageId: Id<"_storage">; fileName: string }> = [];
      for (const doc of docFiles) {
        ownershipDocs.push({
          storageId: await uploadFile(doc),
          fileName: doc.name,
        });
      }

      const result = await submit({
        ownerName: String(formData.get("ownerName") ?? ""),
        ownerPhone: String(formData.get("ownerPhone") ?? ""),
        message: String(formData.get("notes") ?? ""),
        locale: locale === "ar" ? "ar" : "en",
        make: String(formData.get("make") ?? ""),
        model: String(formData.get("model") ?? ""),
        year: Number(formData.get("year")),
        priceOmr: Number(formData.get("priceOmr")),
        mileageKm: Number(formData.get("mileageKm")),
        bodyType: String(formData.get("bodyType")) as (typeof BODY_TYPES)[number],
        exteriorColor: String(formData.get("exteriorColor") ?? ""),
        interiorColor: String(formData.get("interiorColor") ?? ""),
        vin: String(formData.get("vin") ?? "") || undefined,
        acceptedTerms: true,
        photoStorageIds,
        ownershipDocs,
      });
      setStockCode(result.stockCode);
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
      <div className="border border-[var(--sand)] p-5">
        <p className="font-display text-2xl text-[var(--sand)]">{t("successTitle")}</p>
        <p className="mt-3 font-display text-3xl tracking-[0.12em] text-[var(--sand-bright)]">
          {stockCode}
        </p>
        <p className="mt-2 text-[var(--ivory-dim)]">{t("success", { stock: stockCode })}</p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="grid min-w-0 gap-4 md:grid-cols-2">
      <Input label={t("ownerName")} name="ownerName" required autoComplete="name" />
      <Input label={t("ownerPhone")} name="ownerPhone" required autoComplete="tel" />
      <Input label={t("make")} name="make" required />
      <Input label={t("model")} name="model" required />
      <label className="min-w-0 text-sm">
        <FieldLabel label={t("bodyType")} required />
        <select name="bodyType" required defaultValue="suv" className="field-input">
          {BODY_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`bodyTypes.${value}`)}
            </option>
          ))}
        </select>
      </label>
      <Input label={t("year")} name="year" type="number" required />
      <Input label={t("exteriorColor")} name="exteriorColor" required />
      <Input label={t("interiorColor")} name="interiorColor" required />
      <Input label={t("mileage")} name="mileageKm" type="number" required />
      <Input label={t("price")} name="priceOmr" type="number" required />
      <Input label={t("vin")} name="vin" hint={t("vinHint")} />
      <label className="md:col-span-2 text-sm">
        <FieldLabel label={t("notes")} required />
        <textarea name="notes" required rows={5} className="field-input" />
      </label>
      <FileListField
        label={t("photos")}
        accept="image/*"
        maxCount={MAX_PHOTOS}
        files={photos}
        onChange={setPhotos}
        addLabel={t("addPhotos")}
        replaceLabel={t("replaceFile")}
        removeLabel={t("removeFile")}
        countLabel={t("fileCount", { count: photos.length, max: MAX_PHOTOS })}
      />
      <FileListField
        label={t("ownershipDocs")}
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.webp"
        maxCount={MAX_DOCS}
        files={docs}
        onChange={setDocs}
        addLabel={t("addDocs")}
        replaceLabel={t("replaceFile")}
        removeLabel={t("removeFile")}
        countLabel={t("fileCount", { count: docs.length, max: MAX_DOCS })}
      />
      <Input
        label={captcha ? t("captcha", { a: captcha.a, b: captcha.b }) : t("captchaLabel")}
        name="captcha"
        required
        className="md:col-span-2"
      />
      <label className="md:col-span-2 flex items-start gap-3 text-sm text-[var(--ivory-dim)]">
        <input name="acceptedTerms" type="checkbox" required className="mt-1 size-4 accent-[var(--sand)]" />
        <span>
          {t("termsLabel")}{" "}
          <Link href="/terms" className="text-[var(--sand)] underline">
            {nav("terms")}
          </Link>
          .
        </span>
      </label>
      {error ? <p className="md:col-span-2 text-sm text-red-400">{error}</p> : null}
      <button type="submit" disabled={busy || !captcha} className="btn-primary md:col-span-2 disabled:opacity-60">
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
  autoComplete,
  hint,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`min-w-0 text-sm ${className}`}>
      <FieldLabel label={label} required={required} />
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="field-input"
      />
      {hint ? <span className="mt-1 block text-xs text-gray-400">{hint}</span> : null}
    </label>
  );
}
