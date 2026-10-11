import React from 'react';
import SearchBar from "@/app/components/searchbar/SearchBar";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import SyncedLyricsPlayer from "@/app/components/sync-lyrics/SyncedLyricsPlayer";
import {getTranslations, setRequestLocale} from "next-intl/server";
import Image from '@/app/components/media/ResilientImage';
import SongReportButton from "@/app/components/buttons/SongReportButton";
import SocialShare from "@/app/components/social/SocialShare";
import {buildArtistNames} from "@/app/lib/utils";
import {songSeo, jsonLdScriptValue} from "@/app/lib/song-seo";
import Link from "next/link";
import {SongPageArtist} from "@/app/lib/types";
import MoreSongs from "@/app/components/music-box/MoreSongs";
import RandomSongButton from "@/app/components/buttons/RandomSongButton";
import {RequestedByBox} from "@/app/components/music-box/RequestedByBox";
import {songService} from "@/modules/songs";
import {SongIdSchema} from "@/modules/songs";
import {NotFoundError} from "@/shared/errors/not-found.error";
import { logger } from "@/infrastructure/logging/logger";

type Props = {
    params: Promise<{ locale: string, id: string, name: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { id, locale } = await params;
        if (!["en", "my"].includes(locale)) return { title: "Song" };
        const parsed = /^\d+$/.test(id) ? SongIdSchema.safeParse(id) : null;
        if (!parsed?.success) return { title: "Song" };
        const song = await songService.getSongPage(parsed.data);
        const seo = songSeo(song, locale);
        return {
            title: seo.title,
            description: seo.description,
            category: "Music",
            alternates: { canonical: seo.canonical, languages: seo.alternateLanguages },
            openGraph: {
                title: seo.title,
                description: seo.description,
                type: "music.song",
                images: song.imageLink ? [{ url: song.imageLink, alt: seo.title }] : [],
                locale,
                alternateLocale: locale === "en" ? ["my"] : ["en"],
                url: seo.canonical,
                siteName: "RomanizedMM",
                musicians: buildArtistNames(song.artistName),
            },
        };
    } catch (error) {
        if (!(error instanceof NotFoundError)) logger.error("Failed to generate song metadata", error);
        return { title: "Song" };
    }
}

interface SongPageProps {
    params: Promise<{locale: string, id: string, name: string}>,
    searchParams: Promise<{ option: string }>;
}

export const revalidate: number = 3600; // 24 hours

const ArtistRow = ({ label, artists, locale }: { label: string, artists: SongPageArtist[], locale: string }) => (
    <div className="flex flex-col md:flex-row gap-2 md:gap-6">
        <span className="text-muted font-medium md:min-w-40 whitespace-nowrap">{label}:</span>
        <div className="flex flex-wrap gap-2">
            {artists.map((artist, index) => {
                const content = (
                    <span className={`md:flex-1 leading-[2rem] -mt-1 
                    ${artist.slug ? "hover:text-accent hover:cursor-pointer underline" : "" }`}
                    >
                        {artist.name}
                        {index < artists.length - 1 && ","}
                    </span>
                );

                return (
                    <span
                        key={artist.slug ?? artist.name}
                    >
                        {artist.slug ? (
                            <Link href={`/${locale}/artist/${artist.slug}`}>{content}</Link>
                        ) : (
                            content
                        )}
                    </span>
                );
            })}
        </div>
    </div>
);

const DetailRow = ({ label, value }: {label: string, value: string}) => (
    <div className="flex flex-col md:flex-row gap-2 md:gap-6">
        <span className="text-muted font-medium md:min-w-40 whitespace-nowrap">{label}:</span>
        <span className="text-foreground md:flex-1 leading-[2rem] -mt-1">{value}</span>
    </div>
);

const Page = async ({ params, searchParams }: SongPageProps) => {
    const { locale, id, name } = await params;
    const { option = 'burmese' } = await searchParams;
    const parsed = /^\d+$/.test(id) ? SongIdSchema.safeParse(id) : null;
    if (!parsed?.success) notFound();

    let song;
    try {
        song = await songService.getSongPage(parsed.data);
    } catch (error) {
        if (!(error instanceof NotFoundError)) logger.error("Failed to fetch song page data", error);
        return notFound();
    }

    setRequestLocale(locale);
    const translator = await getTranslations("MusicPage");

    const artistNames = buildArtistNames(song.artistName);
    const seo = songSeo(song, locale);

    // exclude _id from artistName
    let cleanedArtistNames = song.artistName.map(artist => ({
        name: artist.name,
        slug: artist.slug,
    }));
    
    
    return (
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScriptValue(seo.recording) }} />

            <div className="mx-auto w-full max-w-2xl" aria-label="Search for another song">
                <SearchBar showLabel={false} />
            </div>

            {/* Song identity and details are visible without extra clicks. */}
            <header className="grid items-center gap-5 border-b border-theme-border pb-7 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-7">
                {song.imageLink && (
                    <Image
                        src={song.imageLink}
                        alt={song.songName}
                        width={132}
                        height={132}
                        className="h-28 w-28 rounded-md object-cover sm:h-[132px] sm:w-[132px]"
                        quality={85}
                        priority
                    />
                )}
                <div className="min-w-0">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">RomanizedMM · Lyrics</p>
                    <h1 className="break-words text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">{song.songName}</h1>
                    <div className="mt-3 text-base text-muted"><ArtistRow label={translator("artist")} artists={song.artistName} locale={locale} /></div>
                    {(song.genre || song.albumName) && <p className="mt-2 text-sm text-accent">{[song.genre, song.albumName].filter(Boolean).join(" · ")}</p>}
                    {song.about && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{song.about}</p>}
                    {song.whenToListen && (
                        <div className="mt-3 text-sm leading-relaxed text-muted">
                            <span className="font-semibold text-accent">{translator("whenToListen")}: </span>
                            {song.whenToListen}
                        </div>
                    )}
                </div>
            </header>

            <section aria-label="Song lyrics and playback" id="song-lyrics" className="min-w-0">
                <SyncedLyricsPlayer extLinks={{youtube: song.youtubeLink, spotify: song.spotifyLink, apple: song.appleMusicLink}} lyrics={{romanized: song.romanized, burmese: song.burmese, meaning: song.meaning, initialOption: option}} />
            </section>

            {(song.requestedBy || song.songStoryEn || song.songStoryMy) && (
                <section aria-label="Song request story" className="mx-auto w-full max-w-3xl">
                    <RequestedByBox requestedBy={song.requestedBy} songStoryEn={song.songStoryEn} songStoryMy={song.songStoryMy} locale={locale} />
                </section>
            )}

            <MoreSongs artists={cleanedArtistNames} currentSongId={parsed.data} locale={locale}/>

            <aside aria-label="Explore and share" className="flex flex-col items-center gap-6 border-t border-theme-border pt-8">
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <RandomSongButton locale={locale}/>
                    <SongReportButton songName={song.songName} artist={artistNames} />
                </div>
                <SocialShare url={seo.canonical} title={song.songName} />
            </aside>
        </main>
    );

}
export default Page
