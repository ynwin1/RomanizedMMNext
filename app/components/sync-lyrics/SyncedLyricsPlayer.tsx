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
        initialOption: string,
        customRenderer?: (lyrics: string) => React.ReactNode,
        onOptionChange?: (option: string) => void
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

    const [playerVisible, setPlayerVisible] = useState(true);
    const [selectedOption, setSelectedOption] = useState(lyrics.initialOption);

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

    // Highlight active lyric based on current time
    useEffect(() => {
        if (!playerVisible || !hasTimestamps) {
            setActiveLyricIndex(-1);
            return;
        }

        // Find the last lyric that starts before or at the current time
        let newActiveIndex = -1;
        
        for (let i = parsedLyrics.length - 1; i >= 0; i--) {
            const lyric = parsedLyrics[i];
            if (lyric.startTime >= 0 && lyric.startTime <= currentTime) {
                newActiveIndex = i;
                break;
            }
        }
        
        // If we found a valid lyric and it's different from the current active one
        if (newActiveIndex !== -1 && newActiveIndex !== activeLyricIndex) {
            setActiveLyricIndex(newActiveIndex);
        }
    }, [currentTime, parsedLyrics, playerVisible, hasTimestamps, activeLyricIndex]);

    // Handle clicking on a lyric line to seek
    const handleLyricClick = (startTime: number) => {
        if (startTime >= 0 && playerVisible) {
            const event = new CustomEvent('seek-youtube', { 
                detail: { time: startTime } 
            });
            window.dispatchEvent(event);
        }
    };

    // Add event listener for seeking
    useEffect(() => {
        const handleSeek = (e: Event) => {
        const seekEvent = e as CustomEvent;
        const time = seekEvent.detail?.time;
        if (typeof time === 'number') {
            setCurrentTime(time);
        }
    };

    window.addEventListener('youtube-progress', handleSeek);

    return () => {
        window.removeEventListener('youtube-progress', handleSeek);
        };
    }, []);

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
              onClick={() => handleLyricClick(lyric.startTime)}
              className={
                `
                transition-all duration-300 ease-in-out overflow-x-hidden
                ${playerVisible ? 'hover:text-green-500 hover:cursor-pointer' : ''}
                ${index === activeLyricIndex && playerVisible ? 'active font-bold text-blue-500' : ''}
                `
              }
            >
              {lyric.text}
              <br/>
            </div>
          ))}
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-8 mb-6">
            <ExtLinks 
            youtube={extLinks.youtube} 
            spotify={extLinks.spotify} 
            apple={extLinks.apple}
            playerVisible={playerVisible}
            onYoutubeToggle={handleTogglePlayer}
            onProgress={handleProgress}
            />
            <LyricsSection 
            romanized={lyrics.romanized} 
            burmese={lyrics.burmese} 
            meaning={lyrics.meaning} 
            selectedOption={selectedOption}
            hasTimestamps={hasTimestamps}
            customRenderer={renderSyncedLyrics}
            onOptionChange={setSelectedOption}
            />
        </div>
    )
}

export default SyncedLyricsPlayer
