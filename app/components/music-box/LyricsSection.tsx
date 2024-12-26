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
            <div className="flex flex-row border-2 border-white rounded-2xl pt-2 pb-2 justify-evenly items-center gap-3 w-[30vw] max-md:w-[70vw]">
                <div className="flex items-center gap-2 max-md:gap-1">
                    <input
                        type="radio"
                        id="romanized"
                        checked={selectedOption === "romanized"}
                        onChange={() => setSelectedOption("romanized")}
                        className="w-5 h-5 cursor-pointer max-sm:w-3 max-sm:h-3"
                    />
                    <label htmlFor="romanized" className="max-md:text-sm cursor-pointer hover:text-gray-300">
                        {translator("romanized")}
                    </label>
                </div>
                <div className="flex items-center gap-2 max-md:gap-1">
                    <input
                        type="radio"
                        id="burmese"
                        checked={selectedOption === "burmese"}
                        onChange={() => setSelectedOption("burmese")}
                        className="w-5 h-5 cursor-pointer max-md:w-3 max-md:h-3"
                    />
                    <label htmlFor="burmese" className="max-md:text-sm cursor-pointer hover:text-gray-300">
                        {translator("burmese")}
                    </label>
                </div>
                <div className="flex items-center gap-2 max-md:gap-1">
                    <input
                        type="radio"
                        id="meaning"
                        checked={selectedOption === "meaning"}
                        onChange={() => setSelectedOption("meaning")}
                        className="w-5 h-5 cursor-pointer max-md:w-3 max-md:h-3"
                    />
                    <label htmlFor="meaning" className="max-md:text-sm cursor-pointer hover:text-gray-300">
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
