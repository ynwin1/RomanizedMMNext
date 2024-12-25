import React from 'react';
import Song from "@/app/model/Song";
import Trivia from "@/app/components/guess-the-lyrics/Trivia";
import Player from "@/app/components/video-player/Player";
import connectDB from "@/app/lib/mongodb";

const Page = async () => {
    let allSongs = [];
    try {
        await connectDB();
        allSongs = await Song.find({}).select("songName romanized burmese -_id").lean();
    } catch (e) {
        console.error(e);
        throw new Error("Failed to fetch songs in GuessTheLyrics. Please try again later.");
    }

    return (
        <main className="flex flex-col justify-center items-center min-h-screen gap-6">
            <div className="fixed inset-0 w-full h-full">
                <Player src="/RMBG.mp4" />
            </div>
            <Trivia songs={allSongs} />
        </main>
    )
}
export default Page
