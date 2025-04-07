"use client"

import React, { useRef } from 'react';

interface RotatingTextProps {
    messages: string[];
    link: string;
}

const RotatingText = ({ messages, link }: RotatingTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const joinedMessage = messages.join(" • ");

    // Create duplicate text for seamless looping
    const duplicatedText = `${joinedMessage} • ${joinedMessage}`;

    return (
        <div
            className="relative w-full overflow-hidden bg-red-600 py-3 text-white z-50 hover:cursor-pointer"
            onClick={() => window.open(link, "_blank")}
        >
            <div className="ticker-container">
                <div className="ticker-text">
                    {duplicatedText}
                </div>
            </div>

            <style jsx global>{`
        .ticker-container {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
        }
        
        .ticker-text {
          display: inline-block;
          white-space: nowrap;
          padding-right: 50px;
          animation: ticker-scroll 30s linear infinite;
        }
        
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

            <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-red-600 to-transparent"></div>
            <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-red-600 to-transparent"></div>
        </div>
    );
};

export default RotatingText;