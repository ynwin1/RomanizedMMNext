import React, { useEffect, useState } from 'react';
import { useInView } from "react-intersection-observer";
import ReactPlayer from "react-player";

const YoutubePlayer = ({link}: {link: string}) => {
    const [isFixed, setIsFixed] = useState(false);
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: "-50px 0px"
    });

    useEffect(() => {
        // Add a small delay to prevent flickering
        const timer = setTimeout(() => {
            setIsFixed(!inView);
        }, 100);

        return () => clearTimeout(timer);
    }, [inView]);

    return (
        <div
            ref={ref}
            className="min-h-[226px]"
        >
            <div
                className={`
          transition-all duration-300 ease-in-out flex flex-col items-center
          ${isFixed ?
                    'fixed bottom-8 right-8 w-[400px] h-[226px] z-30 max-md:w-[200px] max-md:h-[113px]' :
                    'w-[30vw] h-[20vw] mx-auto max-md:w-[80vw] max-md:h-[25vh] mt-4'
                }
        `}
            >
                <ReactPlayer
                    url={link}
                    width="100%"
                    height="100%"
                    controls={true}
                />
            </div>
        </div>
    );
};

export default YoutubePlayer;