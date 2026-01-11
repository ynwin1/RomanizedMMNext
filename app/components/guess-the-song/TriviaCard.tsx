import { useState } from "react";
import { useTimer } from "react-timer-hook";
import {TriviaState} from "@/app/lib/types";
import AudioPlayer from "./AudioPlayer";
import { useEffect } from "react";

export function TriviaCard({songs, score, setScore, setTriviaState}:
                        {songs: any[],
                        score: number,
                        setScore: React.Dispatch<React.SetStateAction<number>>,
                        setTriviaState: React.Dispatch<React.SetStateAction<TriviaState>>}) {
    
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [selectedSongs, setSelectedSongs] = useState<any[]>([]);
    const [correctSong, setCorrectSong] = useState<any>(null);
    const [isSkipping, setIsSkipping] = useState(false);

    // Initialize songs on mount
    useEffect(() => {
        selectNewSongs();
    }, [currentSongIndex]);

    const selectNewSongs = () => {
        let newSelectedSongs: any[] = [];
        
        // Select a random song and mark it as correct
        const newCorrectSong: any = songs[Math.floor(Math.random() * songs.length)];
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
        console.log('Song cannot be played, Skipping...');
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
            <div className="text-3xl p-4 text-center mb-6 bg-black bg-opacity-70 rounded-2xl w-[4rem] max-md:text-xl">
                <h1>{seconds}s</h1>
            </div>
        )
    }

    function checkCorrectSong(id: number) {
        if (id === correctSong.mmid) {
            setScore((score: number) => score + 1);
        } else {
            setTriviaState(TriviaState.End);
        }
    }

    if (selectedSongs.length === 0) {
        return <div>Loading...</div>;
    }

    // Display
    return (
        <div className="flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center py-8">
                <div className="flex flex-row justify-between gap-x-6 items-center">
                    <h2 className="text-3xl p-4 text-center mb-6 bg-black bg-opacity-70 rounded-2xl max-md:text-xl">
                        {`Score : ${score}`}
                    </h2>
                    <Timer expiryTimestamp={new Date(expiryTime)} onExpire={() => setTriviaState(TriviaState.End)} />
                    <button
                        className="text-3xl p-4 text-center mb-6 bg-black bg-opacity-70 rounded-2xl max-md:text-xl hover:bg-red-600"
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
                url={correctSong.youtubeLink[0]} 
                onEmbeddingError={handleEmbeddingError}
            />

            <div className="flex flex-col mt-6 mb-6 gap-6">
                {selectedSongs.map((song, index) => (
                    <button
                        key={index}
                        disabled={isSkipping}
                        className={`text-lg bg-blue-500 text-white p-2 rounded-2xl hover:bg-green-600 w-[40vw] max-md:w-[80vw] max-md:text-sm
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