import React from 'react';
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import SearchBar from "@/app/components/searchbar/SearchBar";
import SyncedLyricsPlayer from "@/app/components/sync-lyrics/SyncedLyricsPlayer";
import {getTranslations, setRequestLocale} from "next-intl/server";
import Image from 'next/image';
import SongReportButton from "@/app/components/buttons/SongReportButton";
import SocialShare from "@/app/components/social/SocialShare";
import {buildArtistNames} from "@/app/lib/utils";
import {songSeo, jsonLdScriptValue} from "@/app/lib/song-seo";
import Link from "next/link";
import {SongPageArtist} from "@/app/lib/types";
import AboutArtistCard from "@/app/components/artist/AboutArtistCard";
import MoreSongs from "@/app/components/music-box/MoreSongs";
import RandomSongButton from "@/app/components/buttons/RandomSongButton";
import {RequestedByBox} from "@/app/components/music-box/RequestedByBox";
import {songService} from "@/modules/songs";
import {artistService} from "@/modules/artists";
import { logger } from "@/infrastructure/logging/logger";

type Props = {
    params: Promise<{ locale: string, id: string, name: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { id, locale } = await params;
        if (!["en", "my"].includes(locale)) return { title: "Song" };
        const song = await songService.getSongPage(Number(id));
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
        logger.error("Failed to generate song metadata", error);
        return { title: "Song" };
    }
}

interface SongPageProps {
    params: Promise<{locale: string, id: string, name: string}>,
    searchParams: Promise<{ option: string }>;
}

export const revalidate: number = 3600; // 24 hours

const ArtistRow = ({ label, artists }: { label: string, artists: SongPageArtist[] }) => (
    <div className="flex flex-col md:flex-row gap-2 md:gap-6">
        <span className="text-gray-400 font-medium md:min-w-40 whitespace-nowrap">{label}:</span>
        <div className="flex flex-wrap gap-2">
            {artists.map((artist, index) => {
                const content = (
                    <span className={`md:flex-1 leading-[2rem] -mt-1 
                    ${artist.slug ? "hover:text-amber-400 hover:cursor-pointer underline" : "" }`}
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
                            <Link href={`/en/artist/${artist.slug}`}>{content}</Link>
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
        <span className="text-gray-400 font-medium md:min-w-40 whitespace-nowrap">{label}:</span>
        <span className="text-white md:flex-1 leading-[2rem] -mt-1">{value}</span>
    </div>
);

const Page = async ({ params, searchParams }: SongPageProps) => {
    const { locale, id, name } = await params;
    const { option = 'burmese' } = await searchParams;

    let song;
    try {
        song = await songService.getSongPage(Number(id));
    } catch (error) {
        logger.error("Failed to fetch song page data", error);
        return notFound();
    }

    setRequestLocale(locale);
    const translator = await getTranslations("MusicPage");

    const artistNames = buildArtistNames(song.artistName);
    const seo = songSeo(song, locale);

    let firstArtist = {
        name: song.artistName[0].name,
        slug: "",
        imageLink: "",
        biography: "",
    }
    // fetch the first matching artist profile in one repository query
    try {
        const slugs = song.artistName
            .map(artist => artist.slug)
            .filter((slug): slug is string => Boolean(slug));

        const artistDetails = await artistService.getFirstProfileBySlugs(slugs);
        if (artistDetails) {
            const matchingSongArtist = song.artistName.find(artist => artist.slug === artistDetails.slug);
            firstArtist.name = matchingSongArtist?.name || artistDetails.name;
            firstArtist.slug = artistDetails.slug;
            firstArtist.imageLink = artistDetails.imageLink;
            firstArtist.biography = artistDetails.biography || "";
        }
    } catch (e) {
        logger.error("Failed to fetch song artist details", e);
    }

    // exclude _id from artistName
    let cleanedArtistNames = song.artistName.map(artist => ({
        name: artist.name,
        slug: artist.slug,
    }));
    
    
    return (
        <main className="flex flex-col gap-10 mt-5 mb-8 justify-center items-center">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScriptValue(seo.recording) }} />
            <SearchBar />

            <div className="flex flex-row justify-center items-center gap-4 max-md:gap-6 max-md:flex-col">
                <RandomSongButton locale={locale}/>
                <SongReportButton songName={song.songName} artist={artistNames} />
            </div>

            {/* Album Cover */}
            {song.imageLink &&
                <Image
                src={song.imageLink}
                alt={song.songName}
                width={160}
                height={160}
                className="rounded-2xl hover:scale-105 transition-all duration-300"
                quality={85}
                priority={true}
                />
            }

            {/* Song Description */}
            <p className="text-lg text-wrap text-center leading-10 max-md:w-[80vw] md:w-[60vw] max-md:text-[1rem] max-md:leading-8">{song.about}</p>

            {/* About */}
            <div className="bg-transparent border-2 border-white rounded-3xl p-8 max-w-[50vw] max-md:max-w-[80vw] mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-center">{song.songName}</h1>
                <div className="space-y-4">
                    <ArtistRow label={translator("artist")} artists={song.artistName} />
                    <DetailRow label={translator("album")} value={song.albumName || ""} />
                    <DetailRow label={translator("genre")} value={song.genre} />
                    <DetailRow label={translator("whenToListen")} value={song.whenToListen} />
                </div>
            </div>

            {/* Song Requester & Story if available */}
            <RequestedByBox requestedBy={song.requestedBy} songStoryEn={song.songStoryEn} songStoryMy={song.songStoryMy} locale={locale} />

            {/* About Artist */}
            {firstArtist.slug && (
                <AboutArtistCard artist={firstArtist} locale={locale} />
            )}

            <SyncedLyricsPlayer extLinks={{youtube: song.youtubeLink, spotify: song.spotifyLink, apple: song.appleMusicLink}} lyrics={{romanized: song.romanized, burmese: song.burmese, meaning: song.meaning, initialOption: option}} />

            <MoreSongs artists={cleanedArtistNames} currentSongId={parseInt(id)} locale={locale}/>

            <SocialShare url={`https://romanizedmm.com/song/${name}/${id}?option=${option}`} title={song.songName} />
        </main>
    )
}
export default Page
