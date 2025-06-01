"use client";
import React, {useEffect} from 'react'
import {useSearchParams, usePathname, useRouter } from "next/navigation";
import {useTranslations} from "next-intl";
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface LyricsSectionProps {
    romanized: string,
    burmese: string,
    meaning: string,
    selectedOption: string,
    hasTimestamps: boolean,
    customRenderer: (lyrics: string) => React.ReactNode,
    onOptionChange: (option: string) => void
}

const LyricsSection = ({ romanized, burmese, meaning, selectedOption, hasTimestamps, customRenderer, onOptionChange }: LyricsSectionProps) => {
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

        onOptionChange(selectedOption);
    }, [selectedOption, onOptionChange, replace, pathname, searchParams]);

    // Determine which lyrics to display
    const getLyricsContent = () => {
        const selectedLyrics = selectedOption === "romanized" 
            ? romanized 
            : selectedOption === "burmese" 
                ? burmese 
                : meaning;

        return customRenderer(selectedLyrics);
    };

    return (
        <>
            {/* Radio Buttons */}
            <div className="flex flex-row border-2 border-white rounded-2xl gap-6 pl-6 pr-6 pt-3 pb-3 max-md:p-2">
                <div className="gap-2 flex items-center">
                    <input
                        type="radio"
                        id="romanized"
                        checked={selectedOption === "romanized"}
                        onChange={() => onOptionChange("romanized")}
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
                        onChange={() => onOptionChange("burmese")}
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
                        onChange={() => onOptionChange("meaning")}
                        className="w-4 h-4"
                    />
                    <label htmlFor="meaning" className="hover:text-gray-300">
                        {translator("meaning")}
                    </label>
                </div>
            </div>

            {/* Info stamp for synced lyrics */}
            {hasTimestamps && (
                <div className="relative group inline-block">
                    <span className="text-blue-500 cursor-pointer"><InformationCircleIcon className="w-6 h-6 text-white" /></span>
                    <div className="absolute rounded-lg border-2 border-white left-1/2 -translate-x-1/2 mt-2 w-max bg-black text-white text-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {translator("sync")}
                    </div>
                </div>
            )}

            {/* Lyrics */}
            <p className="text-3xl font-bold">{translator("lyrics")}</p>
            <div className="text-base leading-[2.2rem] border-2 text-center max-md:text-left border-white p-4 rounded-2xl md:w-[50vw]
            max-md:w-[90vw] max-md:text-[1rem]
            ">
                {getLyricsContent()}
            </div>
        </>
    )
}
export default LyricsSection
