import React from 'react'
import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";
import { notFound } from "next/navigation";
import SearchBar from "@/app/components/searchbar/SearchBar";
import LyricsSection from "@/app/components/music-box/LyricsSection";

interface SongPageProps {
    params: {
        id: string;
        name: string;
    },
    searchParams: {
        lang: string,
        option: string
    }
}

const Page = async ({ params, searchParams }: SongPageProps) => {
    const { id, name } = params;
    const { lang = 'en', option = 'romanized' } = searchParams;

    await connectDB();
    const song = await Song.findOne({ mmid: id}).lean();

    if (!song) {
        return notFound();
    }

    function formatLyrics(lyrics: string) {
        return lyrics.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                <br/>
            </React.Fragment>
        ))
    }

    return (
        <div className="flex flex-col gap-10 mt-5 mb-8 justify-center items-center">
            <SearchBar />

            {/* Album Cover */}
            {song.imageLink && <img src={song.imageLink} alt={song.songName} className="w-40 rounded-xl" />}

            {/* Song Description */}
            <p className="text-xl text-wrap text-center leading-10 max-md:w-[80vw] md:w-[60vw] max-md:text-lg max-md:leading-8">{song.about}</p>

            {/* About */}
            <div className="text-lg border-2 border-white p-4 rounded-2xl max-md:w-[80vw] md:w-[40vw]">
                <p className="mb-6">{song.songName}</p>
                <p className="pb-2"><u>Artist</u>: {song.artistName}</p>
                <p className="pb-2"><u>Album</u>: {song.albumName}</p>
                <p className="pb-2"><u>Genre</u>: {song.genre}</p>
                <p className="pb-2 leading-8"><u>When to listen</u>: {song.whenToListen}</p>
            </div>

            {/* Medias */}
            <div className="flex flex-row gap-20 border-white border-2 rounded-2xl max-md:w-[70vw] pl-3 pr-3 pt-2 pb-2">
                {song.youtubeLink &&
                <button>
                    <img src="/media/youtube.png" alt="youtube" className="w-16" />
                </button>
                }
                {song.spotifyLink &&
                <button>
                    <img src="/media/spotify.png" alt="spotify" className="w-16" />
                </button>
                }
                {song.appleMusicLink &&
                <button>
                    <img src="/media/appleMusic.png" alt="apple music" className="w-16" />
                </button>
                }
            </div>

            {/* Radio Buttons & Lyrics */}
            <LyricsSection romanized={song.romanized} burmese={song.burmese} meaning={song.meaning} />
        </div>
    )
}
export default Page
