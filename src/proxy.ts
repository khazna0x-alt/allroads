import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
} from "@convex-dev/auth/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOCALE_COOKIE, parseAdminLocale } from "./i18n/admin-locale";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
const isAdminRoute = createRouteMatcher(["/admin", "/admin/(.*)"]);
const isPublicApi = createRouteMatcher(["/api/inventory", "/api/inventory/(.*)"]);

function continueAdmin(request: NextRequest) {
  const locale = parseAdminLocale(request.cookies.get(ADMIN_LOCALE_COOKIE)?.value);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-intl-locale", locale);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

const handler = convexAuthNextjsMiddleware(
  async (request) => {
    if (isPublicApi(request)) {
      return NextResponse.next();
    }

    if (isAdminRoute(request)) {
      return continueAdmin(request);
    }

    return intlMiddleware(request);
  },
  {
    cookieConfig: { maxAge: 60 * 60 * 24 * 30 },
  },
);

export default handler;
export { handler as proxy };

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
