import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Navbar} from "@/app/components/navbar/Navbar";
import Footer from "@/app/components/footer/Footer";
import { lusitana } from "@/app/components/fonts/fonts";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
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

    // Enable static rendering
    setRequestLocale(locale);

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale}>
        <body className={`${lusitana.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
            <Navbar/>
                {children}
            <Footer/>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}