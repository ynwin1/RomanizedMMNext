import React from 'react'
import Link from "next/link";
import {Metadata} from "next";
import Pagination from "@/app/components/catalogue/Pagination";
import SongCard from "@/app/components/catalogue/SongCard";
import {getTranslations} from 'next-intl/server';
import ItemsPerPageSelector from "@/app/components/items-selector/ItemsSelector";
import CatalogueSearch from "@/app/components/catalogue/CatalogueSearch";
import {filterCatalogueSongs, normalizeCatalogueQuery} from "@/app/components/catalogue/catalogue-filter";
import {songService} from "@/modules/songs";

export const metadata: Metadata = {
    title: 'Song Catalogue',
    description: 'A catalogue of all the songs on RomanizedMM. Find the lyrics of your favorite Myanmar songs here!',
}

export type SongCataloguePageProps = {
    params: Promise<{locale: string}>;
    searchParams: Promise<{page?: string, limit?: number, q?: string}>;
};

const Page = async ({ params, searchParams }: SongCataloguePageProps) => {
    const { locale } = await params;
    const { page, limit, q } = await searchParams;
    const requestedPage = Math.max(1, Number(page) || 1);
    const limitPerPage: number = Math.min(100, Math.max(1, Number(limit) || 10));

    const translator = await getTranslations("SongCatalogue");

    const allSongs = await songService.getCatalogueSongs();

    // sort songs by songName
    const sortedSongs = allSongs
        .map((song: any) => ({
            ...song,
            sortKey: locale === "en"
                ? song.songName
                : song.songName.split("(")[1]?.replace(/[()]/g, "").trim() || song.songName
        }))
        .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));

    const query = normalizeCatalogueQuery(q || "");
    const matchingSongs = filterCatalogueSongs(sortedSongs, query);
    const totalPages: number = Math.ceil(matchingSongs.length / limitPerPage);
    const currentPage = Math.min(requestedPage, Math.max(1, totalPages));
    const songsToShow = matchingSongs.slice((currentPage - 1) * limitPerPage, currentPage * limitPerPage);

    return (
        <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6">
            <header className="mb-8 border-b border-theme-border pb-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Explore the collection</p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{translator("title")}</h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{translator("description")}</p>
                <Link href={`/${locale}/song-request`} className="mt-5 inline-flex min-h-11 items-center border-b border-accent text-sm font-semibold text-accent hover:text-foreground">{translator("requestSong")} →</Link>
            </header>
            <div className="mb-7 flex flex-col gap-4 rounded-xl border border-theme-border bg-surface p-4 sm:p-5">
                <CatalogueSearch initialQuery={query} locale={locale} />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-theme-border-subtle pt-3">
                    <p role="status" className="text-sm text-muted">
                        {query
                            ? `${matchingSongs.length} ${locale === "my" ? "ပုဒ် တွေ့ရှိသည်" : matchingSongs.length === 1 ? "song found" : "songs found"}`
                            : `${sortedSongs.length} ${locale === "my" ? "သီချင်းပုဒ်" : "songs in the collection"}`}
                    </p>
                    <ItemsPerPageSelector />
                </div>
            </div>
            {songsToShow.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                    {songsToShow.map((song: any) => <SongCard key={song.mmid} locale={locale} song={song} />)}
                </div>
            ) : (
                <div className="rounded-xl border border-theme-border bg-surface px-6 py-12 text-center">
                    <h2 className="text-xl font-semibold text-foreground">{locale === "my" ? "သီချင်း မတွေ့ပါ" : "No songs found"}</h2>
                    <p className="mt-2 text-sm text-muted">{locale === "my" ? "အခြား သီချင်း သို့မဟုတ် အဆိုတော်အမည်ဖြင့် ထပ်မံရှာကြည့်ပါ။" : "Try another song title or artist name."}</p>
                    {query && <Link href={`/${locale}/song-catalogue`} className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4">{locale === "my" ? "သီချင်းအားလုံး ကြည့်ရန်" : "View all songs"}</Link>}
                </div>
            )}
            {totalPages > 1 && (
                <nav aria-label="Song catalogue pages" className="mt-10 flex flex-col items-center gap-4">
                    <p className="text-sm text-muted">{locale === "my" ? `စာမျက်နှာ ${currentPage} / ${totalPages}` : `Page ${currentPage} of ${totalPages}`}</p>
                    <Pagination totalPages={totalPages} />
                </nav>
            )}
        </main>
    );
};
export default Page
