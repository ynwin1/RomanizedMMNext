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
    <article className="w-full min-w-0 rounded-xl border border-theme-border bg-surface p-4 transition-colors hover:border-accent/50 sm:p-5">
      <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
        {artist.imageLink ? (
          <img src={artist.imageLink} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-lg object-cover sm:h-24 sm:w-24" />
        ) : (
          <div aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-3xl text-accent sm:h-24 sm:w-24">♫</div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-lg font-semibold text-foreground sm:text-xl">
            <Link href={`/${locale}/artist/${artist.slug}`} className="hover:text-accent">{artist.name}</Link>
          </h2>
          <p className="mt-1 text-sm text-muted">{[artist.type, ...(artist.musicGenre ?? []).slice(0, 2)].filter(Boolean).join(" · ") || "Myanmar artist"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link href={`/${locale}/artist/${artist.slug}`} className="font-medium text-accent underline-offset-4 hover:underline">Artist profile →</Link>
            <button type="button" aria-expanded={expanded} aria-controls={listId}
              onClick={() => setExpanded(value => !value)}
              className="min-h-11 font-medium text-foreground underline-offset-4 hover:text-accent hover:underline">
              {expanded ? "Hide songs ↑" : `Songs (${songs.length}) ↓`}
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div id={listId} className="mt-5 border-t border-theme-border pt-2">
          {songs.length ? (
            <ul className="divide-y divide-theme-border">
              {songs.map(song => {
                const names = extractSongName(song.songName);
                const display = locale === "my" ? names.mmName || names.engName : names.engName;
                const href = `/${locale}/song/${formatSongNameForURL(names.engName)}/${song.mmid}`;
                return <li key={song.mmid}><Link href={href} className="block py-3 text-foreground hover:text-accent">{display} →</Link></li>;
              })}
            </ul>
          ) : <p className="py-3 text-sm text-muted">No songs available yet.</p>}
        </div>
      )}
    </article>
  );
};
export default ArtistCard;
