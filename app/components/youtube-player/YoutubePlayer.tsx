import React, { useEffect, useRef, useState } from 'react';
import { clampFloatingPosition, snapFloatingPosition, type FloatingPosition } from './floating-position';
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
    const floatingRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{pointerId: number; x: number; y: number; origin: FloatingPosition} | null>(null);
    const [position, setPosition] = useState<FloatingPosition | null>(null);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        const keepOnScreen = () => setPosition(previous => previous
            ? clampFloatingPosition(previous, window.innerWidth, window.innerHeight,
                floatingRef.current?.offsetWidth ?? 200, floatingRef.current?.offsetHeight ?? 140)
            : null);
        window.addEventListener('resize', keepOnScreen);
        return () => window.removeEventListener('resize', keepOnScreen);
    }, []);

    const onDragStart = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!isFixed || !floatingRef.current) return;
        const bounds = floatingRef.current.getBoundingClientRect();
        dragRef.current = {
            pointerId: event.pointerId, x: event.clientX, y: event.clientY,
            origin: {x: bounds.left, y: bounds.top},
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
    };
    const onDragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId || !floatingRef.current) return;
        setPosition(clampFloatingPosition({
            x: drag.origin.x + event.clientX - drag.x,
            y: drag.origin.y + event.clientY - drag.y,
        }, window.innerWidth, window.innerHeight,
        floatingRef.current.offsetWidth, floatingRef.current.offsetHeight));
    };
    const onDragEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
        setDragging(false);
        if (floatingRef.current) {
            const bounds = floatingRef.current.getBoundingClientRect();
            setPosition(snapFloatingPosition(
                {x: bounds.left, y: bounds.top},
                window.innerWidth, window.innerHeight, bounds.width, bounds.height));
        }
    };

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
                ref={floatingRef}
                style={isFixed && position ? {left: position.x, top: position.y, right: "auto", bottom: "auto"} : undefined}
                className={`
          ${dragging ? "" : "transition-[width,height,left,top] duration-200 ease-out"}
          ${isFixed
                    ? 'fixed bottom-8 right-8 w-[400px] h-[226px] z-30 max-md:w-[200px] max-md:h-[113px]'
                    : 'w-[30vw] h-[20vw] max-md:w-[80vw] max-md:h-[25vh]'
                }
        `}
            >
                {isFixed && <button type="button" aria-label="Drag video player" title="Drag video player"
                    onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd}
                    onPointerCancel={onDragEnd}
                    className="absolute -top-8 right-0 z-10 flex h-8 touch-none select-none items-center rounded-t-lg bg-zinc-900/90 px-4 text-xs text-white shadow cursor-grab active:cursor-grabbing">
                    <span aria-hidden="true" className="mr-2">⠿</span> Drag
                </button>}
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
