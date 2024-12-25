import React from 'react';
import Song from "@/app/model/Song";
import Trivia from "@/app/components/guess-the-lyrics/Trivia";
import Player from "@/app/components/video-player/Player";

interface GuessTheLyricsPageProps {
    params: {
        locale: string;
    }
}

const Page = async ({params}: GuessTheLyricsPageProps) => {
    const allSongs = await Song.find({}).select("songName romanized burmese").lean();

    return (
        <main className="flex flex-col justify-center items-center h-[80vh] gap-6">
            <div className="fixed inset-0 w-full h-full">
                <Player src="/RMBG.mp4" />
            </div>
            <h1 className="border-2 border-orange-200 z-10 text-5xl p-4 text-center mb-10 text-white max-md:text-4xl rounded-2xl">
                Guess The Lyrics
            </h1>
            <Trivia songs={allSongs} />
        </main>
    )
}
export default Page
