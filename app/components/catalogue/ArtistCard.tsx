"use client";
import React, {useState} from "react";
import Link from "next/link";
import type {ArtistCatalogueRecord} from "@/modules/artists";
import type {SongEntity} from "@/modules/songs";
import {extractSongName, formatSongNameForURL} from "@/app/lib/utils";

interface ArtistCardProps {
  locale: string;
  artist: ArtistCatalogueRecord;
  songs: SongEntity[];
}

const ArtistCard = ({locale, artist, songs}: ArtistCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const listId = `artist-songs-${artist.slug}`;

  return (
    <article className="w-full min-w-0 border-b border-[#514335] py-5 sm:py-6">
      <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-6">
        {artist.imageLink ? (
          <img src={artist.imageLink} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-sm object-cover sm:h-20 sm:w-20" />
        ) : (
          <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#302A24] text-3xl text-[#DAA276] sm:h-20 sm:w-20">♫</div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-semibold text-[#F3EDE3]">
            <Link href={`/${locale}/artist/${artist.slug}`} className="hover:text-[#DAA276]">{artist.name}</Link>
          </h2>
          <p className="mt-1 text-sm text-[#CBBEAE]">{[artist.type, ...(artist.musicGenre ?? []).slice(0, 2)].filter(Boolean).join(" · ")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <Link href={`/${locale}/artist/${artist.slug}`} className="font-medium text-[#DAA276] underline-offset-4 hover:underline">Artist profile →</Link>
            <button type="button" aria-expanded={expanded} aria-controls={listId}
              onClick={() => setExpanded(value => !value)}
              className="min-h-11 font-medium text-[#F3EDE3] underline-offset-4 hover:text-[#DAA276] hover:underline">
              {expanded ? "Hide songs ↑" : `Songs (${songs.length}) ↓`}
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div id={listId} className="mt-4 border-l-2 border-[#DAA276] pl-4 sm:ml-24 sm:pl-6">
          {songs.length ? (
            <ul className="divide-y divide-[#514335]">
              {songs.map(song => {
                const names = extractSongName(song.songName);
                const display = locale === "my" ? names.mmName || names.engName : names.engName;
                const href = `/${locale}/song/${formatSongNameForURL(names.engName)}/${song.mmid}`;
                return <li key={song.mmid}><Link href={href} className="block py-3 text-[#F3EDE3] hover:text-[#DAA276]">{display} →</Link></li>;
              })}
            </ul>
          ) : <p className="py-3 text-sm text-[#CBBEAE]">No songs available yet.</p>}
        </div>
      )}
    </article>
  );
};
export default ArtistCard;
