import React from 'react';
import Trivia from "@/app/components/guess-the-lyrics/Trivia";
import Player from "@/app/components/video-player/Player";
import {Metadata} from "next";
import { GameMode } from "@/modules/trivia/domain/game-mode";
import {songService} from "@/modules/songs";
import {triviaService} from "@/modules/trivia";
import { logger } from "@/infrastructure/logging/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: 'Guess The Lyrics',
    description: 'Test your knowledge of Myanmar songs by guessing the lyrics of the songs!',
    openGraph: {
        title: 'Guess The Lyrics',
        description: 'Test your knowledge of Myanmar songs by guessing the lyrics of the songs!',
        images: [
            {
                url: 'https://i.imgur.com/epALhvr.png',
                width: 800,
                height: 600,
                alt: 'Guess The Lyrics',
            }
        ],
        type: 'website',
        siteName: 'RomanizedMM',
    }
};

const Page = async () => {
    let allSongs = [];
    let minScore = 0;
    const gameMode: GameMode = GameMode.GuessTheLyrics;
    try {
        allSongs = await songService.getGuessLyricsSongs();
        minScore = await triviaService.getMinimumScore(gameMode);
    } catch (e) {
        logger.error("Failed to load Guess The Lyrics data", e);
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
