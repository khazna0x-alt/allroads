"use client";

import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { Link } from "@/i18n/navigation";
import { api, type Id } from "@/lib/convex";

export function InquiryForm({
  vehicleId,
  defaultSubject,
}: {
  vehicleId?: Id<"vehicles">;
  defaultSubject?: string;
}) {
  const t = useTranslations("Contact");
  const nav = useTranslations("Nav");
  const locale = useLocale();
  const createInquiry = useMutation(api.inquiries.createInquiry);
  const [captcha] = useState(() => {
    const a = Math.floor(Math.random() * 6) + 2;
    const b = Math.floor(Math.random() * 6) + 1;
    return { a, b, sum: a + b };
  });
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    const answer = Number(formData.get("captcha"));
    if (answer !== captcha.sum) {
      setStatus("error");
      setError(t("captchaError"));
      return;
    }

    try {
      await createInquiry({
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        subject: String(formData.get("subject") ?? defaultSubject ?? t("general")),
        message: String(formData.get("message") ?? ""),
        vehicleId,
        locale: locale === "ar" ? "ar" : "en",
        source: "web_form",
      });
      setStatus("ok");
      setError("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (status === "ok") {
    return (
      <div className="border border-[var(--sand)] p-5">
        <p className="font-display text-2xl text-[var(--sand)]">{t("successTitle")}</p>
        <p className="mt-2 text-[var(--ivory-dim)]">{t("success")}</p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="min-w-0 space-y-4">
      <Field label={t("name")} name="name" required />
      <Field label={t("phoneField")} name="phone" required />
      <label className="block text-sm">
        <FieldLabel label={t("subject")} required />
        <select
          name="subject"
          required
          defaultValue={defaultSubject ?? t("general")}
          className="field-input"
        >
          <option value={t("general")}>{t("general")}</option>
          <option value={t("displayed")}>{t("displayed")}</option>
        </select>
      </label>
      <label className="block text-sm">
        <FieldLabel label={t("message")} required />
        <textarea name="message" required rows={5} className="field-input" />
      </label>
      <Field
        label={t("captcha", { a: captcha.a, b: captcha.b })}
        name="captcha"
        required
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button type="submit" className="btn-primary w-full">
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
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <FieldLabel label={label} required={required} />
      <input name={name} required={required} className="field-input" />
    </label>
  );
}
