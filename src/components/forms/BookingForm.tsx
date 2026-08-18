"use client";

import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { Link } from "@/i18n/navigation";
import {
  contentTypeForFile,
  isAllowedContractFile,
  MAX_CONTRACT_BYTES,
} from "@/lib/contractFile";
import { api, type Id } from "@/lib/convex";
import { formatOmr } from "@/lib/format";

const DURATIONS = [3, 7, 14] as const;

export function BookingForm({
  vehicleId,
  stockCode,
  vehicleTitle,
  depositOmr,
  canBook,
  blockedReason,
}: {
  vehicleId: Id<"vehicles">;
  stockCode: string;
  vehicleTitle: string;
  depositOmr: number;
  canBook: boolean;
  blockedReason?: string;
}) {
  const t = useTranslations("Booking");
  const nav = useTranslations("Nav");
  const locale = useLocale();
  const createBooking = useMutation(api.bookings.createBooking);
  const generateUploadUrl = useMutation(api.bookings.generateReceiptUploadUrl);
  const attachReceipt = useMutation(api.bookings.attachReceipt);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [receiptStatus, setReceiptStatus] = useState<"idle" | "ok" | "error">("idle");

  async function onSubmit(formData: FormData) {
    if (!canBook) {
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
      const result = await createBooking({
        vehicleId,
        customerName: String(formData.get("customerName") ?? ""),
        customerPhone: String(formData.get("customerPhone") ?? ""),
        customerEmail: String(formData.get("customerEmail") ?? "").trim() || undefined,
        durationDays: Number(formData.get("durationDays")) as 3 | 7 | 14,
        notes: String(formData.get("notes") ?? "").trim() || undefined,
        acceptedTerms: true,
        locale: locale === "ar" ? "ar" : "en",
      });
      setBookingNumber(result.bookingNumber);
      setPhone(String(formData.get("customerPhone") ?? ""));
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onReceipt(formData: FormData) {
    const file = formData.get("receipt");
    if (!(file instanceof File) || file.size === 0) {
      setReceiptStatus("error");
      return;
    }
    if (file.size > MAX_CONTRACT_BYTES || !isAllowedContractFile(file)) {
      setReceiptStatus("error");
      return;
    }
    try {
      const postUrl = await generateUploadUrl();
      const uploaded = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": contentTypeForFile(file) },
        body: file,
      });
      if (!uploaded.ok) {
        throw new Error("upload failed");
      }
      const json = (await uploaded.json()) as { storageId: Id<"_storage"> };
      await attachReceipt({
        bookingNumber,
        phone,
        storageId: json.storageId,
        fileName: file.name,
      });
      setReceiptStatus("ok");
    } catch {
      setReceiptStatus("error");
    }
  }

  if (!canBook) {
    return (
      <div className="border border-[var(--line)] p-5">
        <p className="font-display text-2xl">{t("unavailableTitle")}</p>
        <p className="mt-2 text-[var(--ivory-dim)]">{blockedReason ?? t("unavailable")}</p>
      </div>
    );
  }

  if (status === "ok") {
    return (
      <div className="space-y-4 border border-[var(--sand)] p-5">
        <p className="font-display text-2xl text-[var(--sand)]">{t("successTitle")}</p>
        <p className="text-[var(--ivory-dim)]">
          {t("success", { number: bookingNumber, deposit: formatOmr(depositOmr, locale) })}
        </p>
        <p className="text-sm text-[var(--ivory-dim)]">{t("successNext")}</p>
        <form action={onReceipt} className="space-y-3 border border-[var(--line)] p-4">
          <p className="text-sm">{t("receiptLead")}</p>
          <input name="receipt" type="file" accept="image/*,application/pdf" className="field-input" />
          <button type="submit" className="btn-secondary w-full">
            {t("receiptUpload")}
          </button>
          {receiptStatus === "ok" ? (
            <p className="text-sm text-[var(--sand)]">{t("receiptOk")}</p>
          ) : null}
          {receiptStatus === "error" ? (
            <p className="text-sm text-red-400">{t("receiptError")}</p>
          ) : null}
        </form>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="min-w-0 space-y-4">
      <div className="border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm">
        <p className="text-[11px] tracking-[0.18em] text-[var(--ivory-dim)] uppercase">{t("stock")}</p>
        <p className="mt-1 break-words text-white">{vehicleTitle}</p>
        <p className="mt-0.5 text-[var(--sand)]" dir="ltr">
          {stockCode}
        </p>
      </div>
      <label className="block text-sm">
        <FieldLabel label={t("name")} required />
        <input name="customerName" required autoComplete="name" className="field-input" />
      </label>
      <label className="block text-sm">
        <FieldLabel label={t("phone")} required />
        <input name="customerPhone" required autoComplete="tel" dir="ltr" className="field-input" />
      </label>
      <label className="block text-sm">
        <FieldLabel label={t("email")} />
        <input name="customerEmail" type="email" autoComplete="email" dir="ltr" className="field-input" />
      </label>
      <label className="block text-sm">
        <FieldLabel label={t("duration")} required />
        <select name="durationDays" required defaultValue="7" className="field-input">
          {DURATIONS.map((days) => (
            <option key={days} value={days}>
              {t("durationDays", { days })}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <FieldLabel label={t("paymentMethod")} required />
        <select name="paymentMethod" required defaultValue="bank_transfer" className="field-input">
          <option value="bank_transfer">{t("bankTransfer")}</option>
          <option value="gateway_later" disabled>
            {t("gatewayLater")}
          </option>
        </select>
      </label>
      <div className="border border-[var(--sand)]/30 bg-[var(--ink)] p-4 text-sm leading-7 text-[var(--ivory-dim)]">
        <p className="text-[var(--sand)]">{t("depositLabel", { amount: formatOmr(depositOmr, locale) })}</p>
        <p className="mt-2">{t("depositTerms")}</p>
      </div>
      <label className="block text-sm">
        <FieldLabel label={t("notes")} />
        <textarea name="notes" rows={3} className="field-input" />
      </label>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
        <input type="checkbox" name="acceptedTerms" required className="mt-1" />
        <span>
          {t("acceptTerms")}{" "}
          <Link href="/booking-terms" className="text-[var(--sand)] underline">
            {nav("bookingTerms")}
          </Link>
        </span>
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
