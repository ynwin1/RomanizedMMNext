import {clerkMiddleware, createRouteMatcher} from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import {NextResponse} from "next/server";
import {Roles} from "@/types/globals";

const intlMiddleware = createMiddleware(routing);

const isAdminRoute = createRouteMatcher(['/(en|my)?/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
    const role: Roles | undefined = (await auth()).sessionClaims?.metadata?.role;

    const isAdminPath = isAdminRoute(req);
    const isAdminRole = role === 'admin';
    if (isAdminPath && !isAdminRole) {
        console.log('Unauthorized access to admin route');
        const url = new URL('/', req.url)
        return NextResponse.redirect(url)
    }

    return intlMiddleware(req);
});

export const config = {
    matcher: [
        '/',
        '/(en|my)/:path*',
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ]
};