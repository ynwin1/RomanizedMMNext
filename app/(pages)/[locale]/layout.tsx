import type { Metadata } from "next";
import { lusitana } from "@/app/components/fonts/fonts";
import "../../globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Navbar} from "@/app/components/navbar/Navbar";
import Footer from "@/app/components/footer/Footer";

export const metadata: Metadata = {
    title: {
        template: "%s | RomanizedMM",
        default: "RomanizedMM",
    },
    description: "Spreading Burmese music to the World",
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}));
}

export default async function RootLayout({
                                       children,
                                       params
                                   }: {
    children: React.ReactNode;
    params: Promise<{ locale: string}>;
}) {
    const locale = (await params).locale;

    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale}>
        <body className={`${lusitana.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
            {children}
        </NextIntlClientProvider>
        </body>
        </html>
    );
}