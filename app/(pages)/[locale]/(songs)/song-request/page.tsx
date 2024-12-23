import React from 'react'
import SongRequestForm from "@/app/components/forms/SongRequestForm";
import {fetchSongRequests} from "@/app/lib/action";

const Page = async () => {
    const songRequests = await fetchSongRequests();

    return (
        <div className="flex flex-col gap-10 items-center justify-center mt-8">
            <h1 className="text-3xl font-bold">Request A Song</h1>
            <p className="text-lg w-[80vw] text-center">
                Do you have a song that you want to sing along, but can't find it on this website? Fill out the form below!
            </p>
            <SongRequestForm/>

            {/* Song Queue */}
            <div className="flex flex-col text-center justify-center items-center w-[60vw] max-md:w-[80vw] border-2 border-white p-4 rounded-2xl mb-6">
                <p className="text-3xl font-bold mt-2 mb-6 max-md:text-2xl">Songs In Queue</p>
                {songRequests.map((songRequest, index) => {
                    return (
                        <div key={index} className="flex flex-row justify-center bg-white mb-6 rounded-2xl p-3 text-black w-[40vw] max-md:w-[60vw]">
                            <p className="text-base">{`${songRequest.songName} - ${songRequest.artist}`}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
export default Page;
