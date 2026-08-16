"use client";

import { useLayoutEffect } from "react";
import {
  ADMIN_LOCALE_COOKIE,
  ADMIN_LOCALE_MAX_AGE,
  adminDir,
  parseAdminLocale,
} from "@/i18n/admin-locale";

export function AdminDir({ locale }: { locale: string }) {
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_LOCALE_COOKIE);
      const hasCookie = document.cookie.split("; ").some((part) => part.startsWith(`${ADMIN_LOCALE_COOKIE}=`));
      if (!hasCookie && stored) {
        const fromStorage = parseAdminLocale(stored);
        document.cookie = `${ADMIN_LOCALE_COOKIE}=${fromStorage}; path=/; max-age=${ADMIN_LOCALE_MAX_AGE}; SameSite=Lax`;
        const cookieSet = document.cookie.split("; ").some((part) => part.startsWith(`${ADMIN_LOCALE_COOKIE}=`));
        if (cookieSet && fromStorage !== locale) {
          document.documentElement.lang = fromStorage;
          document.documentElement.dir = adminDir(fromStorage);
          window.location.reload();
          return;
        }
      }
    } catch {
      // Cookie/localStorage can be blocked; still apply the server locale.
    }
    document.documentElement.lang = locale;
    document.documentElement.dir = adminDir(locale);
  }, [locale]);
  return null;
}
