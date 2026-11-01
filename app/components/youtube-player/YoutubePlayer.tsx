import React, { useEffect, useRef, useState } from 'react';
import { useInView } from "react-intersection-observer";
import type ReactPlayer from "react-player";
import dynamic from "next/dynamic";

// react-player accesses browser-specific rendering paths; avoid rendering it during SSR.
const BrowserReactPlayer = dynamic(() => import("react-player"), {
    ssr: false,
    loading: () => <div className="h-full w-full" aria-label="Loading video player" />,
});
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface YoutubePlayerProps {
    links: string[];
    onProgress: (playedSeconds: number) => void;
    onVideoChange?: (index: number) => void;
}

const YoutubePlayer = ({links, onProgress, onVideoChange}: YoutubePlayerProps) => {
    const [isFixed, setIsFixed] = useState(false);
    const [currentLinkIdx, setCurrentLinkIdx] = useState(0);
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: "-50px 0px"
    });
    const playerRef = useRef<ReactPlayer>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFixed(!inView);
        }, 100);

        return () => clearTimeout(timer);
    }, [inView, currentLinkIdx]);

    useEffect(() => {
        const handleSeekEvent = (e: Event) => {
            const seekEvent = e as CustomEvent;
            const time = seekEvent.detail?.time;
            if (typeof time === 'number' && playerRef.current) {
                playerRef.current.seekTo(time);
                // Add a small delay before playing to ensure the seek completes
                setTimeout(() => {
                    if (playerRef.current) {
                        // Force the player to play after seeking
                        playerRef.current.getInternalPlayer()?.playVideo();
                    }
                }, 50);
            }
        };

        window.addEventListener('seek-youtube', handleSeekEvent);

        return () => {
            window.removeEventListener('seek-youtube', handleSeekEvent);
        };
    }, []);

    const handleProgress = (state: any) => {
        if (onProgress) {
            onProgress(state.playedSeconds);
        }
    };

    return (
        <div
            ref={ref}
            className="min-h-[226px] w-full flex justify-center items-center mb-4"
        >
            <div
                className={`
          transition-all duration-300 ease-in-out
          ${isFixed
                    ? 'fixed bottom-8 right-8 w-[400px] h-[226px] z-30 max-md:w-[200px] max-md:h-[113px]'
                    : 'w-[30vw] h-[20vw] max-md:w-[80vw] max-md:h-[25vh]'
                }
        `}
            >
                <div className="relative w-full h-full">
                    <BrowserReactPlayer
                        url={links[currentLinkIdx]}
                        width="100%"
                        height="100%"
                        controls={true}
                        className="absolute top-0 left-0"
                        onProgress={handleProgress}
                        ref={playerRef}
                    />
                </div>

                {/* Left & Right buttons to toggle links*/}
                {links.length > 1 && inView &&
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button 
                    className="transform transition-all duration-300 hover:scale-90 hover:text-accent"
                    onClick={() => setCurrentLinkIdx(prev => { const next = Math.max(0, prev - 1); onVideoChange?.(next); return next; })}
                    disabled={currentLinkIdx === 0}
                    >
                        <ChevronLeftIcon className="w-8 h-8" />
                    </button>
                    <button 
                    className="transform transition-all duration-300 hover:scale-90 hover:text-accent"
                    onClick={() => setCurrentLinkIdx(prev => { const next = Math.min(links.length - 1, prev + 1); onVideoChange?.(next); return next; })}
                    disabled={currentLinkIdx === links.length - 1}
                    >
                        <ChevronRightIcon className="w-8 h-8" />
                    </button>
                </div>
                }
            </div>
        </div>
    );
};

export default YoutubePlayer;
