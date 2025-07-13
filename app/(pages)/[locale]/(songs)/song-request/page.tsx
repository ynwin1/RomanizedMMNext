import React from 'react'
import SongRequestForm from "@/app/components/forms/SongRequestForm";
import {fetchSongRequests} from "@/app/lib/action";
import {Metadata} from "next";
import {getTranslations} from "next-intl/server";

export const metadata: Metadata = {
    title: 'Song Request',
    description: 'Request a song to be added to the RomanizedMM website!'
};

export const revalidate = 0;

const Page = async () => {
    const songRequests = await fetchSongRequests();
    const translator = await getTranslations("SongRequestPage");

    return (
        <div className="flex flex-col gap-10 items-center justify-center mt-8">
            <h1 className="text-3xl font-bold">{translator("title")}</h1>
            <p className="text-lg w-[80vw] text-center">
                {translator("description")}
            </p>
            <SongRequestForm/>

            {/* Status */}
            <div className="flex flex-row items-center justify-center border-2 border-white rounded-2xl">
                <label className="text-lg font-bold p-3">Status:</label>
                <div className="flex flex-row items-center gap-x-2 p-3">
                    <p className="text-base">Available</p>
                    <div className="w-4 h-4 bg-green-500 rounded-full"/>
                </div>
            </div>

            {/* Song Queue */}
            <div className="flex flex-col text-center justify-center items-center w-[60vw] max-md:w-[80vw] border-2 border-white p-4 rounded-2xl mb-6">
                <p className="text-2xl font-bold mt-2 mb-6 max-md:text-lg">{translator("songsInQueue")}</p>
                {songRequests.map((songRequest, index) => {
                    return (
                        <div key={index} className="flex flex-row justify-center bg-white mb-6 rounded-2xl p-3 text-black w-[40vw] max-md:w-[70vw]">
                            <p className="text-base">{`${songRequest.songName} - ${songRequest.artist}`}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
export default Page;
