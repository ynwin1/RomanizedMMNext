import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Navbar} from "@/app/components/navbar/Navbar";
import Footer from "@/app/components/footer/Footer";
import { lusitana } from "@/app/components/fonts/fonts";

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