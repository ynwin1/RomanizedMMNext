import type {PlaylistEntity} from "@/modules/playlists/domain/playlist.types";
import Image from "@/app/components/media/ResilientImage";
import PlaylistPreview from "./PlaylistPreview";

const platformNames = {spotify: "Spotify", youtube: "YouTube", apple_music: "Apple Music"} as const;

export default function PlaylistCard({playlist, locale}: {playlist: PlaylistEntity; locale: string}) {
  return <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-theme-border bg-surface p-4 sm:p-5">
    <div className="flex min-w-0 gap-4">
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-raised text-3xl text-accent sm:h-28 sm:w-28">
        {playlist.imageUrl ? <Image src={playlist.imageUrl} alt="" fill sizes="112px" className="object-cover" /> : <span aria-hidden="true">♫</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <span className="rounded-full border border-theme-border-subtle bg-surface-raised px-2.5 py-1 text-xs font-semibold text-accent">{platformNames[playlist.platform]}</span>
        <h3 className="line-clamp-2 break-words text-lg font-semibold leading-snug text-foreground">{playlist.title}</h3>
        {playlist.curator && <p className="line-clamp-1 break-words text-sm text-muted">{locale === "my" ? "ဖန်တီးသူ" : "By"} {playlist.curator}</p>}
      </div>
    </div>
    {playlist.description && <p className="line-clamp-2 break-words text-sm leading-relaxed text-muted">{playlist.description}</p>}
    <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-theme-border-subtle pt-3">
      <a href={playlist.url} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover">
        {locale === "my" ? `${platformNames[playlist.platform]} တွင် နားထောင်ရန်` : `Listen on ${platformNames[playlist.platform]}`} ↗
      </a>
    </div>
    {playlist.platform === "spotify" && <PlaylistPreview playlistId={playlist.platformPlaylistId} title={playlist.title} locale={locale} />}
  </article>;
}
