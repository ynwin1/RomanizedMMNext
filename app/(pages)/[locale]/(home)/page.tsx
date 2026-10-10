import Link from "next/link";
import SearchBar from "@/app/components/searchbar/SearchBar";
import HomeVideo from "@/app/components/home/HomeVideo";
import {Navbar} from "@/app/components/navbar/Navbar";
import {setRequestLocale} from "next-intl/server";
import React from "react";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Home",
    description: "Welcome to RomanizedMM! Discover the lyrics of your favorite Myanmar songs here!",
    keywords: "Myanmar, song, lyrics, Romanized, Burmese, music, romanization, Myanmar songs, Myanmar music, Myanmar lyrics",
    category: "Music",
    creator: "RomanizedMM",
    publisher: "RomanizedMM",
    openGraph: {
        title: "RomanizedMM",
        description: "Discover the lyrics of your favorite Myanmar songs and sing along!",
        type: "website",
        url: "https://www.romanizedmm.com",
        siteName: "RomanizedMM",
        images: [
            {
                url: "https://i.imgur.com/YqMt5kd.png",
                width: 800,
                height: 600,
                alt: "RomanizedMM",
            },
        ],
        alternateLocale: ["en", "my"],
        locale: "en",
    }
}

interface HomeProps {
    params: Promise<{locale: string}>;
}

export default async function Home({params}: HomeProps) {
    const {locale} = await params;
    // Enable static rendering
    setRequestLocale(locale);

    return (
        <div className="min-h-screen bg-[#171613] text-[#F3EDE3]">
            <Navbar />
            <main>
                <section aria-labelledby="homepage-heading" className="mx-auto grid w-full max-w-7xl items-center gap-9 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:min-h-[650px] lg:grid-cols-2 lg:gap-12 lg:py-20">
                    <div className="min-w-0">
                        <p className="mb-4 text-sm font-semibold text-[#DAA276]">RomanizedMM</p>
                        <h1 id="homepage-heading" className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.75rem]">
                            Sing Myanmar, Globally!
                        </h1>
                        <p className="mt-5 max-w-lg text-base leading-8 text-[#CBBEAE] sm:text-lg">
                            Find your favourite Myanmar songs. Read the Burmese lyrics, follow along in romanized Burmese, and discover what they mean.
                        </p>
                        <div className="mt-7 max-w-xl"><SearchBar /></div>
                        <nav aria-label="Explore Myanmar music" className="mt-6 flex flex-wrap gap-x-7 gap-y-3 px-4 text-sm">
                            <Link href={`/${locale}/song-catalogue`} className="inline-flex min-h-11 items-center font-semibold text-[#DAA276] underline decoration-[#DAA276] underline-offset-8 hover:text-[#F3EDE3]">
                                Browse songs →
                            </Link>
                            <Link href={`/${locale}/artist-catalogue`} className="inline-flex min-h-11 items-center font-semibold text-[#F3EDE3] underline decoration-[#665342] underline-offset-8 hover:text-[#DAA276]">
                                Explore artists →
                            </Link>
                        </nav>
                    </div>
                    <div className="min-w-0">
                        <div className="overflow-hidden border border-[#514335] bg-[#24211E]">
                            <HomeVideo />
                        </div>
                        <p className="mt-3 text-right text-xs text-[#CBBEAE]">A little piece of Myanmar music.</p>
                    </div>
                </section>
            </main>
        </div>
    );
}
