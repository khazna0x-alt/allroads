import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { ADMIN_LOCALE_COOKIE, parseAdminLocale } from "./admin-locale";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  let locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  if (!hasLocale(routing.locales, requested)) {
    const { cookies } = await import("next/headers");
    const cookieLocale = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
    locale = parseAdminLocale(cookieLocale);
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
