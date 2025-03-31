"use client"
import React, {useEffect, useRef, useState} from 'react'

interface RotatingTextProps {
    messages: string[];
    link: string;
}

const RotatingText = ({messages, link} : RotatingTextProps) => {
    const [animate, setAnimate] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const joinedMessage = messages.join(" • ");

    useEffect(() => {
        const handleAnimationEnd = () => {
            // Reset the animation by briefly turning it off then on
            setAnimate(false);
            setTimeout(() => setAnimate(true), 10);
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('animationend', handleAnimationEnd);

            return () => {
                container.removeEventListener('animationend', handleAnimationEnd);
            };
        }
    }, []);

    return (
        <div className="relative w-full overflow-hidden bg-red-600 py-3 text-white z-50 hover:cursor-pointer" onClick={() => window.open(link, "_blank")}>
            <div
                ref={containerRef}
                className={`whitespace-nowrap font-bold ${animate ? 'animate-ticker' : ''}`}
                style={{
                    display: 'inline-block'
                }}
            >
                {joinedMessage}
            </div>
            <style jsx global>{`
        @keyframes ticker {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-ticker {
          animation: ticker 30s linear;
        }
      `}</style>

            <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-red-600 to-transparent"></div>
            <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-red-600 to-transparent"></div>
        </div>
    );
};
export default RotatingText
