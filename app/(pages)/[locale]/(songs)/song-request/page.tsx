import {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import Link from "next/link";
import {extractSongName, formatSongNameForURL} from "@/app/lib/utils";
import {songRequestService} from "@/modules/requests";
import {songService} from "@/modules/songs";

export const metadata: Metadata = {
    title: 'Song Request',
    description: 'Request a song to be added to the RomanizedMM website!'
};

type SongRequestPageProps = {
    params: Promise<{locale: string}>;
}

export const revalidate = 0;

const Page = async ({params} : SongRequestPageProps) => {
    const { locale } = await params;
    const [songRequests, lastAddedSongs] = await Promise.all([
        songRequestService.getQueue(),
        songService.getLatestSongs(5),
    ]);
    const translator = await getTranslations("SongRequestPage");

    function buildSongNameForURL(songName: string) {
        return formatSongNameForURL(
            extractSongName(songName).engName
        );
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 text-foreground sm:px-6">
            <header className="mb-8 border-b border-theme-border pb-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">RomanizedMM</p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{translator("title")}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{translator("overview")}</p>
            </header>

            <section aria-labelledby="request-status" className="mb-8 rounded-xl border border-theme-border bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 id="request-status" className="text-lg font-semibold">{translator("status")}</h2>
                    <span className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-surface-raised px-3 py-1 text-sm font-medium text-foreground">
                        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-500" />{translator("paused")}
                    </span>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{translator("stopMessage")}</p>
            </section>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                <section aria-labelledby="queue-title" className="min-w-0 rounded-xl border border-theme-border bg-surface p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3 border-b border-theme-border pb-4">
                        <h2 id="queue-title" className="text-xl font-bold">{translator("songsInQueue")}</h2>
                        <span className="rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold text-muted">{songRequests.length}</span>
                    </div>
                    {songRequests.length ? <ul className="divide-y divide-theme-border">
                        {songRequests.map((request, index) => <li key={`${request.songName}-${request.artist}-${index}`} className="min-w-0 py-3 first:pt-0 last:pb-0">
                            <p className="break-words font-medium">{request.songName}</p>
                            <p className="mt-1 break-words text-sm text-muted">{request.artist}</p>
                        </li>)}
                    </ul> : <p className="py-5 text-sm text-muted">{translator("emptyQueue")}</p>}
                </section>

                <section aria-labelledby="recent-title" className="min-w-0 rounded-xl border border-theme-border bg-surface p-5 sm:p-6">
                    <h2 id="recent-title" className="mb-5 border-b border-theme-border pb-4 text-xl font-bold">{translator("lastCreatedSongs")}</h2>
                    {lastAddedSongs.length ? <ul className="divide-y divide-theme-border">
                        {lastAddedSongs.map(lastSong => <li key={lastSong.mmid} className="min-w-0 py-3 first:pt-0 last:pb-0">
                            <Link href={`/${locale}/song/${buildSongNameForURL(lastSong.songName)}/${lastSong.mmid}`} className="block break-words font-medium text-foreground hover:text-accent focus-visible:outline-accent">{lastSong.songName} <span aria-hidden="true" className="text-accent">→</span></Link>
                            <p className="mt-1 break-words text-sm text-muted">{lastSong.artistName.map(artist => artist.name).join(", ")}</p>
                        </li>)}
                    </ul> : <p className="py-5 text-sm text-muted">{translator("noRecent")}</p>}
                </section>
            </div>
            <div className="mt-8 text-center">
                <Link href={`/${locale}/song-catalogue`} className="inline-flex min-h-11 items-center rounded-lg border border-theme-border bg-surface px-5 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">{translator("browseSongs")} <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
        </main>
    )
}
export default Page;
