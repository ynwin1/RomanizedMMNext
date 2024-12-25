"use client"
import React, {useState, useEffect} from 'react'
import {useTranslations} from "next-intl";

enum TriviaState {
    Start = 'start',
    Playing = 'playing',
    End = 'end'
}

enum LyricsChoice {
    Romanized = 'romanized',
    Burmese = 'burmese'
}

const Trivia = ({songs} : {songs: any[]}) => {
    const [triviaState, setTriviaState] = useState<TriviaState>(TriviaState.Start);
    const [lyricsChoice, setLyricsChoice] = useState<LyricsChoice>(LyricsChoice.Burmese);
    const [score, setScore] = useState<number>(0);

    const translator = useTranslations("GuessTheLyrics");

    return (
        <div className="z-10">
            {triviaState === TriviaState.Start ?
                <div className="flex flex-col justify-center items-center">
                    <LyricsSelector lyricsChoice={lyricsChoice} setLyricsChoice={setLyricsChoice} />
                    <button className="text-lg bg-blue-600 text-white p-2 rounded-2xl mt-8 hover:bg-blue-800 w-[6rem]"
                            onClick={() => setTriviaState(TriviaState.Playing)}>
                        {translator("start")}
                    </button>
                </div>
                :
                triviaState === TriviaState.Playing ?
                    <div>

                    </div>
                    :
                    <div>

                    </div>
            }
        </div>
    )
}

function LyricsSelector({lyricsChoice, setLyricsChoice}:
                            {lyricsChoice: LyricsChoice, setLyricsChoice: (lyricsChoice: LyricsChoice) => void}) {
    const translator = useTranslations("GuessTheLyrics");
    return (
        <div className="pl-4 pr-4 pt-2 pb-2 max-md:w-[70vw] md:w-[30vw] bg-black bg-opacity-70 rounded-2xl">
            <div className="flex justify-evenly items-center gap-4">
                <div className="flex items-center gap-2">
                    <input
                        type="radio"
                        id="burmese"
                        checked={lyricsChoice === LyricsChoice.Burmese}
                        onChange={() => setLyricsChoice(LyricsChoice.Burmese)}
                        className="w-5 h-5 max-md:w-4 max-md:h-4 cursor-pointer"
                    />
                    <label htmlFor="burmese" className="text-xl cursor-pointer hover:text-gray-300">
                        {translator("burmese")}
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="radio"
                        id="romanized"
                        checked={lyricsChoice === LyricsChoice.Romanized}
                        onChange={() => setLyricsChoice(LyricsChoice.Romanized)}
                        className="w-5 h-5 max-md:w-4 max-md:h-4 cursor-pointer"
                    />
                    <label htmlFor="romanized" className="text-xl cursor-pointer hover:text-gray-300">
                        {translator("romanized")}
                    </label>
                </div>
            </div>
        </div>
    )
}
export default Trivia
