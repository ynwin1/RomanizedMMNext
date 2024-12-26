import React from 'react';
import { useInView } from "react-intersection-observer";
import ReactPlayer from "react-player";

const YoutubePlayer = ({link} : {link: string}) => {
    const { ref, inView } = useInView({
        threshold: 0,
    });

    return (
        <div ref={ref} style={{ minHeight: inView ? 'auto' : '226px', transition: 'min-height 0.3s' }}>
            <div className={
                inView ?
                    "flex flex-col justify-center items-center w-[40vw] h-[25vw] mx-auto max-md:w-[80vw] max-md:h-[25vh]"
                    :
                    "fixed bottom-[2rem] right-[2rem] w-[400px] h-[226px] z-50 max-md:w-[200px] max-md:h-[113px]"
            }>
                <ReactPlayer
                    url={link}
                    width="100%"
                    height="100%"
                    controls={true}
                    style={{ display: 'block' }}
                />
            </div>
        </div>


    )
}
export default YoutubePlayer;
