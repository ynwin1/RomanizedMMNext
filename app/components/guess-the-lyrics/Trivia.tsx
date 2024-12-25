"use client"
import React, {useState} from 'react'
import {useTranslations} from "next-intl";
import {TriviaScoreForm} from "@/app/components/forms/TriviaScoreForm";
import {fetchAllTriviaScores} from "@/app/lib/action";

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
    const [showSaveCard, setShowSaveCard] = useState<boolean>(true);

    const translator = useTranslations("GuessTheLyrics");

    return (
        <div className="z-10">
            {triviaState === TriviaState.Start ?
                <>
                    <h1 className="border-2 border-orange-200 z-10 text-5xl p-4 text-center mb-10 text-white max-md:text-4xl rounded-2xl">
                        Guess The Lyrics
                    </h1>
                    <div className="flex flex-col justify-center items-center">
                        <LyricsSelector lyricsChoice={lyricsChoice} setLyricsChoice={setLyricsChoice} />
                        <button className="text-lg bg-blue-500 text-white p-2 rounded-2xl mt-8 hover:bg-blue-800 w-[6rem]"
                                onClick={() => setTriviaState(TriviaState.Playing)}>
                            {translator("start")}
                        </button>
                    </div>
                </>
                :
                triviaState === TriviaState.Playing ?
                    <>
                        <TriviaCard key={score} lyricsChoice={lyricsChoice} songs={songs} score={score} setScore={setScore} setTriviaState={setTriviaState}/>
                    </>
                    :
                    <div className="flex flex-col justify-center items-center">
                        {/* Save Card */}
                        {showSaveCard && <TriviaScoreForm score={score} setShowSaveCard={setShowSaveCard}/>}
                        {/* Restart */}
                        <button className="text-lg bg-blue-500 text-white p-2 rounded-2xl mt-8 hover:bg-blue-700 w-[15rem]"
                                onClick={() => {
                                    setScore(0);
                                    setTriviaState(TriviaState.Start);
                                    setShowSaveCard(true);
                                }}>
                            Restart
                        </button>
                        {/* Leaderboard */}
                        <Leaderboard />
                    </div>
            }
        </div>
    )
}

async function Leaderboard() {
    let allScores = await fetchAllTriviaScores();
    return (
        <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-white bg-opacity-10 backdrop-blur-sm">
                <thead>
                <tr className="bg-blue-600 text-white">
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Rank</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Name</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Country</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Score</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Date</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {allScores.map((score, index) => (
                    <tr
                        key={index}
                        className="hover:bg-white hover:bg-opacity-10 transition-colors"
                    >
                        <td className="py-4 px-6 text-white">{index + 1}</td>
                        <td className="py-4 px-6 text-white">{score.userName}</td>
                        <td className="py-4 px-6 text-white">{score.country}</td>
                        <td className="py-4 px-6 text-white">{score.score}</td>
                        <td className="py-4 px-6 text-white">{new Date(score.date).toLocaleDateString()}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

function TriviaCard({lyricsChoice, songs, score, setScore, setTriviaState}:
                        {lyricsChoice: LyricsChoice,
                            songs: any[],
                            score: number
                            setScore: React.Dispatch<React.SetStateAction<number>>
                            setTriviaState: React.Dispatch<React.SetStateAction<TriviaState>>}) {
    // Select a random song
    const song = songs[Math.floor(Math.random() * songs.length)];
    // Select lyric type based on selected lyrics choice
    const lyrics: string = lyricsChoice === LyricsChoice.Burmese ? song.burmese : song.romanized;
    // Extract lyric line to be asked randomly (2 if start or end, 3 if middle)
    const lyricLines: string[] = lyrics.split("\n").filter(line => line.trim() !== "");
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
    const randomLyricIndexes: number[] = [];
    let i = 0;
    while (i < 3) {
        const randomIndex = Math.floor(Math.random() * lyricLines.length);
        if (randomIndex !== lyricIndex && !lyricToAskNeighborsIndexes.includes(randomIndex) &&
            lyricLines[randomIndex] !== lyricToAsk && !lyricToAskNeighbors.includes(lyricLines[randomIndex])
            && !randomLyricIndexes.includes(randomIndex)
        ) {
            randomLyricIndexes.push(randomIndex);
            i++;
        }
    }
    const randomLyrics: string[] = randomLyricIndexes.map(index => lyricLines[index]);

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

    // Display
    return (
        <div className="flex flex-col justify-center items-center">
            <div className="flex flex-row justify-between gap-x-6 items-center">
                <h2 className="text-3xl p-4 text-center mb-6 bg-black bg-opacity-70 rounded-2xl max-md:text-xl">
                    {`Score : ${score}`}
                </h2>
                <button
                    className="text-3xl p-4 text-center mb-6 bg-black bg-opacity-70 rounded-2xl max-md:text-xl hover:bg-red-600"
                    onClick={() => {setScore(0); setTriviaState(TriviaState.Start);}}
                >
                    Quit
                </button>
            </div>
            <h3 className="text-lg p-4 text-center mb-6 bg-black bg-opacity-70 rounded-2xl w-[40vw] max-md:w-[80vw] max-md:text-sm">
                {lyricToAskNeighborsIndexes.length === 1 ?
                lyricIndex < lyricToAskNeighborsIndexes[0] ?
                    <div className="flex flex-col gap-4">
                        <p>_______________________</p>
                        <p>{lyricToAskNeighbors[0]}</p>
                    </div>
                    :
                    <div className="flex flex-col gap-4">
                        <p>{lyricToAskNeighbors[0]}</p>
                        <p>_______________________</p>
                    </div>
                    :
                    <div className="flex flex-col gap-4">
                        <p>{lyricToAskNeighbors[0]}</p>
                        <p>_______________________</p>
                        <p>{lyricToAskNeighbors[1]}</p>
                    </div>
                }
            </h3>
            <div className="flex flex-col gap-6">
                {randomLyrics.map((lyric, index) => (
                    <button key={index} className="text-lg bg-blue-500 text-white p-2 rounded-2xl hover:bg-green-600 w-[40vw] max-md:w-[80vw] max-md:text-sm"
                            onClick={() => checkLyric(lyric)}
                    >
                        {lyric}
                    </button>
                ))}
            </div>
        </div>
    );
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
