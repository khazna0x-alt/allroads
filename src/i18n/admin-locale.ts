export const ADMIN_LOCALE_COOKIE = "admin-locale";
export const ADMIN_LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export type AdminLocale = "ar" | "en";

export function parseAdminLocale(value: string | undefined | null): AdminLocale {
  return value === "en" ? "en" : "ar";
}

export function adminDir(locale: string): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
