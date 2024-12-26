import React from 'react';
import { useInView } from "react-intersection-observer";
import ReactPlayer from "react-player";

const YoutubePlayer = ({link} : {link: string}) => {
    const { ref, inView } = useInView({
        threshold: 0,
    });

    return (
        <div
            ref={ref}
            className={`transition-[min-height] duration-300 ${
                inView ? 'h-auto' : 'min-h-[226px]'
            }`}
        >
            <div
                className={
                    inView
                        ? "flex flex-col items-center justify-center w-[40vw] h-[25vw] mx-auto max-md:w-[80vw] max-md:h-[45vw]"
                        : "fixed bottom-8 right-8 w-[400px] h-[226px] max-md:w-[200px] max-md:h-[113px] z-20"
                }
            >
                <div className="w-full h-full">
                    <ReactPlayer
                        url={link}
                        width="100%"
                        height="100%"
                        controls={true}
                        style={{ display: 'block' }}
                    />
                </div>
            </div>
        </div>
    )
}
export default YoutubePlayer;
