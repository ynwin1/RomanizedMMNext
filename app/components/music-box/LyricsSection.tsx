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
    const [lyrics, setLyrics] = useState(optionToLyrics(initialOption));
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const translator = useTranslations("MusicPage");

    function optionToLyrics(option: string) {
        switch (option) {
            case 'burmese':
                return burmese;
            case 'meaning':
                return meaning;
            default:
                return romanized;
        }
    }

    function lyricsToOption(lyrics: string) {
        switch (lyrics) {
            case burmese:
                return 'burmese';
            case meaning:
                return 'meaning';
            default:
                return 'romanized';
        }
    }

    useEffect(() => {
        const params: URLSearchParams = new URLSearchParams(searchParams);
        const lyricsType: string = lyricsToOption(lyrics);
        params.set("option", lyricsType);
        replace(`${pathname}?${params.toString()}`, { scroll: false });
        // set local storage choice
        localStorage.setItem("RomanizedMM_lyricsType", lyricsType);
    }, [lyrics]);

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
            <div className="border-2 border-white rounded-2xl pl-4 pr-4 pt-2 pb-2 max-md:w-[70vw] md:w-[30vw]">
                <div className="flex justify-evenly items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="romanized"
                            checked={lyrics === romanized}
                            onChange={() => setLyrics(romanized)}
                            className="w-5 h-5 max-md:w-4 max-md:h-4 cursor-pointer"
                        />
                        <label htmlFor="romanized" className="cursor-pointer hover:text-gray-300">
                            {translator("romanized")}
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="burmese"
                            checked={lyrics === burmese}
                            onChange={() => setLyrics(burmese)}
                            className="w-5 h-5 max-md:w-4 max-md:h-4 cursor-pointer"
                        />
                        <label htmlFor="burmese" className="cursor-pointer hover:text-gray-300">
                            {translator("burmese")}
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="meaning"
                            checked={lyrics === meaning}
                            onChange={() => setLyrics(meaning)}
                            className="w-5 h-5 max-md:w-4 max-md:h-4 cursor-pointer"
                        />
                        <label htmlFor="meaning" className="cursor-pointer hover:text-gray-300">
                            {translator("meaning")}
                        </label>
                    </div>
                </div>
            </div>

            {/* Lyrics */}
            <p className="text-3xl font-bold">{translator("lyrics")}</p>
            <div className="text-lg leading-9 border-2 text-center border-white p-4 rounded-2xl md:w-[50vw]
            max-md:w-[85vw] max-md:text-base max-md:leading-8
            ">
                {formatLyrics(lyrics)}
            </div>
        </>
    )
}
export default LyricsSection
