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
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main>
                <section aria-labelledby="homepage-heading" className="mx-auto grid w-full max-w-7xl items-center gap-9 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:min-h-[650px] lg:grid-cols-2 lg:gap-12 lg:py-20">
                    <div className="min-w-0">
                        <p className="mb-4 text-sm font-semibold text-accent">RomanizedMM</p>
                        <h1 id="homepage-heading" className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.75rem]">
                            Sing Myanmar, Globally!
                        </h1>
                        <p className="mt-5 max-w-lg text-base leading-8 text-muted sm:text-lg">
                            Find your favourite Myanmar songs. Read the Burmese lyrics, follow along in romanized Burmese, and discover what they mean.
                        </p>
                        <div className="mt-7 max-w-xl"><SearchBar /></div>
                        <nav aria-label="Explore Myanmar music" className="mt-6 flex flex-wrap gap-x-7 gap-y-3 px-4 text-sm">
                            <Link href={`/${locale}/song-catalogue`} className="inline-flex min-h-11 items-center font-semibold text-accent underline decoration-accent underline-offset-8 hover:text-foreground">
                                Browse songs →
                            </Link>
                            <Link href={`/${locale}/artist-catalogue`} className="inline-flex min-h-11 items-center font-semibold text-foreground underline decoration-theme-border underline-offset-8 hover:text-accent">
                                Explore artists →
                            </Link>
                        </nav>
                    </div>
                    <div className="min-w-0">
                        <div className="overflow-hidden border border-theme-border bg-surface">
                            <HomeVideo />
                        </div>
                        <p className="mt-3 text-right text-xs text-muted">A little piece of Myanmar music.</p>
                    </div>
                </section>
                <section aria-labelledby="latest-songs-heading" className="border-t border-theme-border bg-background">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
                        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="mb-2 text-sm font-medium text-accent">From our collection</p>
                                <h2 id="latest-songs-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Recently added songs</h2>
                                <p className="mt-2 text-sm text-muted">New lyrics to read and sing along with.</p>
                            </div>
                            <Link href={`/${locale}/song-catalogue`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">
                                See all songs →
                            </Link>
                        </div>
                        {recentSongs.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-2">
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
                            <p className="border border-theme-border bg-surface px-5 py-7 text-sm text-muted">
                                Our song collection is being updated. Explore the full catalogue in the meantime.
                            </p>
                        )}
                    </div>
                </section>
                <section aria-labelledby="explore-more-heading" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
                    <div className="mb-8">
                        <p className="mb-2 text-sm font-medium text-accent">Something more to try</p>
                        <h2 id="explore-more-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Explore RomanizedMM</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">There's more to do than searching for lyrics.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <article className="flex h-full flex-col border border-theme-border bg-surface p-6 sm:p-8">
                            <p className="mb-3 text-sm font-semibold text-accent">Music games</p>
                            <h3 className="text-xl font-semibold">Know your Myanmar songs?</h3>
                            <p className="mt-3 flex-1 text-sm leading-7 text-muted">Guess the song from a short clip or complete the missing lyrics.</p>
                            <Link href={`/${locale}/game-modes`} className="mt-6 inline-flex min-h-11 items-center self-start border-b border-accent text-sm font-semibold text-accent hover:text-foreground">Play the games →</Link>
                        </article>
                        <article className="flex h-full flex-col border border-theme-border bg-surface p-6 sm:p-8">
                            <p className="mb-3 text-sm font-semibold text-accent">Song requests</p>
                            <h3 className="text-xl font-semibold">Can't find a song?</h3>
                            <p className="mt-3 flex-1 text-sm leading-7 text-muted">New requests are temporarily paused. Check the queue and recently added songs.</p>
                            <Link href={`/${locale}/song-request`} className="mt-6 inline-flex min-h-11 items-center self-start border-b border-accent text-sm font-semibold text-accent hover:text-foreground">View request status →</Link>
                        </article>
                    </div>
                </section>
                <section aria-labelledby="more-music-heading" className="border-t border-theme-border bg-surface">
                    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <div>
                            <h2 id="more-music-heading" className="text-xl font-semibold text-foreground sm:text-2xl">Keep exploring Myanmar music</h2>
                            <p className="mt-2 max-w-xl text-sm leading-7 text-muted">Browse more songs and get to know the artists behind them.</p>
                        </div>
                        <Link href={`/${locale}/artist-catalogue`} className="inline-flex min-h-11 items-center self-start border-b border-accent text-sm font-semibold text-accent hover:text-foreground">Browse artists →</Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
