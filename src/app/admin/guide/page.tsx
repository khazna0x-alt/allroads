"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { DeskCard, GoldRule, PageHeader } from "@/components/admin/ui";
import { api } from "@/lib/convex";

const EDITOR_SECTIONS = [
  "overview",
  "inventory",
  "pricing",
  "qr",
  "consignments",
  "inquiries",
  "bookings",
] as const;

const ADMIN_SECTIONS = ["excel", "staff"] as const;

export default function AdminGuidePage() {
  const t = useTranslations("Admin.guide");
  const me = useQuery(api.staff.me);
  const sections = me?.role === "admin" ? [...EDITOR_SECTIONS, ...ADMIN_SECTIONS] : [...EDITOR_SECTIONS];

  return (
    <div>
      <PageHeader kicker={t("kicker")} title={t("title")} lead={t("lead")} />
      <GoldRule />
      <div className="mt-8 space-y-6">
        <DeskCard>
          <h2 className="font-display text-xl">{t("rolesTitle")}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ivory-dim)] text-pretty">{t("rolesLead")}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="border border-[var(--line)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--sand-bright)]">{t("rolesAdmin")}</p>
              <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("rolesAdminBody")}</p>
            </li>
            <li className="border border-[var(--line)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--sand-bright)]">{t("rolesEditor")}</p>
              <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("rolesEditorBody")}</p>
            </li>
          </ul>
        </DeskCard>
        {sections.map((section) => (
          <DeskCard key={section}>
            <h2 className="font-display text-xl">{t(`sections.${section}.title`)}</h2>
            <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t(`sections.${section}.lead`)}</p>
            <ol className="mt-5 space-y-4">
              {["1", "2", "3", "4"].map((step) => {
                const titleKey = `sections.${section}.step${step}Title`;
                const bodyKey = `sections.${section}.step${step}Body`;
                if (!t.has(titleKey)) {
                  return null;
                }
                return (
                  <li key={step} className="border-s-2 border-[var(--sand)] ps-4">
                    <h3 className="text-sm font-semibold text-[var(--ivory)]">{t(titleKey)}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--ivory-dim)] text-pretty">{t(bodyKey)}</p>
                  </li>
                );
              })}
            </ol>
          </DeskCard>
        ))}
      </div>
    </div>
  );
}
