"use client"
import React, {useState} from 'react'
import {useTranslations} from "next-intl";
import {TriviaScoreForm} from "@/app/components/forms/TriviaScoreForm";
import Leaderboard from "@/app/components/guess-the-lyrics/Leaderboard";
import {TriviaState} from "@/app/lib/types";
import {GameMode} from "@/modules/trivia/domain/game-mode";
import {TriviaCard} from "./TriviaCard";
import type { GuessSongRecord } from "@/modules/songs";

const Trivia = ({songs, minScore} : {songs: GuessSongRecord[], minScore: number}) => {
    const [triviaState, setTriviaState] = useState<TriviaState>(TriviaState.Start);
    const [score, setScore] = useState<number>(0);
    const [showSaveCard, setShowSaveCard] = useState<boolean>(true);

    const translator = useTranslations("GameModes");

    const gameMode = GameMode.GuessTheSong;

    return (
        <div className="relative z-10 w-full max-w-3xl">
            {triviaState === TriviaState.Start ?
                <div className="flex flex-col items-center rounded-2xl border border-theme-border bg-surface p-5 text-center sm:p-8">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">RomanizedMM games</p>
                    <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {translator("guessSong.title")}
                    </h1>
                    <p className="max-w-md text-sm leading-relaxed text-muted">{translator("guessSong.instructions")}</p>
                    {songs.length < 4 && <p role="status" className="mt-3 text-sm text-muted">{translator("unavailable")}</p>}
                    <div className="flex flex-col justify-center items-center">
                        <button className="mt-6 min-h-11 rounded-lg bg-accent px-8 text-base font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={songs.length < 4}
                                onClick={() => setTriviaState(TriviaState.Playing)}>
                            {translator("start")}
                        </button>
                    </div>
                </div>
                :
                triviaState === TriviaState.Playing ?
                    <>
                        <TriviaCard key={score} songs={songs} score={score} setScore={setScore} setTriviaState={setTriviaState}/>
                    </>
                    :
                    <div className="flex flex-col items-center rounded-2xl border border-theme-border bg-surface p-5 text-center sm:p-8">
                        {showSaveCard && score > minScore ?
                            <TriviaScoreForm score={score} gameMode={gameMode} setShowSaveCard={setShowSaveCard}/>
                            :
                            <h2 className="text-lg font-semibold text-foreground">
                                Beat the lowest score to get featured on the leaderboard 🎉
                            </h2>
                        }
                        {/* Restart */}
                        <button className="mt-6 min-h-11 w-full max-w-xs rounded-lg bg-accent px-6 font-semibold text-on-accent hover:bg-accent-hover"
                                onClick={() => {
                                    setScore(0);
                                    setTriviaState(TriviaState.Start);
                                    setShowSaveCard(true);
                                }}>
                            Restart
                        </button>
                    </div>
            }
            {triviaState !== TriviaState.Playing && <Leaderboard refresh={showSaveCard} gameMode={gameMode} />}
        </div>
    )
}

export default Trivia
