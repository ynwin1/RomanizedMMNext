import { useState } from "react";
import { useTimer } from "react-timer-hook";
import {TriviaState} from "@/app/lib/types";
import AudioPlayer from "./AudioPlayer";
import { useEffect } from "react";
import type { GuessSongRecord } from "@/modules/songs";

export function TriviaCard({songs, score, setScore, setTriviaState}:
                        {songs: GuessSongRecord[],
                        score: number,
                        setScore: React.Dispatch<React.SetStateAction<number>>,
                        setTriviaState: React.Dispatch<React.SetStateAction<TriviaState>>}) {
    
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [selectedSongs, setSelectedSongs] = useState<GuessSongRecord[]>([]);
    const [correctSong, setCorrectSong] = useState<GuessSongRecord | null>(null);
    const [isSkipping, setIsSkipping] = useState(false);

    // Initialize songs on mount
    useEffect(() => {
        selectNewSongs();
    }, [currentSongIndex]);

    const selectNewSongs = () => {
        const newSelectedSongs: GuessSongRecord[] = [];
        
        // Select a random song and mark it as correct
        const newCorrectSong = songs[Math.floor(Math.random() * songs.length)];
        newSelectedSongs.push(newCorrectSong);

        // Select 3 other random songs
        while (newSelectedSongs.length < 4) {
            const song = songs[Math.floor(Math.random() * songs.length)];
            if (!newSelectedSongs.some(s => s.mmid === song.mmid)) {
                newSelectedSongs.push(song);
            }
        }
        
        // Shuffle the selected songs AFTER adding all of them
        newSelectedSongs.sort(() => Math.random() - 0.5);
        
        // Set both the shuffled songs and the correct answer
        setSelectedSongs(newSelectedSongs);
        setCorrectSong(newCorrectSong);
    };

    const handleEmbeddingError = () => {
        setIsSkipping(true);
        // Wait 3 seconds then select new songs
        setTimeout(() => {
            setCurrentSongIndex(prev => prev + 1);
            setExpiryTime(new Date().getTime() + timer);
            setIsSkipping(false);
        }, 3000);
    };

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

    function checkCorrectSong(id: number) {
        if (!correctSong) {
            return;
        }

        if (id === correctSong.mmid) {
            setScore((score: number) => score + 1);
        } else {
            setTriviaState(TriviaState.End);
        }
    }

    if (selectedSongs.length === 0 || !correctSong) {
        return <div role="status" className="rounded-xl border border-theme-border bg-surface p-6 text-center text-muted">Loading round…</div>;
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
            </div>

            {/* Music Player */}
            <AudioPlayer 
                url={correctSong.youtubeLink![0]} 
                onEmbeddingError={handleEmbeddingError}
            />

            <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedSongs.map((song, index) => (
                    <button
                        key={index}
                        disabled={isSkipping}
                        className={`min-h-14 rounded-lg border border-theme-border bg-surface-raised p-4 text-left text-sm leading-relaxed text-foreground hover:border-accent hover:bg-accent hover:text-on-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base
                                ${isSkipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => checkCorrectSong(song.mmid)}
                    >
                        {song.songName}
                </button>
                ))}
            </div>
        </div>
    );
}
