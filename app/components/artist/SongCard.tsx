import React from 'react';
import Image from "next/image";
import { extractSongName } from "@/app/lib/utils";
import Link from "next/link";

interface SongCardProps {
    songName: string;
    mmid: number;
    imageLink: string;
    locale: string;
}

const SongCard = ({ songName, mmid, imageLink, locale }: SongCardProps) => {
    const songNames = extractSongName(songName);
    const songNameURL = songNames.engName.replace(/\s/g, "").trim();

    return (
        <div className="flex flex-row bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
            <div className="relative w-28 h-28 hover:scale-110 hover:cursor-pointer transition-all duration-300 shrink-0">
                {imageLink && (
                    <Image
                        src={imageLink}
                        alt={songName}
                        width={100}
                        height={100}
                        className="object-cover w-auto h-auto"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900 opacity-40"></div>
            </div>
            <div className="flex flex-col justify-between p-3 flex-grow items-center gap-4">
                <Link href={`/${locale}/song/${songNameURL}/${mmid}`}>
                    <h3 className="text-lg font-bold text-white hover:text-amber-400 hover:cursor-pointer transition-all duration-300 ">
                        {locale === "en" ? songNames.engName : songNames.mmName}
                    </h3>
                </Link>

                <Link href={`/${locale}/song/${songNameURL}/${mmid}`}>
                    <button className="bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center w-full">
                        <span>Lyrics</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default SongCard;