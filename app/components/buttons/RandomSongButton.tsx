"use client";
import React from 'react';
import {useRouter} from "next/navigation";
import { extractSongName } from '@/app/lib/utils';

const RandomSongButton = ({ locale }: { locale: string }) => {
    const router = useRouter();

    const redirectToRandomSong = async () => {
        try {
            const response = await fetch("/api/song/random");
            const data = await response.json();

            // process data
            const song = data.data;
            const songName = extractSongName(song.songName);
            const urlName = songName.engName.replace(/\s/g, '');
            const mmid = song.mmid;

            // Use router.push for client-side navigation
            router.push(`/${locale}/song/${urlName}/${mmid}`);
        } catch (error) {
            console.error('Error fetching random song:', error);
        }
    };

    return (
        <button 
            type="button"
            className="bg-green-600 text-white rounded-2xl px-4 py-2 text-lg font-bold hover:bg-green-800 transition-all duration-300"
            onClick={redirectToRandomSong}
        >
            Surprise!
        </button>
    );
};

export default RandomSongButton;