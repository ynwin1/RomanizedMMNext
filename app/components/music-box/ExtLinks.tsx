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
        <>
            <div className="flex flex-row justify-between w-[30dvw] border-white max-md:w-[70dvw] border-2 rounded-2xl pl-2 pr-2 px-2 py-2 ">
                {youtube &&
                    <button onClick={togglePlayer}>
                        <img src="/media/youtube.png" alt="youtube" className="w-16 max-md:w-12 hover:scale-90 ease-in" loading="lazy"/>
                    </button>
                }
                {spotify &&
                    <button onClick={() => openLink(spotify)}>
                        <img src="/media/spotify.png" alt="spotify" className="w-16 max-md:w-12 hover:scale-90 ease-in" loading="lazy" />
                    </button>
                }
                {apple &&
                    <button onClick={() => openLink(apple)}>
                        <img src="/media/appleMusic.png" alt="apple music" className="w-16 max-md:w-12 hover:scale-90 ease-in" loading="lazy" />
                    </button>
                }
            </div>
            {youtube && player && <YoutubePlayer link={youtube} />}
        </>

    )
}
export default ExtLinks
