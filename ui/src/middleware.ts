import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import {
  middlewareMatchers,
  shouldApplyLocaleMiddleware,
} from "@/lib/middleware-routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return;
  }

  if (pathname.startsWith("/studio/login")) {
    if (request.auth) {
      return Response.redirect(new URL("/studio", request.url));
    }
    return;
  }

  if (pathname.startsWith("/studio") || pathname.startsWith("/api/studio")) {
    if (!request.auth?.user) {
      if (pathname.startsWith("/api/")) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = new URL("/studio/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }
    return;
  }

  if (!shouldApplyLocaleMiddleware(pathname)) {
    return;
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: [...middlewareMatchers],
};
