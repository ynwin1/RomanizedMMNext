import Link from "next/link";
import SearchBar from "@/app/components/searchbar/SearchBar";
import HomeVideo from "@/app/components/home/HomeVideo";
import SongCard from "@/app/components/catalogue/SongCard";
import {songService} from "@/modules/songs";
import {Navbar} from "@/app/components/navbar/Navbar";
import {setRequestLocale} from "next-intl/server";
import React from "react";
import {Metadata} from "next";

// Recent songs require database data at request time, not at build time.
export const dynamic = "force-dynamic";

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
    setRequestLocale(locale);
    // Query only the newest additions rather than loading the entire song catalogue.
    const recentSongs = await songService.getLatestSongs(6);

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
                <section aria-labelledby="latest-songs-heading" className="border-t border-[#514335] bg-[#1D1B18]">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
                        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="mb-2 text-sm font-medium text-[#DAA276]">From our collection</p>
                                <h2 id="latest-songs-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Recently added songs</h2>
                                <p className="mt-2 text-sm text-[#CBBEAE]">New lyrics to read and sing along with.</p>
                            </div>
                            <Link href={`/${locale}/song-catalogue`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#DAA276] underline-offset-4 hover:underline">
                                See all songs →
                            </Link>
                        </div>
                        {recentSongs.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
                                {recentSongs.map(song => (
                                    <SongCard key={song.mmid} locale={locale} song={{
                                        mmid: String(song.mmid),
                                        songName: song.songName,
                                        artistName: song.artistName,
                                        imageLink: song.imageLink ?? "",
                                    }} />
                                ))}
                            </div>
                        ) : (
                            <p className="border border-[#514335] bg-[#24211E] px-5 py-7 text-sm text-[#CBBEAE]">
                                Our song collection is being updated. Explore the full catalogue in the meantime.
                            </p>
                        )}
                    </div>
                </section>
                <section aria-labelledby="more-music-heading" className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-[#514335] px-4 py-12 sm:px-6 sm:py-14 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 id="more-music-heading" className="text-xl font-semibold text-[#F3EDE3] sm:text-2xl">Looking for more Myanmar music?</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-[#CBBEAE]">Discover songs by your favourite artists, or explore something you haven't heard before.</p>
                    </div>
                    <Link href={`/${locale}/artist-catalogue`} className="inline-flex min-h-11 shrink-0 items-center self-start border-b border-[#DAA276] font-semibold text-[#DAA276] hover:text-[#F3EDE3]">
                        Browse artists →
                    </Link>
                </section>
            </main>
        </div>
    );
}
