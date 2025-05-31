"use client";
import React, { useState, useEffect } from 'react';
import ExtLinks from '../music-box/ExtLinks';
import LyricsSection from '../music-box/LyricsSection';

interface SyncedLyricsPlayerProps {
    extLinks: {
        youtube: string[] | undefined,
        spotify: string | undefined,
        apple: string | undefined
    },
    lyrics: {
        romanized: string,
        burmese: string,
        meaning: string,
        initialOption?: string
    }
}

interface ParsedLyric {
    text: string;
    startTime: number;
}

const SyncedLyricsPlayer = ({extLinks, lyrics}: SyncedLyricsPlayerProps) => {
    const [hasTimestamps, setHasTimestamps] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [parsedLyrics, setParsedLyrics] = useState<ParsedLyric[]>([]);
    const [activeLyricIndex, setActiveLyricIndex] = useState(0);

    const [playerVisible, setPlayerVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState(lyrics.initialOption || "burmese");

    // Parse lyrics when selected option changes
    useEffect(() => {
        const selectedLyrics = selectedOption === "romanized"
            ? lyrics.romanized
            : selectedOption === "burmese"
                ? lyrics.burmese
                : lyrics.meaning;

        const parsed = parseLyricsWithTimestamps(selectedLyrics);
        setParsedLyrics(parsed);
    }, [selectedOption, lyrics.romanized, lyrics.burmese, lyrics.meaning]);

    // Check if lyrics have timestamps
    useEffect(() => {
        setHasTimestamps(parsedLyrics.some(lyric => lyric.startTime >= 0));
    }, [parsedLyrics]);

    

    // Handle progress update from player
    const handleProgress = (playedSeconds: number) => {
        setCurrentTime(playedSeconds);
    };

    const handleTogglePlayer = (isVisible: boolean) => {
        setPlayerVisible(isVisible);
    };

    // Parse lyrics with timestamps
    function parseLyricsWithTimestamps(lyrics: string): ParsedLyric[] {
        const lines = lyrics.split('\n');
        const parsed: ParsedLyric[] = [];
        
        lines.forEach(line => {
            const match = line.match(/^\[(\d+):(\d+)\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const startTime = minutes * 60 + seconds;
                const text = match[3].trim();
                parsed.push({ text, startTime });
            } else {
                parsed.push({ text: line.trim(), startTime: -1 });
            }
        });
        
        return parsed;
    }

    // Render highlighted synced lyrics
    const renderSyncedLyrics = () => (
        <div className="w-full overflow-x-hidden">
          {parsedLyrics.map((lyric, index) => (
            <div
              key={index}
              className={
                `${index === activeLyricIndex && playerVisible ? 
                    'active font-bold text-blue-500' : ''}
                    transition-all duration-300 ease-in-out overflow-x-hidden
                    `
                }
            >
              {lyric.text}
            </div>
          ))}
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-8 mb-6">
            <ExtLinks 
            youtube={extLinks.youtube} 
            spotify={extLinks.spotify} 
            apple={extLinks.apple}/>
            <LyricsSection 
            romanized={lyrics.romanized} 
            burmese={lyrics.burmese} 
            meaning={lyrics.meaning} 
            initialOption={lyrics.initialOption}/>
        </div>
    )
}

export default SyncedLyricsPlayer
