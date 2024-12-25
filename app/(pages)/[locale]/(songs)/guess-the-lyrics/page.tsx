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
    const allSongs = await Song.find({}).select("songName romanized burmese -_id").lean();

    return (
        <main className="flex flex-col justify-center items-center h-[80vh] gap-6">
            <div className="fixed inset-0 w-full h-full">
                <Player src="/RMBG.mp4" />
            </div>
            <Trivia songs={allSongs} />
        </main>
    )
}
export default Page
