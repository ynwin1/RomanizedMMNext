"use client";
import React, {useState} from 'react'
import YoutubePlayer from "@/app/components/youtube-player/YoutubePlayer";

interface ExtLinksProps {
    youtube: string | undefined,
    spotify: string | undefined,
    apple: string | undefined
};

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
            <div className="flex flex-row gap-20 border-white border-2 rounded-2xl max-md:w-[70vw] pl-3 pr-3 pt-2 pb-2">
                {youtube &&
                    <button onClick={togglePlayer}>
                        <img src="/media/youtube.png" alt="youtube" className="w-16 hover:scale-90 ease-in" />
                    </button>
                }
                {spotify &&
                    <button>
                        <img src="/media/spotify.png" alt="spotify" className="w-16 hover:scale-90 ease-in" onClick={() => openLink(spotify)} />
                    </button>
                }
                {apple &&
                    <button>
                        <img src="/media/appleMusic.png" alt="apple music" className="w-16 hover:scale-90 ease-in" onClick={() => openLink(apple)} />
                    </button>
                }
            </div>
            {youtube && player && <YoutubePlayer link={youtube} />}
        </>

    )
}
export default ExtLinks
