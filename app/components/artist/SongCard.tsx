import React from 'react'
import Image from "next/image";
import {redirect} from "next/navigation";

interface SongCardProps {
    songName: string;
    mmid: number;
    imageLink: string;
    about: string;
}
const SongCard = ({songName, mmid, imageLink, about}: SongCardProps) => {
    return (
        <div className="flex flex-row justify-around items-center p-4 border-white border-2 rounded-lg gap-x-4">
            {/* Song Image */}
            <Image src={imageLink} alt={songName} width={100} height={100} className="rounded-lg" />
            {/* Song Details */}
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">{songName}</h3>
                <p className="text-sm text-gray-400">{about}</p>
                <button
                    className="text-white bg-blue-600 p-2 rounded-lg mt-4 hover:bg-blue-400 transition-all duration-300">
                    View
                </button>
            </div>
        </div>
    )
}
export default SongCard
