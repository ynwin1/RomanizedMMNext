import React from 'react';
import {Metadata, ResolvingMetadata} from "next";
import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";
import {notFound} from "next/navigation";
import SearchBar from "@/app/components/searchbar/SearchBar";
import LyricsSection from "@/app/components/music-box/LyricsSection";
import ExtLinks from "@/app/components/music-box/ExtLinks";
import {getTranslations, setRequestLocale} from "next-intl/server";
import About from "@/app/components/music-box/About";
import Image from 'next/image';
import SongReportButton from "@/app/components/buttons/SongReportButton";

type Props = {
    params: Promise<{ locale: string, id: string, name: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    try {
        const { id, locale } = await params;

        if (!id || !locale) {
            throw new Error("Missing required parameters: id or locale");
        }

        const songQ = await Song.findOne({ mmid: id }).lean();

        if (!songQ) {
            throw new Error("Song not found when generating metadata");
        }

        const { engName, mmName } = extractSongName(songQ.songName);

        const titleToDisplay = songQ.songName;
        const description = locale === "en" ?
                `${titleToDisplay} lyrics by ${songQ.artistName} - Sing along with the romanized lyrics and learn the meaning of the song.` :
                `${titleToDisplay} lyrics by ${songQ.artistName} - ${songQ.burmese.slice(0, 100)}...`;
        const mmid: number = songQ.mmid;
        const artists: string = songQ.artistName;

        const songNameURL = engName.replace(/\s/g, "");

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "MusicRecording",
            "name": songQ.songName,
            "byArtist": {
                "@type": "MusicGroup",
                "name": songQ.artistName,
            },
            "inAlbum": songQ.albumName ? {
                "@type": "MusicAlbum",
                "name": songQ.albumName,
            } : undefined,
            "genre": songQ.genre,
            "description": songQ.about || "A Burmese song",
            "url": `https://romanizedmm.com/${locale}/song/${songNameURL}/${songQ.mmid}`,
            "sameAs": [
                songQ.youtubeLink,
                songQ.spotifyLink,
                songQ.appleMusicLink,
            ].filter(Boolean), // Removes undefined/empty links
        };

        return {
            title: titleToDisplay,
            description: description,
            category: "Music",
            keywords: ["Burmese", "Myanmar", "Song", "Lyrics", "Romanized", engName, mmName],
            alternates: {
                canonical: `https://romanizedmm.com/${locale}/song/${engName}/${mmid}`,
                languages: {
                    'en': `https://romanizedmm.com/en/song/${songNameURL}/${mmid}`,
                    'my': `https://romanizedmm.com/mm/song/${songNameURL}/${mmid}`,
                }
            },
            other: {
                'application/ld+json': JSON.stringify(jsonLd)
            },
            openGraph: {
                title: titleToDisplay,
                description: description,
                type: "music.song",
                images: songQ.imageLink ? [
                    {
                        url: songQ.imageLink,
                        width: 800,
                        height: 600,
                        alt: titleToDisplay,
                    },
                ] : [],
                locale: locale,
                alternateLocale: ["en", "mm"],
                url: `https://romanizedmm.com/${locale}/song/${songNameURL}/${mmid}`,
                siteName: "RomanizedMM",
                musicians: artists,
            },
        };
    } catch (error) {
        console.error("Error generating metadata:", error);
        return {
            title: "Song",
        };
    }
}

interface SongPageProps {
    params: Promise<{locale: string, id: string, name: string}>,
    searchParams: Promise<{ option: string }>;
}

function extractSongName(songName: string): { engName: string, mmName: string } {
    const names = songName.split("(");
    const engName = names[0].trim();
    const mmName = names.length > 1 ? names[1].replace(/[()]/g, "").trim() : engName;

    return {
        engName: engName,
        mmName: mmName,
    };
}

export const revalidate: number = 3600; // 24 hours

const Page = async ({ params, searchParams }: SongPageProps) => {
    const { locale, id, name } = await params;
    const { option = 'burmese' } = await searchParams;

    let song;
    try {
        await connectDB();
        song = await Song.findOne({ mmid: id}).lean();

        if (!song) {
            return notFound();
        }
    } catch (error) {
        console.error("Error fetching song:", error);
        return notFound();
    }

    setRequestLocale(locale);
    const translator = await getTranslations("MusicPage");

    return (
        <main className="flex flex-col gap-10 mt-5 mb-8 justify-center items-center">
            <SearchBar />

            <SongReportButton songName={song.songName} artist={song.artistName} />

            {/* Album Cover */}
            {song.imageLink &&
                <Image
                src={song.imageLink}
                alt={song.songName}
                width={160}
                height={160}
                className="rounded-xl"
                quality={85}
                priority={true}
                />
            }

            {/* Song Description */}
            <p className="text-lg text-wrap text-center leading-10 max-md:w-[80vw] md:w-[60vw] max-md:text-[1rem] max-md:leading-8">{song.about}</p>

            {/* About */}
            <div className="text-[1rem] border-2 border-white p-4 rounded-2xl max-md:w-[85vw] md:w-[40vw]">
                <h1 className="mb-6">{song.songName}</h1>
                <h2 className="pb-2"><u>{translator("artist")}</u>: {song.artistName}</h2>
                <h2 className="pb-2"><u>{translator("album")}</u>: {song.albumName}</h2>
                <h2 className="pb-2"><u>{translator("genre")}</u>: {song.genre}</h2>
                <h2 className="pb-2 leading-8"><u>{translator("whenToListen")}</u>: {song.whenToListen}</h2>
            </div>

            {/* Medias */}
            <ExtLinks youtube={song.youtubeLink} spotify={song.spotifyLink} apple={song.appleMusicLink}/>

            {/* Radio Buttons & Lyrics */}
            <LyricsSection romanized={song.romanized} burmese={song.burmese} meaning={song.meaning} initialOption={option} />
        </main>
    )
}
export default Page
