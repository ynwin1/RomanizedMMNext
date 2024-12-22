import React from 'react';
import { useInView } from "react-intersection-observer";
import ReactPlayer from "react-player";

const YoutubePlayer = ({link} : {link: string}) => {
    const { ref, inView } = useInView({
        threshold: 0,
    });

    return (
        <div ref={ref} className={`transition-[min-height] duration-300 ${inView ? 'min-h-fit' : 'min-h-[226px]'}`}>
            <div className={inView ?
                "flex flex-col items-center justify-center w-[40vw] h-[25vw] mx-auto" :
                "fixed bottom-8 right-8 w-[400px] h-[226px] z-20"}>
                <ReactPlayer
                    url={link}
                    width='100%'
                    height='100%'
                    style={{ marginTop: '1rem' }}
                    controls={true}
                />
            </div>
        </div>
    )
}
export default YoutubePlayer;
