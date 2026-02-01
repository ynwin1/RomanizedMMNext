import React from 'react';
import Song from "@/app/model/Song";
import Trivia from "@/app/components/guess-the-song/Trivia";
import Player from "@/app/components/video-player/Player";
import connectDB from "@/app/lib/mongodb";
import {Metadata} from "next";
import {findMinimumTriviaScore} from "@/app/lib/action";
import { GameMode } from "@/app/lib/constants";

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
        await connectDB();
        allSongs = await Song.find({}).select("songName youtubeLink mmid -_id").lean();
        minScore = await findMinimumTriviaScore(gameMode);
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
