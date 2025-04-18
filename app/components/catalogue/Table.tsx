import React from 'react'
import Link from "next/link";
import {useTranslations} from "next-intl";
import {buildArtistNames} from "@/app/lib/utils";

interface TableProps {
    locale: string;
    songs: any[];
}

const Table = ({locale, songs}: TableProps) => {
    const translator = useTranslations("SongCatalogue");

    return (
        <table className="border-2 rounded-2xl w-[75vw] max-md:w-[85vw] max-md:text-sm">
            <thead className="bg-blue-600 text-white">
            <tr>
                <th className="border border-gray-400 p-2 text-left w-[35%]">{translator("song")}</th>
                <th className="border border-gray-400 p-2 text-left w-[55%]">{translator("artist")}</th>
                <th className="border border-gray-400 p-2 text-left w-[10%]">{translator("link")}</th>
            </tr>
            </thead>
            <tbody>
            {songs.map((song: any) => {
                const engName = song.songName.split("(")[0];
                const burmeseName = song.songName.split("(")[1]?.replace(/[()]/g, "").trim();
                const urlSongName = engName.replace(/\s/g, "");
                const nameToDisplay = locale === "en" ? engName : burmeseName || engName;
                const artistNames = buildArtistNames(song.artistName);
                const songURL = `/${locale}/song/${urlSongName}/${song.mmid}`;
                return (
                    <tr key={song.mmid}>
                        <td className="border border-gray-400 p-2">
                            <Link href={songURL}>
                            <p className="text-white">{nameToDisplay}</p>
                            </Link>
                        </td>
                        <td className="border border-gray-400 p-2">{artistNames}</td>
                        <td className="border border-gray-400 p-2 hover:bg-gray-600">
                            <Link href={songURL}>
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
