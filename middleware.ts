import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";
import { isAnonymousSeoRoute } from "./shared/seo-public-routes";

const intlMiddleware = createMiddleware(routing);

function usesIntlRouting(pathname: string) {
  if (pathname === "/") {
    return true;
  }

  return routing.locales.some(
    (locale) =>
      pathname === `/${locale}` ||
      pathname.startsWith(`/${locale}/`),
  );
}

// Keep the existing Clerk behavior for admin, APIs, and other routes.
const authenticatedMiddleware = clerkMiddleware(async (_auth, request) => {
  if (usesIntlRouting(request.nextUrl.pathname)) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // Public song HTML must be fetchable without Clerk's document-navigation
  // handshake, even when Accept: text/html and no browser cookies are sent.
  if (isAnonymousSeoRoute(request.nextUrl.pathname)) {
    return intlMiddleware(request);
  }

  return authenticatedMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
