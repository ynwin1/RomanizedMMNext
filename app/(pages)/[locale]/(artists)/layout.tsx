import React from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Navbar} from "@/app/components/navbar/Navbar";

export default async function LocaleLayout({
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
        <NextIntlClientProvider messages={messages}>
            <Navbar/>
            <main className="flex-grow">
                {children}
            </main>
        </NextIntlClientProvider>
    );
}