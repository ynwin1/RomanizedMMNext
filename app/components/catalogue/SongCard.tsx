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
  const secondaryName = locale === "my" ? engName : burmeseName;
  const songURL = `/${locale}/song/${engName.replace(/\s/g, "")}/${song.mmid}`;

  return (
    <Link href={songURL} className="group flex min-w-0 items-center gap-4 rounded-xl border border-theme-border bg-surface p-3 transition-colors hover:border-accent hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-raised sm:h-24 sm:w-24">
        {song.imageLink ? (
          <img src={song.imageLink} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div aria-hidden="true" className="flex h-full w-full items-center justify-center text-3xl text-accent">♫</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 className="line-clamp-2 break-words text-base font-semibold leading-snug text-foreground group-hover:text-accent sm:text-lg">{displayName}</h2>
        {secondaryName && secondaryName !== displayName && <p className="truncate text-xs text-muted">{secondaryName}</p>}
        <p className="line-clamp-1 text-sm text-muted">{song.artistName.map(artist => artist.name).join(", ")}</p>
        <span className="pt-1 text-xs font-semibold text-accent">{locale === "my" ? "စာသားဖတ်ရန်" : "Read lyrics"} <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
};

export default SongCard;
