"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { parseLyricsWithTimestamps, selectLyricsText } from './lyrics-parser';
import ExtLinks from '../music-box/ExtLinks';
import type { LyricsV2 } from '@/modules/songs/domain/lyrics-v2.types';
import type { LyricTimingTrack } from '@/modules/songs/domain/lyric-timing.types';
import { syncedEntries, activeSyncedEntry } from './timing-display';
import LyricsSection from '../music-box/LyricsSection';

interface SyncedLyricsPlayerProps {
    timing?: { lyricsV2: LyricsV2; tracks: Record<string, LyricTimingTrack>; videoIds: string[] };
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

const SyncedLyricsPlayer = ({extLinks, lyrics, timing}: SyncedLyricsPlayerProps) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [videoIndex, setVideoIndex] = useState(0);
    const track = timing?.tracks[timing.videoIds[videoIndex] ?? ""] ?? null;
    const [activeLyricIndex, setActiveLyricIndex] = useState(0);

    const [playerVisible, setPlayerVisible] = useState(true);
    const [selectedOption, setSelectedOption] = useState(lyrics.initialOption);
    const aligned = timing?.lyricsV2 && track ? syncedEntries(timing.lyricsV2, selectedOption) : null;
    const activeEntry = activeSyncedEntry(track, Math.round(currentTime * 1000));

    // Compute the selected text during rendering, including the initial server render.
    // useEffect runs only in the browser, so it must not populate the first set of lyric lines.
    const selectedText = selectLyricsText(lyrics, selectedOption);
    const parsedLyrics = useMemo(() => parseLyricsWithTimestamps(selectedText), [selectedText]);
    const hasTimestamps = Boolean(aligned) || parsedLyrics.some(lyric => lyric.startTime >= 0);

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

    // Only timestamped lines with an available player are interactive.
    const renderSyncedLyrics = () => aligned ? (
        <div className="w-full">{aligned.map(line => {
            const timingLine = track?.lines.find(item => item.entryIndex === line.entryIndex);
            const seekable = playerVisible && timingLine && !line.isBreak;
            const className = `block w-full whitespace-pre-wrap break-words py-1 transition-colors ${activeEntry === line.entryIndex && playerVisible ? "font-semibold text-accent" : "text-inherit"}`;
            return seekable ? <button key={line.entryIndex} type="button" className={className + " cursor-pointer text-left sm:text-center hover:text-accent-hover"} onClick={() => handleLyricClick(timingLine.startMs / 1000)}>{line.text || "\u00a0"}</button> :
                <div key={line.entryIndex} className={className}>{line.text || "\u00a0"}</div>;
        })}</div>
    ) : (
        <div className="w-full">
            {parsedLyrics.map((lyric, index) => {
                const seekable = playerVisible && lyric.startTime >= 0;
                const active = seekable && index === activeLyricIndex;
                const className = `block w-full whitespace-pre-wrap break-words py-1 text-inherit transition-colors ${
                    active ? "font-semibold text-accent" : seekable ? "hover:text-accent-hover" : ""
                }`;
                return seekable ? (
                    <button type="button" key={index} className={className + " cursor-pointer text-left sm:text-center"}
                        aria-label={`Seek to lyric: ${lyric.text}`}
                        onClick={() => handleLyricClick(lyric.startTime)}>
                        {lyric.text || "\u00a0"}
                    </button>
                ) : (
                    <div key={index} className={className}>{lyric.text || "\u00a0"}</div>
                );
            })}
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
            onVideoChange={index => { setVideoIndex(index); setCurrentTime(0); }}
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
