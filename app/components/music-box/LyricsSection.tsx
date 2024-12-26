"use client";
import React, {useState, useEffect} from 'react'
import {useSearchParams, usePathname, useRouter } from "next/navigation";
import {useTranslations} from "next-intl";

interface LyricsSectionProps {
    romanized: string,
    burmese: string,
    meaning: string,
    initialOption?: string
}

const LyricsSection = ({ romanized, burmese, meaning, initialOption = romanized }: LyricsSectionProps) => {
    const[selectedOption, setSelectedOption] = useState(initialOption);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const translator = useTranslations("MusicPage");

    useEffect(() => {
        const params: URLSearchParams = new URLSearchParams(searchParams);
        params.set("option", selectedOption);
        replace(`${pathname}?${params.toString()}`, { scroll: false });
        // set local storage choice
        localStorage.setItem("RomanizedMM_lyricsType", selectedOption);
    }, [selectedOption]);

    function formatLyrics(lyrics: string) {
        return lyrics.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                <br/>
            </React.Fragment>
        ))
    }

    return (
        <>
            {/* Radio Buttons */}
            <div className="flex flex-row border-2 border-white rounded-2xl gap-6 pl-6 pr-6 pt-3 pb-3 max-md:p-2">
                <div className="gap-2 flex items-center">
                    <input
                        type="radio"
                        id="romanized"
                        checked={selectedOption === "romanized"}
                        onChange={() => setSelectedOption("romanized")}
                        className="w-4 h-4"
                    />
                    <label htmlFor="romanized" className="hover:text-gray-300">
                        {translator("romanized")}
                    </label>
                </div>
                <div className="gap-2 flex items-center">
                    <input
                        type="radio"
                        id="burmese"
                        checked={selectedOption === "burmese"}
                        onChange={() => setSelectedOption("burmese")}
                        className="w-4 h-4"
                    />
                    <label htmlFor="burmese" className="hover:text-gray-300">
                        {translator("burmese")}
                    </label>
                </div>
                <div className="gap-2 flex items-center">
                    <input
                        type="radio"
                        id="meaning"
                        checked={selectedOption === "meaning"}
                        onChange={() => setSelectedOption("meaning")}
                        className="w-4 h-4"
                    />
                    <label htmlFor="meaning" className="hover:text-gray-300">
                        {translator("meaning")}
                    </label>
                </div>
            </div>

            {/* Lyrics */}
            <p className="text-3xl font-bold">{translator("lyrics")}</p>
            <div className="text-lg leading-[2.5rem] border-2 text-center max-md:text-left border-white p-4 rounded-2xl md:w-[50vw]
            max-md:w-[85vw] max-md:text-[1rem] max-md:leading-8
            ">
                {selectedOption === "romanized" ?
                    formatLyrics(romanized) :
                    selectedOption === "burmese" ?
                        formatLyrics(burmese) :
                        formatLyrics(meaning)
                }
            </div>
        </>
    )
}
export default LyricsSection
