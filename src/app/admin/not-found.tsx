"use client";

import { useTranslations } from "next-intl";
import { AdminButton, GoldRule, PageHeader } from "@/components/admin/ui";

export default function AdminNotFound() {
  const t = useTranslations("Admin.notFound");
  return (
    <div>
      <PageHeader kicker="404" title={t("title")} lead={t("lead")} />
      <GoldRule />
      <div className="mt-8">
        <AdminButton href="/admin" variant="primary">
          {t("home")}
        </AdminButton>
      </div>
    </div>
  );
}
