import Link from "next/link";
import type { SongEntity } from "@/modules/songs/domain/song.types";

export default function SongOfTheDay({ song, locale }: { song: SongEntity; locale: string }) {
  const englishTitle = song.songName.split("(")[0].trim();
  const burmeseTitle = song.songName.split("(")[1]?.replace(/[()]/g, "").trim();
  const displayTitle = locale === "my" ? burmeseTitle || englishTitle : englishTitle;
  const href = `/${locale}/song/${encodeURIComponent(englishTitle.replace(/\s/g, "") || "song")}/${song.mmid}`;

  return <section aria-labelledby="song-of-day-heading" className="bg-background">
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-14">
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-accent">A pick from our collection</p>
        <h2 id="song-of-day-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Song of the Day</h2>
      </div>
      <Link href={href} className="group grid overflow-hidden rounded-xl border border-theme-border bg-surface transition-colors hover:border-accent hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="aspect-[16/10] overflow-hidden bg-surface-raised sm:aspect-square">
          {song.imageLink ? <img src={song.imageLink} alt="" loading="lazy" className="h-full w-full object-cover" /> :
            <div aria-hidden="true" className="flex h-full w-full items-center justify-center text-6xl text-accent">♫</div>}
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-3 p-5 sm:p-7">
          <h3 className="break-words text-xl font-semibold leading-snug text-foreground group-hover:text-accent sm:text-2xl">{displayTitle}</h3>
          <p className="text-sm text-muted">{song.artistName.map(artist => artist.name).join(", ")}</p>
          {song.about && <p className="line-clamp-2 max-w-2xl text-sm leading-7 text-muted">{song.about}</p>}
          <span className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-accent underline decoration-accent underline-offset-4">Discover this song <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">→</span></span>
        </div>
      </Link>
    </div>
  </section>;
}
