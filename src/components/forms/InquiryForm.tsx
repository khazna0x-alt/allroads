"use client";

import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { useFormChallenge } from "@/components/forms/useFormChallenge";
import { Link } from "@/i18n/navigation";
import { inquirySubjects, type InquirySubjectValue } from "@/lib/brand";
import { api, type Id } from "@/lib/convex";

const PRESETS = ["available", "deposit", "book", "financing"] as const;

function subscribeViewingHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getViewingHash() {
  return window.location.hash === "#viewing";
}

function getServerViewingHash() {
  return false;
}

export function InquiryForm({
  vehicleId,
  stockCode,
  vehicleTitle,
  defaultSubject,
}: {
  vehicleId?: Id<"vehicles">;
  stockCode?: string;
  vehicleTitle?: string;
  defaultSubject?: string;
}) {
  const t = useTranslations("Contact");
  const nav = useTranslations("Nav");
  const locale = useLocale();
  const createInquiry = useMutation(api.inquiries.createInquiry);
  const { challenge, refresh } = useFormChallenge();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [subjectKey, setSubjectKey] = useState<InquirySubjectValue>("general");
  const [listedVehicleId, setListedVehicleId] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  const hashViewing = useSyncExternalStore(subscribeViewingHash, getViewingHash, getServerViewingHash);
  const [viewingOverride, setViewingOverride] = useState<boolean | null>(null);
  const viewing = viewingOverride ?? hashViewing;
  const [preferredContact, setPreferredContact] = useState<"phone" | "whatsapp" | "email">(
    "whatsapp",
  );

  const showCarPicker = !vehicleId && subjectKey === "displayed";
  const cars = useQuery(api.public.listPublishedChoices, showCarPicker ? {} : "skip");
  const attachedVehicleId = vehicleId ?? (listedVehicleId ? (listedVehicleId as Id<"vehicles">) : undefined);

  function subjectLabel(value: InquirySubjectValue): string {
    const subject = inquirySubjects.find((item) => item.value === value);
    if (!subject) {
      return t("general");
    }
    return locale === "ar" ? subject.ar : subject.en;
  }

  async function onSubmit(formData: FormData) {
    const answer = Number(formData.get("captcha"));
    if (!challenge || answer !== challenge.a + challenge.b) {
      setStatus("error");
      setError(t("captchaError"));
      void refresh();
      return;
    }

    if (showCarPicker && !listedVehicleId) {
      setStatus("error");
      setError(t("selectCarRequired"));
      return;
    }

    if (subjectKey === "other" && otherDetails.trim().length < 2) {
      setStatus("error");
      setError(t("otherDetailsRequired"));
      return;
    }

    const name = String(formData.get("name") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const email = String(formData.get("email") ?? "").trim();
    const label = subjectLabel(subjectKey);
    const subject =
      vehicleTitle && stockCode
        ? `${vehicleTitle} · ${stockCode}`
        : subjectKey === "other"
          ? `${label}: ${otherDetails.trim()}`
          : (defaultSubject ?? label);

    try {
      await createInquiry({
        name,
        phone,
        email: email || undefined,
        subject,
        message,
        vehicleId: attachedVehicleId,
        locale: locale === "ar" ? "ar" : "en",
        source: "web_form",
        preferredContact,
        viewingRequested: viewing,
        challengeId: challenge.challengeId,
        challengeAnswer: answer,
      });
      setStatus("ok");
      setError("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error");
      void refresh();
    }
  }

  if (status === "ok") {
    return (
      <div className="border border-[var(--sand)] p-5">
        <p className="font-display text-2xl text-[var(--sand)]">{t("successTitle")}</p>
        <p className="mt-2 text-[var(--ivory-dim)]">
          {viewing ? t("successViewing") : t("success")}
        </p>
      </div>
    );
  }

  return (
    <form
      action={onSubmit}
      onFocus={() => {
        if (!challenge) {
          void refresh();
        }
      }}
      className="min-w-0 space-y-4"
    >
      {stockCode ? (
        <div className="border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm">
          <p className="text-[11px] tracking-[0.18em] text-[var(--ivory-dim)] uppercase">
            {t("vehicle")}
          </p>
          <p className="mt-1 break-words text-white">{vehicleTitle}</p>
          <p className="mt-0.5 text-[var(--sand)]" dir="ltr">
            {stockCode}
          </p>
        </div>
      ) : null}
      <Field label={t("name")} name="name" required autoComplete="name" />
      <Field label={t("phoneField")} name="phone" required autoComplete="tel" dir="ltr" />
      <Field label={t("email")} name="email" type="email" autoComplete="email" dir="ltr" />
      <label className="block text-sm">
        <FieldLabel label={t("preferredContact")} required />
        <select
          name="preferredContact"
          required
          value={preferredContact}
          onChange={(event) =>
            setPreferredContact(event.target.value as "phone" | "whatsapp" | "email")
          }
          className="field-input"
        >
          <option value="whatsapp">{t("contactWhatsapp")}</option>
          <option value="phone">{t("contactPhone")}</option>
          <option value="email">{t("contactEmail")}</option>
        </select>
      </label>
      {vehicleId ? null : (
        <label className="block text-sm">
          <FieldLabel label={t("subject")} required />
          <select
            name="subject"
            required
            value={subjectKey}
            onChange={(event) => {
              const next = event.target.value as InquirySubjectValue;
              setSubjectKey(next);
              if (next !== "displayed") {
                setListedVehicleId("");
              }
              if (next !== "other") {
                setOtherDetails("");
              }
            }}
            className="field-input"
          >
            {inquirySubjects.map((subject) => {
              const label = locale === "ar" ? subject.ar : subject.en;
              return (
                <option key={subject.value} value={subject.value}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
      )}
      {showCarPicker ? (
        <label className="block text-sm">
          <FieldLabel label={t("selectCar")} required />
          <select
            name="listedVehicleId"
            required
            value={listedVehicleId}
            onChange={(event) => setListedVehicleId(event.target.value)}
            className="field-input"
            disabled={cars === undefined}
          >
            <option value="">
              {cars === undefined ? t("loadingCars") : t("selectCarPlaceholder")}
            </option>
            {cars?.map((car) => {
              const title = locale === "ar" ? car.titleAr : car.titleEn;
              return (
                <option key={car._id} value={car._id}>
                  {car.year} {title} · {car.stockCode}
                </option>
              );
            })}
          </select>
          {cars && cars.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("noCars")}</p>
          ) : null}
        </label>
      ) : null}
      {vehicleId || subjectKey !== "other" ? null : (
        <label className="block text-sm">
          <FieldLabel label={t("otherDetails")} required />
          <textarea
            name="otherDetails"
            required
            rows={3}
            className="field-input"
            value={otherDetails}
            onChange={(event) => setOtherDetails(event.target.value)}
            placeholder={t("otherDetailsPlaceholder")}
          />
        </label>
      )}
      {attachedVehicleId ? (
        <div>
          <p className="mb-2 text-sm text-[var(--ivory-dim)]">{t("presets")}</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="border border-[var(--line)] px-3 py-2 text-sm text-[var(--ivory)] hover:border-[var(--sand)] hover:text-[var(--sand)]"
                onClick={() => setMessage(t(`preset.${preset}`))}
              >
                {t(`presetLabel.${preset}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <label className="block text-sm">
        <FieldLabel label={t("message")} required />
        <textarea
          name="message"
          required
          rows={5}
          className="field-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      {attachedVehicleId ? (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={viewing}
            onChange={(event) => setViewingOverride(event.target.checked)}
            className="mt-1"
          />
          <span>{t("viewingRequest")}</span>
        </label>
      ) : null}
      <Field
        label={challenge ? t("captcha", { a: challenge.a, b: challenge.b }) : t("captchaLabel")}
        name="captcha"
        required
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={!challenge || (showCarPicker && cars === undefined)}
        className="btn-primary w-full disabled:opacity-60"
      >
        {t("send")}
      </button>
      <p className="text-xs text-gray-400">
        {t("consent")}{" "}
        <Link href="/privacy" className="text-[var(--sand)] underline">
          {nav("privacy")}
        </Link>
        . {t("consignInstead")}{" "}
        <Link href="/consign" className="text-[var(--sand)] underline">
          {nav("consign")}
        </Link>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  autoComplete,
  dir,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block text-sm">
      <FieldLabel label={label} required={required} />
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        dir={dir}
        className="field-input"
      />
    </label>
  );
}
