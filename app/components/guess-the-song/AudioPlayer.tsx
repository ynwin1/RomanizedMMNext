import { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player/youtube";
import { useTranslations } from "next-intl";
import { logger } from "@/infrastructure/logging/logger";

interface AudioOnlyPlayerProps {
  url: string;
  onEmbeddingError?: () => void;
}

export default function AudioOnlyPlayer({ url, onEmbeddingError }: AudioOnlyPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const translator = useTranslations('GuessTheSong');
  const playRandomSnippet = () => {
    const player = playerRef.current;
    if (!player || !isReady) {
      return;
    }

    const duration = player.getDuration();
    if (!duration || duration < 15) {
      return;
    }

    const maxStart = duration - 15;
    const start = Math.random() * maxStart;

    // Clear any existing timer
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
    }

    // Seek first
    player.seekTo(start, "seconds");
    
    // Then play after a short delay to allow seek to complete
    setTimeout(() => {
      const internalPlayer = player.getInternalPlayer();
      if (internalPlayer && typeof internalPlayer.playVideo === 'function') {
        internalPlayer.playVideo();
        setIsPlaying(true);
      }
    }, 300);

    // Stop after 15 seconds
    stopTimerRef.current = setTimeout(() => {
      const internalPlayer = player.getInternalPlayer();
      if (internalPlayer && typeof internalPlayer.pauseVideo === 'function') {
        internalPlayer.pauseVideo();
      }
      player.seekTo(0);
      setIsPlaying(false);
    }, 15_300);
  };

  const handleClick = () => {
    if (hasError) {
      return;
    }

    if (!isReady) {
      return;
    }

    playRandomSnippet();
  };

  const handleReady = () => {
    const player = playerRef.current;
    if (!player) return;

    const duration = player.getDuration();
    // Set ready state
    setIsReady(true);
    setHasError(false);
    
    // Auto-play when ready
    setTimeout(() => {
      playRandomSnippet();
    }, 500);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleError = (error: any) => {
    logger.warn("Guess The Song player error", { playerCode: typeof error === "number" ? error : undefined });
    
    // Error 150 and 101 mean video cannot be embedded
    if (error === 150 || error === 101 || error === 100) {
      setHasError(true);
      // Call the callback to notify parent component
      if (onEmbeddingError) {
        onEmbeddingError();
      }
    }
    
    setIsPlaying(false);
    setIsReady(false);
  };

  const getStatusText = () => {
    if (hasError) return `❌ ${translator('skip')}`;
    if (!isReady) return `⏳ ${translator('loading')}`;
    if (isPlaying) return `🎵 ${translator('playing')}`;
    return `▶ ${translator('tap')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Main tap / status display */}
      <h2
        className={`text-2xl text-white text-center max-md:text-base 
                    bg-black bg-opacity-80 p-4 rounded-xl max-md:w-[80vw] 
                    ${!hasError && isReady ? 'cursor-pointer hover:bg-opacity-90' : 'cursor-not-allowed opacity-70'}
                    transition-all`}
        onClick={handleClick}
      >
        {getStatusText()}
      </h2>

      {/* Hidden player - NOT auto-playing */}
      <div style={{ width: 1, height: 1, overflow: "hidden" }}>
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={false}
          controls={false}
          width="1px"
          height="1px"
          onReady={handleReady}
          onPlay={handlePlay}
          onPause={handlePause}
          onError={handleError} 
          config={{
            playerVars: {
                playsinline: 1,
                autoplay: 0,
                controls: 0,
              },
          }}
        />
      </div>

      {/* Replay button */}
      {isPlaying && !hasError && (
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
          onClick={playRandomSnippet}
        >
          🔄 {translator('nextSnippet')}
        </button>
      )}
    </div>
  );
}