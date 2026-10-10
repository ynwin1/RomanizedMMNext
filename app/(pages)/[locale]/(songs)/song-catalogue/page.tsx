import React from 'react'
import Link from "next/link";
import {Metadata} from "next";
import Pagination from "@/app/components/catalogue/Pagination";
import SongCard from "@/app/components/catalogue/SongCard";
import {getTranslations} from 'next-intl/server';
import ItemsPerPageSelector from "@/app/components/items-selector/ItemsSelector";
import {songService} from "@/modules/songs";

export const metadata: Metadata = {
    title: 'Song Catalogue',
    description: 'A catalogue of all the songs on RomanizedMM. Find the lyrics of your favorite Myanmar songs here!',
}

export type SongCataloguePageProps = {
    params: Promise<{locale: string}>;
    searchParams: Promise<{page?: string, limit?: number}>;
};

const Page = async ({ params, searchParams }: SongCataloguePageProps) => {
    const { locale } = await params;
    const { page, limit } = await searchParams;
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

    const totalPages: number = Math.ceil(sortedSongs.length / limitPerPage);
    const currentPage = Math.min(requestedPage, Math.max(1, totalPages));
    const songsToShow = sortedSongs.slice((currentPage - 1) * limitPerPage, currentPage * limitPerPage);

    return (
        <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6">
            <header className="mb-8 border-b border-[#514335] pb-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#DAA276]">Explore the collection</p>
                <h1 className="text-3xl font-bold tracking-tight text-[#F3EDE3] sm:text-4xl">{translator("title")}</h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#CBBEAE]">{translator("description")}</p>
                <Link href={`/${locale}/song-request`} className="mt-5 inline-flex min-h-11 items-center border-b border-[#DAA276] text-sm font-semibold text-[#DAA276] hover:text-[#F3EDE3]">{translator("requestSong")} →</Link>
            </header>
            <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-sm text-[#CBBEAE]">{sortedSongs.length} songs</p>
                <ItemsPerPageSelector />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {songsToShow.map((song: any) => <SongCard key={song.mmid} locale={locale} song={song} />)}
            </div>
            <nav aria-label="Song catalogue pages" className="mt-10 flex justify-center"><Pagination totalPages={totalPages} /></nav>
        </main>
    );
};
export default Page
