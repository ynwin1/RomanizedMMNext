import React from 'react';
import Trivia from "@/app/components/guess-the-song/Trivia";
import Player from "@/app/components/video-player/Player";
import {Metadata} from "next";
import { GameMode } from "@/app/lib/constants";
import {songService} from "@/modules/songs";
import {triviaService} from "@/modules/trivia";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: 'Guess The Song',
    description: 'Test your knowledge of Myanmar songs by guessing the songs!',
    openGraph: {
        title: 'Guess The Song',
        description: 'Test your knowledge of Myanmar songs by guessing the songs!',
        images: [
            {
                url: 'https://i.imgur.com/epALhvr.png',
                width: 800,
                height: 600,
                alt: 'Guess The Song',
            }
        ],
        type: 'website',
        siteName: 'RomanizedMM',
    }
};

const Page = async () => {
    let allSongs = [];
    let minScore = 0;
    const gameMode: GameMode = GameMode.GuessTheSong;
    try {
        allSongs = await songService.getGuessSongRecords();
        minScore = await triviaService.getMinimumScore(gameMode);
    } catch (e) {
        console.error(e);
        throw new Error("Failed to fetch songs in GuessTheLyrics. Please try again later.");
    }

    return (
        <main className="flex flex-col justify-center items-center gap-6 min-h-screen">
            <div className="fixed inset-0 w-full h-full">
                <Player src="/GTL.mp4" />
            </div>
            <Trivia songs={allSongs} minScore={minScore}/>
        </main>
    )
}
export default Page
