import React from 'react'
import Song from "@/app/model/Song";
import Link from "next/link";
import {Metadata} from "next";
import Pagination from "@/app/components/catalogue/Pagination";
import Table from "@/app/components/catalogue/Table";
import connectDB from "@/app/lib/mongodb";

export const metadata: Metadata = {
    title: 'Song Catalogue',
    description: 'A catalogue of all the songs on RomanizedMM. Find the lyrics of your favorite Myanmar songs here!',
}

export type SongCataloguePageProps = {
    params: Promise<{locale: string}>;
    searchParams: Promise<{page?: string}>;
};

const Page = async ({ params, searchParams }: SongCataloguePageProps) => {
    const { locale } = await params;
    const { page } = await searchParams;
    const currentPage: number = Number(page) || 1;

    await connectDB();
    const allSongs = await Song.find({}).select("songName artistName mmid -_id").lean();

    // sort songs by songName
    const sortedSongs = allSongs
        .map((song: any) => ({
            ...song,
            sortKey: locale === "en"
                ? song.songName
                : song.songName.split("(")[1]?.replace(/[()]/g, "").trim() || song.songName
        }))
        .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));

    const totalPages: number = Math.ceil(sortedSongs.length / 10);

    return (
        <main className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mt-8">Song Catalogue</h1>
            <h3 className="text-xl text-center mt-8 w-60vw max-md:w-[80vw] max-md:text-lg ">A catalogue of all the songs on RomanizedMM</h3>
            <Link href={`/${locale}/song-request`}>
                <button className="bg-blue-600 text-white rounded-2xl px-4 py-2 text-lg font-bold hover:bg-blue-400 mt-8">
                    Request A Song
                </button>
            </Link>
            <div className="flex justify-center items-center mt-8 border-2 border-gray-400">
                <Table locale={locale} sortedSongs={sortedSongs} currentPage={currentPage} />
            </div>
            <div className="flex w-full mt-8 mb-8 justify-center">
                <Pagination totalPages={totalPages} />
            </div>
        </main>
    )
}
export default Page
