"use client";
import React from "react";

interface PlayerProps {
    src: string;
    className?: string;
    poster?: string;
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
}

const Player: React.FC<PlayerProps> = ({
                                           src,
                                           className = "absolute top-0 left-0 w-full h-full object-cover",
                                           poster,
                                           autoPlay = true,
                                           loop = true,
                                           muted = true,
                                           controls = false,
                                       }) => {
    return (
        <video
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            controls={controls}
            className={className}
            poster={poster}
            playsInline
        >
            <source src={src} type="video/mp4" />
        </video>
    );
};

export default Player;