import React from "react";
import Link from "next/link";

interface SongCardProps {
  locale: string;
  song: {
    songName: string;
    artistName: {name: string; slug?: string}[];
    mmid: string;
    imageLink: string;
  };
}

const SongCard = ({locale, song}: SongCardProps) => {
  const engName = song.songName.split("(")[0].trim();
  const burmeseName = song.songName.split("(")[1]?.replace(/[()]/g, "").trim();
  const displayName = locale === "my" ? burmeseName || engName : engName;
  const songURL = `/${locale}/song/${engName.replace(/\s/g, "")}/${song.mmid}`;

  return (
    <Link href={songURL} className="group flex min-w-0 flex-col overflow-hidden border border-theme-border bg-surface transition-colors hover:border-accent hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      {song.imageLink ? (
        <img src={song.imageLink} alt="" loading="lazy" className="aspect-square w-full object-cover" />
      ) : (
        <div aria-hidden="true" className="flex aspect-square items-center justify-center bg-surface-raised text-5xl text-accent">♫</div>
      )}
      <div className="flex min-h-28 flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 break-words text-lg font-semibold leading-snug text-foreground group-hover:text-accent">{displayName}</h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{song.artistName.map(artist => artist.name).join(", ")}</p>
        <span className="mt-auto pt-2 text-xs font-semibold uppercase tracking-wider text-accent">Read lyrics →</span>
      </div>
    </Link>
  );
};

export default SongCard;
