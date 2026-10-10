import Link from "next/link";
import SearchBar from "@/app/components/searchbar/SearchBar";
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
        <div className="min-h-[calc(100dvh-4rem)] bg-[#171613] text-[#F3EDE3]">
            <Navbar />
            <main className="relative isolate overflow-hidden">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute right-[-12rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[#5B3925]/20 blur-[110px]" />
                    <div className="absolute bottom-0 left-[-12rem] h-[24rem] w-[24rem] rounded-full bg-[#DAA276]/[0.06] blur-[100px]" />
                </div>
                <section aria-labelledby="homepage-heading" className="mx-auto grid min-h-[min(760px,calc(100dvh-68px))] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)] lg:gap-14 lg:py-24">
                    <div className="relative z-10 max-w-2xl">
                        <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#DAA276]">
                            <span className="h-px w-9 bg-[#DAA276]" aria-hidden="true" />
                            Myanmar music, without borders
                        </p>
                        <h1 id="homepage-heading" className="max-w-[15ch] text-[clamp(2.9rem,6.2vw,5.8rem)] font-semibold leading-[1.08] tracking-[-0.045em]">
                            Every song <span className="text-[#DAA276]">has a story.</span>
                        </h1>
                        <p className="mt-7 max-w-xl text-base leading-8 text-[#CBBEAE] sm:text-lg">
                            Discover Myanmar songs through Burmese lyrics, easy-to-follow romanization, and English meaning. Read along, understand every line, and find music worth sharing.
                        </p>
                        <div className="mt-9 max-w-xl">
                            <SearchBar />
                        </div>
                        <nav aria-label="Start exploring Myanmar music" className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4 px-4 text-sm font-semibold">
                            <Link href={`/${locale}/song-catalogue`} className="inline-flex min-h-11 items-center border-b border-[#DAA276] text-[#DAA276] transition-colors hover:text-[#F3EDE3] focus-visible:outline-offset-4">
                                Explore songs <span aria-hidden="true" className="ml-2">↗</span>
                            </Link>
                            <Link href={`/${locale}/artist-catalogue`} className="inline-flex min-h-11 items-center border-b border-[#514335] text-[#F3EDE3] transition-colors hover:border-[#DAA276] hover:text-[#DAA276] focus-visible:outline-offset-4">
                                Browse artists <span aria-hidden="true" className="ml-2">↗</span>
                            </Link>
                        </nav>
                    </div>

                    <div aria-hidden="true" className="relative hidden min-h-[470px] items-center justify-center lg:flex">
                        <div className="absolute h-[370px] w-[370px] rounded-full border border-[#665342]/40" />
                        <div className="absolute h-[285px] w-[285px] rounded-full border border-[#665342]/50" />
                        <div className="absolute h-[195px] w-[195px] rounded-full border border-[#665342]/70" />
                        <div className="absolute flex h-24 w-24 items-center justify-center rounded-full border border-[#DAA276]/70 bg-[#302A24] text-4xl text-[#DAA276]">♫</div>
                        <div className="absolute left-1 top-16 max-w-[220px] -rotate-6 border border-[#665342] bg-[#24211E] px-5 py-4 shadow-2xl">
                            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#DAA276]">01 / Original</p>
                            <p className="text-xl leading-relaxed">မြန်မာသီချင်း</p>
                        </div>
                        <div className="absolute bottom-14 right-0 max-w-[245px] rotate-3 border border-[#665342] bg-[#302A24] px-5 py-4 shadow-2xl">
                            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#DAA276]">02 / Read along</p>
                            <p className="text-lg text-[#F3EDE3]">Myanmar tha chin</p>
                            <p className="mt-2 text-xs text-[#CBBEAE]">Music that travels with you.</p>
                        </div>
                    </div>
                </section>
                <div className="mx-auto flex max-w-7xl items-center gap-4 border-t border-[#514335] px-5 py-6 text-xs text-[#CBBEAE] sm:px-8">
                    <span className="font-semibold uppercase tracking-[0.16em] text-[#DAA276]">Explore beyond search</span>
                    <span aria-hidden="true" className="h-px flex-1 bg-[#514335]" />
                    <Link href={`/${locale}/song-catalogue`} className="text-[#F3EDE3] hover:text-[#DAA276]">Browse the catalogue →</Link>
                </div>
            </main>
        </div>
    );
}
