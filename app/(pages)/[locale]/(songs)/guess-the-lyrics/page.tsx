import React from 'react';
import Song from "@/app/model/Song";
import Trivia from "@/app/components/guess-the-lyrics/Trivia";
import Player from "@/app/components/video-player/Player";
import connectDB from "@/app/lib/mongodb";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: 'Guess The Lyrics',
    description: 'Test your knowledge of Myanmar songs by guessing the lyrics of the songs!',
};

const Page = async () => {
    await connectDB();
    const allSongs = await Song.find({}).select("songName romanized burmese -_id").lean();

    return (
        <main className="flex flex-col justify-center items-center gap-6 min-h-screen">
            <div className="fixed inset-0 w-full h-full">
                <Player src="/RMBG.mp4" />
            </div>
            <Trivia songs={allSongs} />
        </main>
    )
}
export default Page
