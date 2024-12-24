import React from 'react'
import Link from "next/link";

interface TableProps {
    locale: string;
    sortedSongs: any[];
    currentPage: number;
}

const Table = ({locale, sortedSongs, currentPage}: TableProps) => {
    // slice the songs array to display only 10 songs based on currentPage
    const startIndex = (currentPage - 1) * 10;
    const endIndex = currentPage * 10;

    const songs = sortedSongs.slice(startIndex, endIndex);

    return (
        <table className="border-2 rounded-2xl w-[75vw] max-md:w-[85vw] max-md:text-sm">
            <thead className="bg-gray-600 text-white">
            <tr>
                <th className="border border-gray-400 p-2 text-left w-[35%]">Song</th>
                <th className="border border-gray-400 p-2 text-left w-[55%]">Artist(s)</th>
                <th className="border border-gray-400 p-2 text-left w-[10%]">Link</th>
            </tr>
            </thead>
            <tbody>
            {songs.map((song: any) => {
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
    )
}
export default Table
