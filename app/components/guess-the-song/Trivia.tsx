"use client"
import React, {useState} from 'react'
import {useTranslations} from "next-intl";
import {TriviaScoreForm} from "@/app/components/forms/TriviaScoreForm";
import Leaderboard from "@/app/components/guess-the-lyrics/Leaderboard";
import {TriviaState} from "@/app/lib/types";
import {GameMode} from "@/app/lib/constants";
import {TriviaCard} from "./TriviaCard";

const Trivia = ({songs, minScore} : {songs: any[], minScore: number}) => {
    const [triviaState, setTriviaState] = useState<TriviaState>(TriviaState.Start);
    const [score, setScore] = useState<number>(0);
    const [showSaveCard, setShowSaveCard] = useState<boolean>(true);

    const translator = useTranslations("GameModes");

    const gameMode = GameMode.GuessTheSong;

    return (
        <div className="z-10">
            {triviaState === TriviaState.Start ?
                <div className="flex flex-col justify-center items-center mt-6">
                    <h1 className="border-2 border-orange-200 z-10 text-5xl p-4
                    text-center mb-10 text-white max-sm:text-2xl max-sm: p-2 rounded-2xl max-md:w-[60vw] bg-black bg-opacity-70 ">
                        Guess The Song
                    </h1>
                    <div className="flex flex-col justify-center items-center">
                        <button className="text-lg bg-blue-500 text-white p-2 rounded-2xl mt-8 hover:bg-blue-800 w-[6rem] border-2 border-black"
                                onClick={() => setTriviaState(TriviaState.Playing)}>
                            {translator("start")}
                        </button>
                    </div>
                    <Leaderboard refresh={showSaveCard} gameMode={gameMode} />
                </div>
                :
                triviaState === TriviaState.Playing ?
                    <>
                        <TriviaCard key={score} songs={songs} score={score} setScore={setScore} setTriviaState={setTriviaState}/>
                    </>
                    :
                    <div className="flex flex-col justify-center items-center">
                        {showSaveCard && score > minScore ?
                            <TriviaScoreForm score={score} gameMode={gameMode} setShowSaveCard={setShowSaveCard}/>
                            :
                            <h1 className="text-2xl text-white text-center max-md:text-base bg-black bg-opacity-80 p-4 rounded-xl max-md:w-[80vw]">
                                Beat the lowest score to get featured on the leaderboard 🎉
                            </h1>
                        }
                        {/* Restart */}
                        <button className="text-lg bg-blue-500 text-white p-2 rounded-2xl mt-8 hover:bg-blue-700 w-[30vw] max-md:w-[70vw]"
                                onClick={() => {
                                    setScore(0);
                                    setTriviaState(TriviaState.Start);
                                    setShowSaveCard(true);
                                }}>
                            Restart
                        </button>
                        {/* Leaderboard */}
                        <Leaderboard refresh={showSaveCard} gameMode={gameMode}/>
                    </div>
            }
        </div>
    )
}

export default Trivia
