"use client";
import React, {useState, useEffect} from 'react'
import YoutubePlayer from "@/app/components/youtube-player/YoutubePlayer";

interface ExtLinksProps {
    youtube: string[] | undefined,
    spotify: string | undefined,
    apple: string | undefined,
    onYoutubeToggle?: (isVisible: boolean) => void,
    onProgress?: (playedSeconds: number) => void
}

function openLink(url: string) {
    window.open(url, '_blank');
}
const ExtLinks = ({youtube, spotify, apple, onYoutubeToggle, onProgress} : ExtLinksProps) => {
    const [player, setPlayer] = useState(false);

    function togglePlayer() {
        const newState = !player;
        setPlayer(newState);
        if (onYoutubeToggle) {
            onYoutubeToggle(newState);
        }
    }
    
    // Notify parent component when player state changes
    useEffect(() => {
        if (onYoutubeToggle) {
            onYoutubeToggle(player);
        }
    }, [player, onYoutubeToggle]);

    return (
        <div className="flex flex-col items-center space-y-6 mb-6">
            <div className="bg-transparent backdrop-blur-sm border-2 border-white rounded-2xl px-6 py-2">
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
            {youtube && player && <YoutubePlayer links={youtube} onProgress={onProgress}    />}
        </div>

    )
}
export default ExtLinks
