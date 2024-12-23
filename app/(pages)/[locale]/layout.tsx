import type { Metadata } from "next";
import { lusitana } from "@/app/components/fonts/fonts";
import "../../globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';

export const metadata: Metadata = {
    title: "RomanizedMM",
    description: "Spreading Burmese music to the World",
};

export default async function RootLayout({
                                       children,
                                       params: {locale}
                                   }: {
    children: React.ReactNode;
    params: {locale: string};
}) {
    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

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