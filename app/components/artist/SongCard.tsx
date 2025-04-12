import React from 'react'
import Image from "next/image";
import {extractSongName} from "@/app/lib/utils";
import Link from "next/link";

interface SongCardProps {
    songName: string;
    mmid: number;
    imageLink: string;
    locale: string;
}
const SongCard = ({songName, mmid, imageLink, locale}: SongCardProps) => {

    const songNames = extractSongName(songName);
    const songNameURL = songNames.engName.replace(/\s/g, "").trim();

    return (
        <div className="flex flex-row justify-items-center p-4 border-white border-2 rounded-lg gap-x-4">
            {/* Song Image */}
            {imageLink !== "" && imageLink !== null && imageLink !== undefined &&
                <Image src={imageLink} alt={songName} width={100} height={100} className="rounded-lg" />
            }
            {/* Song Details */}
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold">
                    {locale === "en" ? songNames.engName : songNames.mmName}
                </h3>
                <Link href={`/${locale}/song/${songNameURL}/${mmid}`}>
                    <button className="text-white w-24 bg-blue-600 p-2 rounded-lg mt-4 hover:bg-blue-400 transition-all duration-300 ">
                        View
                    </button>
                </Link>
            </div>
        </div>
    )
}
export default SongCard
