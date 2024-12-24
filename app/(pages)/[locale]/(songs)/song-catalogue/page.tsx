import React from 'react'
import Song from "@/app/model/Song";
import Link from "next/link";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: 'Song Catalogue',
    description: 'A catalogue of all the songs on RomanizedMM. Find the lyrics of your favorite Myanmar songs here!',
}

export type SongCataloguePageProps = {
    params: {
        locale: string;
    }
};

const Page = async ({ params }: SongCataloguePageProps) => {
    const { locale } = params;
    const allSongs = await Song.find({}).select("songName artistName mmid").lean();

    // sort songs by songName
    const sortedSongs = allSongs
        .map((song: any) => ({
            ...song,
            sortKey: locale === "en"
                ? song.songName
                : song.songName.split("(")[1]?.replace(/[()]/g, "").trim() || song.songName
        }))
        .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));

    return (
        <main className="flex flex-col items-center justify-center mb-8">
            <h1 className="text-3xl font-bold mt-8">Song Catalogue</h1>
            <h3 className="text-xl text-center mt-8 w-60vw max-md:w-[80vw] max-md:text-lg ">A catalogue of all the songs on RomanizedMM</h3>
            <Link href={`/${locale}/song-request`}>
                <button className="bg-blue-600 text-white rounded-2xl px-4 py-2 text-lg font-bold hover:bg-blue-400 mt-8">
                    Request A Song
                </button>
            </Link>
            <div className="flex justify-center items-center mt-8 border-2 border-gray-400">
                <table className="border-2 rounded-2xl w-[75vw] max-md:w-[85vw]">
                    <thead className="bg-gray-600 text-white">
                    <tr>
                        <th className="border border-gray-400 p-2 text-left w-[30%]">Song</th>
                        <th className="border border-gray-400 p-2 text-left w-[60%]">Artist(s)</th>
                        <th className="border border-gray-400 p-2 text-left w-[10%]">Link</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedSongs.map((song: any) => {
                        const engName = song.songName.split("(")[0];
                        const burmeseName = song.songName.split("(")[1]?.replace(/[()]/g, "").trim();
                        const urlSongName = engName.replace(/\s/g, "");
                        const nameToDisplay = locale === "en" ? engName : burmeseName || engName;
                        return (
                            <tr key={song.mmid}>
                                <td className="border border-gray-400 p-2">
                                    <p className="text-white">{nameToDisplay}</p>
                                </td>
                                <td className="border border-gray-400 p-2">{song.artistName}</td>
                                <td className="border border-gray-400 p-2 hover:bg-gray-600">
                                    <Link href={`/${locale}/song/${urlSongName}/${song.mmid}`}>
                                        <u>View</u>
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            {/*<div className="flex flex-col items-center justify-center gap-4 mt-8 border-2 border-white rounded-2xl w-[80vw]">*/}
            {/*    {sortedSongs.map((song: any) => {*/}
            {/*        const engName = song.songName.split("(")[0];*/}
            {/*        const burmeseName = song.songName.split("(")[1]?.replace(/[()]/g, "").trim();*/}
            {/*        const urlSongName = engName.replace(/\s/g, "");*/}
            {/*        const nameToDisplay = locale === "en" ? engName : burmeseName || engName;*/}
            {/*        return (*/}
            {/*            <Link href={`/${locale}/song/${urlSongName}/${song.mmid}`} key={song.mmid}>*/}
            {/*                <div className="flex flex-row justify-center bg-white mt-6 rounded-2xl p-3 text-white w-[40vw] max-md:w-[60vw] hover:opacity-80">*/}
            {/*                    <p className="text-base cursor-pointer text-black">{nameToDisplay} - {song.artistName}</p>*/}
            {/*                </div>*/}
            {/*            </Link>*/}
            {/*        );*/}
            {/*    })}*/}
            {/*</div>*/}
        </main>
    )
}
export default Page
