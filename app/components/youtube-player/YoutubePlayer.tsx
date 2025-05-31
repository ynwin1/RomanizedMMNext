import React, { useEffect, useState, useRef } from 'react';
import { useInView } from "react-intersection-observer";
import ReactPlayer from "react-player";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface YoutubePlayerProps {
    links: string[];
    onProgress?: (playedSeconds: number) => void;
}

const YoutubePlayer = ({links, onProgress}: YoutubePlayerProps) => {
    console.log(`links: ${links}`);
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
    
    // Add event listener for seeking from lyrics
    useEffect(() => {
        const handleSeekEvent = (e: Event) => {
            const seekEvent = e as CustomEvent;
            const time = seekEvent.detail?.time;
            if (typeof time === 'number' && playerRef.current) {
                playerRef.current.seekTo(time);
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
                    <ReactPlayer
                        ref={playerRef}
                        url={links[currentLinkIdx]}
                        width="100%"
                        height="100%"
                        controls={true}
                        className="absolute top-0 left-0"
                        onProgress={handleProgress}
                    />
                </div>

                {/* Left & Right buttons to toggle links*/}
                {links.length > 1 && inView &&
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button 
                    className="transform transition-all duration-300 hover:scale-90 hover:text-blue-500"
                    onClick={() => setCurrentLinkIdx((prev) => Math.max(0, prev - 1))}
                    disabled={currentLinkIdx === 0}
                    >
                        <ChevronLeftIcon className="w-8 h-8" />
                    </button>
                    <button 
                    className="transform transition-all duration-300 hover:scale-90 hover:text-blue-500" 
                    onClick={() => setCurrentLinkIdx((prev) => Math.min(links.length - 1, prev + 1))}
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