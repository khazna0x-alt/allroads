"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ADMIN_LOCALE_COOKIE, ADMIN_LOCALE_MAX_AGE, adminDir } from "@/i18n/admin-locale";

export function AdminLocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `${ADMIN_LOCALE_COOKIE}=${next}; path=/; max-age=${ADMIN_LOCALE_MAX_AGE}; SameSite=Lax`;
        try {
          localStorage.setItem(ADMIN_LOCALE_COOKIE, next);
        } catch {
          // Private mode can block storage; cookie still persists the choice.
        }
        document.documentElement.lang = next;
        document.documentElement.dir = adminDir(next);
        router.refresh();
      }}
      className="inline-flex min-h-11 items-center border border-[var(--line)] px-3 py-1 text-[11px] tracking-[0.22em] uppercase text-[var(--sand-bright)] hover:bg-[var(--sand)] hover:text-[var(--ink)] transition-colors"
    >
      {next === "en" ? "EN" : "عربي"}
    </button>
  );
}
