"use client";
import React, { useState, useEffect, useRef } from 'react';
import ExtLinks from '@/app/components/music-box/ExtLinks';
import LyricsSection from '@/app/components/music-box/LyricsSection';

interface SyncedLyricsPlayerProps {
  youtubeLinks: string[] | undefined;
  spotifyLink: string | undefined;
  appleMusicLink: string | undefined;
  romanized: string;
  burmese: string;
  meaning: string;
  initialOption?: string;
}

interface ParsedLyric {
  text: string;
  startTime: number; // in seconds
}

const SyncedLyricsPlayer = ({
  youtubeLinks,
  spotifyLink,
  appleMusicLink,
  romanized,
  burmese,
  meaning,
  initialOption = 'burmese'
}: SyncedLyricsPlayerProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [parsedLyrics, setParsedLyrics] = useState<ParsedLyric[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [selectedOption, setSelectedOption] = useState(initialOption);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Set up the refs array when lyrics change
  useEffect(() => {
    // Reset refs array to match the number of lyrics
    lyricRefs.current = Array(parsedLyrics.length).fill(null);
  }, [parsedLyrics.length]);
  
  // Parse lyrics when selected option changes
  useEffect(() => {
    const selectedLyrics = selectedOption === "romanized" 
      ? romanized 
      : selectedOption === "burmese" 
        ? burmese 
        : meaning;
    
    const parsed = parseLyricsWithTimestamps(selectedLyrics);
    setParsedLyrics(parsed);
  }, [selectedOption, romanized, burmese, meaning]);
  
  // Check if lyrics have timestamps
  const [hasTimestamps, setHasTimestamps] = useState(false);
  
  useEffect(() => {
    // Check if any lyrics have timestamps
    setHasTimestamps(parsedLyrics.some(lyric => lyric.startTime >= 0));
  }, [parsedLyrics]);
  
  // Find active lyric based on current time
  useEffect(() => {
    // Only sync if player is visible and lyrics have timestamps
    if (!playerVisible || !hasTimestamps) {
      setActiveLyricIndex(-1);
      return;
    }
    
    const newActiveIndex = parsedLyrics.findIndex((lyric, index, array) => {
      const nextLyric = array[index + 1];
      
      // Only consider lyrics with timestamps
      if (lyric.startTime >= 0) {
        // If there's a next lyric with timestamp, use its start time as the end boundary
        if (nextLyric && nextLyric.startTime >= 0) {
          return lyric.startTime <= currentTime && nextLyric.startTime > currentTime;
        } 
        // For the last lyric, keep it active until the end of the song
        else {
          return lyric.startTime <= currentTime;
        }
      }
      
      return false;
    });
    
    if (newActiveIndex !== -1 && newActiveIndex !== activeLyricIndex) {
      setActiveLyricIndex(newActiveIndex);
      
      // Auto-scroll to active lyric using the ref
      setTimeout(() => {
        const activeElement = lyricRefs.current[newActiveIndex];
        if (activeElement && lyricsContainerRef.current) {
          activeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  }, [currentTime, parsedLyrics, playerVisible, activeLyricIndex]);
  
  // Parse lyrics with timestamps
  function parseLyricsWithTimestamps(lyrics: string): ParsedLyric[] {
    const lines = lyrics.split('\n');
    return lines.map(line => {
      // Match timestamp pattern [mm:ss] or [m:ss]
      const match = line.match(/^\[(\d+):(\d+)\](.*)/);
      
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const startTime = minutes * 60 + seconds;
        const text = match[3].trim();
        return { text, startTime };
      }
      
      // Line without timestamp
      return { text: line, startTime: -1 };
    });
  }
  
  // Handle player progress updates
  const handleProgress = (playedSeconds: number) => {
    setCurrentTime(playedSeconds);
  };
  
  // Handle toggling the YouTube player
  const handleTogglePlayer = (isVisible: boolean) => {
    setPlayerVisible(isVisible);
  };
  
  // Custom renderer for lyrics that adds highlighting and click-to-seek
  const renderSyncedLyrics = (lyrics: string) => {
    // We're not using the lyrics parameter directly because we've already parsed it
    return (
      <div ref={lyricsContainerRef} className="w-full overflow-x-hidden">
        {parsedLyrics.map((lyric, index) => (
          <div 
            key={index}
            ref={(el) => { lyricRefs.current[index] = el; }}
            className={`lyric-line ${index === activeLyricIndex && playerVisible ? 'active font-bold text-blue-400' : ''}`}
            onClick={() => handleLyricClick(lyric.startTime)}
            style={{ 
              cursor: lyric.startTime >= 0 && playerVisible ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              padding: '4px 0',
              overflowX: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {lyric.text}
          </div>
        ))}
      </div>
    );
  };
  
  // Handle clicking on a lyric line to seek
  const handleLyricClick = (startTime: number) => {
    if (startTime >= 0 && playerVisible) {
      // We'll use the onYoutubeToggle callback to communicate with the YouTube player
      // The actual seeking happens in the YoutubePlayer component
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
  
  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      {/* Use ExtLinks with the callbacks */}
      <ExtLinks 
        youtube={youtubeLinks} 
        spotify={spotifyLink} 
        apple={appleMusicLink}
        onYoutubeToggle={handleTogglePlayer}
        onProgress={handleProgress}
      />
      
      {/* Use LyricsSection with the custom renderer */}
      <LyricsSection 
        romanized={romanized}
        burmese={burmese}
        meaning={meaning}
        initialOption={selectedOption}
        customRenderer={renderSyncedLyrics}
        onOptionChange={setSelectedOption}
      />
    </div>
  );
};

export default SyncedLyricsPlayer;