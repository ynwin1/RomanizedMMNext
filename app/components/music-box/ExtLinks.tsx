"use client";
import React, {useState} from 'react'
import YoutubePlayer from "@/app/components/youtube-player/YoutubePlayer";

interface ExtLinksProps {
    youtube: string | undefined,
    spotify: string | undefined,
    apple: string | undefined
}

function openLink(url: string) {
    window.open(url, '_blank');
}
const ExtLinks = ({youtube, spotify, apple} : ExtLinksProps) => {
    const [player, setPlayer] = useState(false);

    function togglePlayer() {
        setPlayer(!player);
    }

    return (
        <div className="flex flex-col items-center space-y-6">
            <div className="bg-transparent backdrop-blur-sm border-2 border-white rounded-2xl p-6">
                <div className="flex items-center gap-8">
                    {youtube && (
                        <button className="transform transition-all duration-300 hover:scale-90" onClick={togglePlayer}>
                            <img
                                src="/media/youtube.png"
                                alt="youtube"
                                className="w-16 max-md:w-12"
                                loading="lazy"
                            />
                        </button>
                    )}
                    {spotify && (
                        <button className="transform transition-all duration-300 hover:scale-90" onClick={() => openLink(spotify)}>
                            <img
                                src="/media/spotify.png"
                                alt="spotify"
                                className="w-16 max-md:w-12"
                                loading="lazy"
                            />
                        </button>
                    )}
                    {apple && (
                        <button className="transform transition-all duration-300 hover:scale-90" onClick={() => openLink(apple)}>
                            <img
                                src="/media/appleMusic.png"
                                alt="apple music"
                                className="w-16 max-md:w-12"
                                loading="lazy"
                            />
                        </button>
                    )}
                </div>
            </div>
            {youtube && player && <YoutubePlayer link={youtube} />}
        </div>

    )
}
export default ExtLinks
