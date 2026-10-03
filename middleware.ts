import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { routing } from "./i18n/routing";

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

export default clerkMiddleware(async (_auth, request) => {
  if (usesIntlRouting(request.nextUrl.pathname)) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
