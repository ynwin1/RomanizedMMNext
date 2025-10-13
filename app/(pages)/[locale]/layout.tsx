import type { Metadata } from "next";
import { lusitana } from "@/app/components/fonts/fonts";
import "../../globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {GoogleAnalytics} from "@/app/components/google-analytics/GoogleAnalytics";
import Footer from "@/app/components/footer/Footer";
import CountryCounter from "@/app/components/country-counter/country-counter";
import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs'

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

    const eqMsgs: string[] = [
        "URGENT: Support Myanmar Earthquake Relief",
        "Over 4,000 deaths by 7.7 magnitude earthquake",
        "10000+ injured, many families displaced",
        "Donate medical supplies, food, and shelter materials",
        "Support local relief organizations on the ground",
        "Emergency aid needed in rural regions",
        "Click here to browse charities",
    ];

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
        <ClerkProvider>
            <html lang={locale}>
            <head>
                <script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1042163793764562"
                    crossOrigin="anonymous"
                ></script>
            </head>
            <body className={`${lusitana.className} antialiased`}>
            {/* <RotatingText messages={eqMsgs} link="https://rescuemyanmar.carrd.co/" /> */}
            <CountryCounter />

            <NextIntlClientProvider messages={messages}>
                {children}
                <GoogleAnalytics gaId="G-2HM6B3Q5D0" />
            </NextIntlClientProvider>
            <Footer />
            </body>
            </html>
        </ClerkProvider>

    );
}