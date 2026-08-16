"use client";

import { useTranslations } from "next-intl";

export function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  const t = useTranslations("Form");

  return (
    <span className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="text-[var(--ivory-dim)]">{label}</span>
      {required ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--crimson)]">
          <span aria-hidden="true" className="font-bold text-[var(--sand)]">
            *
          </span>
          {t("required")}
        </span>
      ) : (
        <span className="text-xs text-gray-400">{t("optional")}</span>
      )}
    </span>
  );
}
