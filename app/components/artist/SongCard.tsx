import React from "react";
import Image from "next/image";
import Link from "next/link";
import {extractSongName} from "@/app/lib/utils";

interface SongCardProps {
  songName: string;
  mmid: number;
  imageLink: string;
  locale: string;
}

const SongCard = ({songName, mmid, imageLink, locale}: SongCardProps) => {
  const names = extractSongName(songName);
  const urlName = names.engName.replace(/\s/g, "").trim();
  const displayName = locale === "my" ? names.mmName || names.engName : names.engName;
  return (
    <Link href={`/${locale}/song/${urlName}/${mmid}`}
      className="group flex min-w-0 items-center gap-4 border border-theme-border bg-surface p-3 transition-colors hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-surface-raised text-2xl text-accent">
        {imageLink ? <Image src={imageLink} alt="" width={80} height={80} className="h-20 w-20 object-cover" /> : "♫"}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 break-words font-semibold leading-relaxed text-foreground group-hover:text-accent">{displayName}</h3>
        <span className="mt-2 block text-xs font-medium uppercase tracking-wider text-accent">Read lyrics →</span>
      </div>
    </Link>
  );
};
export default SongCard;
