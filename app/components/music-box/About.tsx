"use client";

import React from 'react'
import {useTranslations} from "next-intl";

interface AboutProps {
    songName: string
    locale: string,
    artistName: string,
    albumName: string,
    genre: string,
    whenToListen: string
}

const About = ({songName, locale, artistName, albumName, genre, whenToListen}: AboutProps) => {
    const translator = useTranslations("MusicPage");
    return (
        <div className="text-lg border-2 border-white p-4 rounded-2xl max-md:w-[80vw] md:w-[40vw]">
            <h1 className="mb-6">{songName}</h1>
            <h2 className="pb-2"><u>{translator("artist")}</u>: {artistName}</h2>
            <h2 className="pb-2"><u>{translator("album")}</u>: {albumName}</h2>
            <h2 className="pb-2"><u>{translator("genre")}</u>: {genre}</h2>
            <h2 className="pb-2 leading-8"><u>{translator("whenToListen")}</u>: {whenToListen}</h2>
        </div>
    )
}
export default About
