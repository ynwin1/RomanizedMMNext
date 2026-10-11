"use client"
import React, {useState} from 'react'
import {useTranslations} from "next-intl";
import {TriviaScoreForm} from "@/app/components/forms/TriviaScoreForm";
import Leaderboard from "@/app/components/guess-the-lyrics/Leaderboard";
import {useTimer} from "react-timer-hook";
import {GameMode} from "@/modules/trivia/domain/game-mode";
import type { GuessLyricsSong } from "@/modules/songs";

enum TriviaState {
    Start = 'start',
    Playing = 'playing',
    End = 'end'
}

enum LyricsChoice {
    Romanized = 'romanized',
    Burmese = 'burmese'
}

const Trivia = ({songs, minScore} : {songs: GuessLyricsSong[], minScore: number}) => {
    const [triviaState, setTriviaState] = useState<TriviaState>(TriviaState.Start);
    const [lyricsChoice, setLyricsChoice] = useState<LyricsChoice>(LyricsChoice.Burmese);
    const [score, setScore] = useState<number>(0);
    const [showSaveCard, setShowSaveCard] = useState<boolean>(true);

    const translator = useTranslations("GuessTheLyrics");
    const gameCopy = useTranslations("GameModes");

    const gameMode = GameMode.GuessTheLyrics;

    return (
        <div className="relative z-10 w-full max-w-3xl">
            {triviaState === TriviaState.Start ?
                <div className="flex flex-col items-center rounded-2xl border border-theme-border bg-surface p-5 text-center sm:p-8">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">RomanizedMM games</p>
                    <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {gameCopy("guessLyrics.title")}
                    </h1>
                    <p className="mb-6 max-w-md text-sm leading-relaxed text-muted">{gameCopy("guessLyrics.instructions")}</p>
                    {!songs.length && <p role="status" className="mb-3 text-sm text-muted">{gameCopy("unavailable")}</p>}
                    <div className="flex flex-col justify-center items-center">
                        <LyricsSelector lyricsChoice={lyricsChoice} setLyricsChoice={setLyricsChoice} />
                        <button className="mt-6 min-h-11 rounded-lg bg-accent px-8 text-base font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={!songs.length}
                                onClick={() => setTriviaState(TriviaState.Playing)}>
                            {translator("start")}
                        </button>
                    </div>
                </div>
                :
                triviaState === TriviaState.Playing ?
                    <>
                        <TriviaCard key={score} lyricsChoice={lyricsChoice} songs={songs} score={score} setScore={setScore} setTriviaState={setTriviaState}/>
                    </>
                    :
                    <div className="flex flex-col items-center rounded-2xl border border-theme-border bg-surface p-5 text-center sm:p-8">
                        {showSaveCard && score > minScore ?
                            <TriviaScoreForm score={score} setShowSaveCard={setShowSaveCard} gameMode={gameMode}/>
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

function TriviaCard({lyricsChoice, songs, score, setScore, setTriviaState}:
                        {lyricsChoice: LyricsChoice,
                            songs: GuessLyricsSong[],
                            score: number
                            setScore: React.Dispatch<React.SetStateAction<number>>
                            setTriviaState: React.Dispatch<React.SetStateAction<TriviaState>>}) {
    // Select a random song
    const song = songs[Math.floor(Math.random() * songs.length)];
    // Select lyric type based on selected lyrics choice
    const lyrics: string = lyricsChoice === LyricsChoice.Burmese ? song.burmese : song.romanized;
    // Extract lyric line to be asked randomly (2 if start or end, 3 if middle)
    const lyricLines: string[] = lyrics.split("\n").filter(line => line.trim() !== "").map(line => line.replace(/^\[.*?\]/, "").trim());
    const lyricIndex: number = Math.floor(Math.random() * lyricLines.length);
    const lyricToAsk: string = lyricLines[lyricIndex];
    const lyricToAskNeighborsIndexes: number[] =
        lyricIndex === 0 ?
            [1]
            :
            lyricIndex === lyricLines.length - 1 ?
                [lyricLines.length - 2]
                :
                [lyricIndex - 1, lyricIndex + 1];
    const lyricToAskNeighbors: string[] = lyricToAskNeighborsIndexes.map(index => lyricLines[index]);
    // Select 3 other random lines (none other than selected lines)
    const excludedLyrics = new Set<string>([lyricToAsk, ...lyricToAskNeighbors]);
    const randomLyrics: string[] = [];
    while (randomLyrics.length < 3) {
        const randomIndex = Math.floor(Math.random() * lyricLines.length);
        const randomLyric = lyricLines[randomIndex];
        if (!excludedLyrics.has(randomLyric)) {
            randomLyrics.push(randomLyric);
            excludedLyrics.add(randomLyric);
        }
    }

    // add lyric to ask to randomLyrics and shuffle
    randomLyrics.push(lyricToAsk);
    randomLyrics.sort(() => Math.random() - 0.5);

    function checkLyric(lyric: string) {
        if (lyric === lyricToAsk) {
            setScore((score: number) => score + 1);
        } else {
            setTriviaState(TriviaState.End);
        }
    }

    const timer = 15000; // 15 seconds
    const [expiryTime, setExpiryTime] = useState(new Date().getTime() + timer);
    const Timer = ({expiryTimestamp, onExpire}: {expiryTimestamp: Date, onExpire: () => void}) => {
        const {
            seconds
        } = useTimer({
            expiryTimestamp,
            onExpire: onExpire
        });

        return (
            <div aria-label={`${seconds} seconds remaining`} className="rounded-lg border border-theme-border bg-surface-raised px-4 py-3 text-center text-lg font-bold tabular-nums text-foreground sm:text-xl">
                <span>{seconds}s</span>
            </div>
        )
    }

    // Display
    return (
        <div className="w-full rounded-2xl border border-theme-border bg-surface p-4 sm:p-7">
            <div className="flex flex-col items-center">
                <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-3">
                    <h2 className="rounded-lg border border-theme-border bg-surface-raised px-4 py-3 text-lg font-bold text-foreground sm:text-xl">
                        {`Score : ${score}`}
                    </h2>
                    <Timer expiryTimestamp={new Date(expiryTime)} onExpire={() => setTriviaState(TriviaState.End)} />
                    <button
                        className="min-h-11 rounded-lg border border-theme-border bg-surface-raised px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent"
                        onClick={() => {
                            setScore(0);
                            setTriviaState(TriviaState.Start);
                        }}
                    >
                        Quit
                    </button>
                </div>
                <h3 className="mb-4 w-full rounded-lg border border-theme-border bg-surface-raised p-3 text-center text-sm font-semibold text-foreground sm:text-base">
                    <u>{song.songName}</u>
                </h3>
                <div className="w-full rounded-xl border border-theme-border bg-surface-raised p-5 text-center text-sm leading-relaxed text-foreground sm:p-7 sm:text-base">
                    {lyricToAskNeighborsIndexes.length === 1 ? (
                        lyricIndex < lyricToAskNeighborsIndexes[0] ? (
                            <div className="flex flex-col gap-4">
                                <p>_______________________</p>
                                <p>{lyricToAskNeighbors[0]}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <p>{lyricToAskNeighbors[0]}</p>
                                <p>_______________________</p>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col gap-4">
                            <p>{lyricToAskNeighbors[0]}</p>
                            <p>_______________________</p>
                            <p>{lyricToAskNeighbors[1]}</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                    {randomLyrics.map((lyric, index) => (
                        <button
                            key={index}
                            className="min-h-14 rounded-lg border border-theme-border bg-surface-raised p-4 text-left text-sm leading-relaxed text-foreground hover:border-accent hover:bg-accent hover:text-on-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
                            onClick={() => checkLyric(lyric)}
                        >
                            {lyric}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function LyricsSelector({lyricsChoice, setLyricsChoice}:
                            {lyricsChoice: LyricsChoice, setLyricsChoice: (lyricsChoice: LyricsChoice) => void}) {
    const translator = useTranslations("GuessTheLyrics");
    return (
        <fieldset className="rounded-xl border border-theme-border bg-surface-raised px-4 py-3">
            <legend className="sr-only">Lyrics language</legend>
            <div className="flex flex-row justify-evenly items-center gap-4 ">
                <div className="flex items-center gap-2">
                    <input
                        type="radio"
                        id="burmese"
                        checked={lyricsChoice === LyricsChoice.Burmese}
                        onChange={() => setLyricsChoice(LyricsChoice.Burmese)}
                        className="w-5 h-5 max-md:w-4 max-md:h-4 cursor-pointer"
                    />
                    <label htmlFor="burmese" className="cursor-pointer text-sm text-foreground sm:text-base">
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
                    <label htmlFor="romanized" className="cursor-pointer text-sm text-foreground sm:text-base">
                        {translator("romanized")}
                    </label>
                </div>
            </div>
        </fieldset>
    )
}
export default Trivia
