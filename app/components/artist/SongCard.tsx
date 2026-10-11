import React from "react";
import Image from "next/image";
import Link from "next/link";
import {extractSongName, formatSongNameForURL} from "@/app/lib/utils";

interface SongCardProps {
  songName: string;
  mmid: number;
  imageLink: string;
  locale: string;
}

const SongCard = ({songName, mmid, imageLink, locale}: SongCardProps) => {
  const names = extractSongName(songName);
  const urlName = formatSongNameForURL(names.engName);
  const displayName = locale === "my" ? names.mmName || names.engName : names.engName;
  const secondaryName = locale === "my" ? names.engName : names.mmName;
  return (
    <Link href={`/${locale}/song/${urlName}/${mmid}`}
      className="group flex min-w-0 items-center gap-4 rounded-xl border border-theme-border bg-surface p-3 transition-colors hover:border-accent hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-raised text-2xl text-accent">
        {imageLink ? <Image src={imageLink} alt="" width={80} height={80} className="h-20 w-20 object-cover" /> : "♫"}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 break-words font-semibold leading-relaxed text-foreground group-hover:text-accent">{displayName}</h3>
        {secondaryName && secondaryName !== displayName && <p className="mt-1 truncate text-xs text-muted">{secondaryName}</p>}
        <span className="mt-2 block text-xs font-semibold text-accent">{locale === "my" ? "စာသားဖတ်ရန်" : "Read lyrics"} →</span>
      </div>
    </Link>
  );
};
export default SongCard;
