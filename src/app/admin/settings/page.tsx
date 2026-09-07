"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { useState } from "react";
import {
  AdminButton,
  AdminField,
  DeskCard,
  GoldRule,
  PageHeader,
} from "@/components/admin/ui";
import { api } from "@/lib/convex";

export default function AdminSettingsPage() {
  const t = useTranslations("Admin.settings");
  const me = useQuery(api.staff.me);
  const contact = useQuery(api.site.getContact);
  const saveWhatsapp = useMutation(api.site.setWhatsappPhone);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const phone = draft ?? contact?.whatsappLocal ?? "";

  if (me && me.role !== "admin") {
    notFound();
  }

  return (
    <div>
      <PageHeader kicker={t("kicker")} title={t("title")} lead={t("lead")} />
      <GoldRule />
      <DeskCard className="mt-8 max-w-xl">
        <h2 className="font-display text-xl">{t("whatsappTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ivory-dim)] text-pretty">{t("whatsappLead")}</p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSaving(true);
            setStatus("idle");
            setError("");
            void saveWhatsapp({ phone })
              .then((result) => {
                setDraft(result.whatsappLocal);
                setStatus("saved");
              })
              .catch((caught: unknown) => {
                setStatus("error");
                setError(caught instanceof Error ? caught.message : t("failed"));
              })
              .finally(() => {
                setSaving(false);
              });
          }}
        >
          <AdminField
            name="whatsappPhone"
            label={t("whatsappLabel")}
            value={phone}
            onChange={(value) => {
              setDraft(value);
              setStatus("idle");
            }}
            required
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("whatsappHint")}
          />
          {contact ? (
            <p className="text-sm text-[var(--ivory-dim)]" dir="ltr">
              {contact.whatsappDisplay}
            </p>
          ) : null}
          {status === "saved" ? <p className="text-sm text-[var(--sand)]">{t("saved")}</p> : null}
          {status === "error" ? <p className="text-sm text-red-400">{error || t("failed")}</p> : null}
          <AdminButton type="submit" disabled={saving || contact === undefined}>
            {saving ? t("saving") : t("save")}
          </AdminButton>
        </form>
      </DeskCard>
    </div>
  );
}
