import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();
export const intlMiddleware = createMiddleware(routing);

export const config = {
    // Match only internationalized pathnames
    matcher: [
        '/', '/(en|my)/:path*',
        // Clerk: Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Clerk: Always run for API routes
        '/(api|trpc)(.*)',
    ]
};