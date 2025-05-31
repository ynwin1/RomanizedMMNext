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

const SyncedLyricsPlayer = ({extLinks, lyrics}: SyncedLyricsPlayerProps) => {
    return (
        <div className="flex flex-col items-center gap-8 mb-6">
            <ExtLinks youtube={extLinks.youtube} spotify={extLinks.spotify} apple={extLinks.apple}/>
            <LyricsSection romanized={lyrics.romanized} burmese={lyrics.burmese} meaning={lyrics.meaning} initialOption={lyrics.initialOption}/>
        </div>
    )
}

export default SyncedLyricsPlayer
