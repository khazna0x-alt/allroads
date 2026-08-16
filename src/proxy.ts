import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOCALE_COOKIE, parseAdminLocale } from "./i18n/admin-locale";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
const adminPath = /^\/admin(?:\/|$)/;
const publicApiPath = /^\/api\/inventory(?:\/|$)/;

function continueAdmin(request: NextRequest) {
  const locale = parseAdminLocale(request.cookies.get(ADMIN_LOCALE_COOKIE)?.value);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-intl-locale", locale);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicApiPath.test(pathname)) {
    return NextResponse.next();
  }
  if (adminPath.test(pathname)) {
    return continueAdmin(request);
  }
  return intlMiddleware(request);
}

export default proxy;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
