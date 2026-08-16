import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOCALE_COOKIE, parseAdminLocale } from "./i18n/admin-locale";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
const isAdminLogin = createRouteMatcher(["/admin/login"]);
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

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isPublicApi(request)) {
    return NextResponse.next();
  }

  if (isAdminRoute(request)) {
    const authenticated = await convexAuth.isAuthenticated();
    if (isAdminLogin(request)) {
      if (authenticated) {
        return nextjsMiddlewareRedirect(request, "/admin");
      }
      return continueAdmin(request);
    }
    if (!authenticated) {
      return nextjsMiddlewareRedirect(request, "/admin/login");
    }
    return continueAdmin(request);
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
