"use client";
import React from "react";
import YoutubePlayer from "@/app/components/youtube-player/YoutubePlayer";

interface ExtLinksProps {
  youtube: string[] | undefined;
  spotify: string | undefined;
  apple: string | undefined;
  playerVisible: boolean;
  onYoutubeToggle: (isVisible: boolean) => void;
  onProgress: (playedSeconds: number) => void;
}

const ExtLinks = ({youtube, spotify, apple, playerVisible, onYoutubeToggle, onProgress}: ExtLinksProps) => {
  const hasYoutube = Boolean(youtube?.length);
  const hasExternal = Boolean(spotify || apple);
  return (
    <section aria-label="Listen to this song" className="mb-5 flex w-full min-w-0 flex-col items-center gap-5">
      {(hasYoutube || hasExternal) && (
        <div className="flex max-w-full flex-wrap items-center justify-center gap-3 border border-[#514335] bg-[#24211E] px-3 py-2 sm:gap-5 sm:px-5">
          {hasYoutube && (
            <button type="button" aria-label={playerVisible ? "Hide YouTube player" : "Show YouTube player"}
              aria-pressed={playerVisible} onClick={() => onYoutubeToggle(!playerVisible)}
              className="flex min-h-11 min-w-14 items-center justify-center rounded-sm px-2 transition-colors hover:bg-[#302A24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#DAA276]">
              <img src="/media/youtube.png" alt="" width="56" height="40" loading="lazy" className="h-auto w-12 sm:w-14" />
            </button>
          )}
          {spotify && (
            <a href={spotify} target="_blank" rel="noopener noreferrer" aria-label="Listen on Spotify (opens in a new tab)"
              className="flex min-h-11 min-w-14 items-center justify-center rounded-sm px-2 hover:bg-[#302A24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#DAA276]">
              <img src="/media/spotify.png" alt="" width="56" height="40" loading="lazy" className="h-auto w-12 sm:w-14" />
            </a>
          )}
          {apple && (
            <a href={apple} target="_blank" rel="noopener noreferrer" aria-label="Listen on Apple Music (opens in a new tab)"
              className="flex min-h-11 min-w-14 items-center justify-center rounded-sm px-2 hover:bg-[#302A24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#DAA276]">
              <img src="/media/appleMusic.png" alt="" width="56" height="40" loading="lazy" className="h-auto w-12 sm:w-14" />
            </a>
          )}
        </div>
      )}
      {hasYoutube && playerVisible && <div className="w-full min-w-0"><YoutubePlayer links={youtube!} onProgress={onProgress} /></div>}
    </section>
  );
};
export default ExtLinks;
