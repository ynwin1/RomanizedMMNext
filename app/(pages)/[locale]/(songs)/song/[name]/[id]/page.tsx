import React from 'react';
import {Metadata, ResolvingMetadata} from "next";
import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";
import {notFound} from "next/navigation";
import SearchBar from "@/app/components/searchbar/SearchBar";
import LyricsSection from "@/app/components/music-box/LyricsSection";
import ExtLinks from "@/app/components/music-box/ExtLinks";
import {getTranslations, setRequestLocale} from "next-intl/server";
import Image from 'next/image';
import SongReportButton from "@/app/components/buttons/SongReportButton";
import SocialShare from "@/app/components/social/SocialShare";

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
        console.log("Song page for id:", id, "locale:", locale);

        if (!id || !locale) {
            throw new Error("Missing required parameters: id or locale");
        }

        const songQ = await Song.findOne({ mmid: id }).lean();

        if (!songQ) {
            throw new Error("Song not found when generating metadata");
        }

        const { engName, mmName } = extractSongName(songQ.songName);

        const titleToDisplay = `${songQ.songName} lyrics - ${songQ.artistName}`;
        const description = `${titleToDisplay} lyrics by ${songQ.artistName} - ${songQ.burmese.slice(0, 150)}...`;

        const mmid: number = songQ.mmid;
        const artists: string = songQ.artistName;

        const songNameURL = engName.replace(/\s/g, "").trim(); // Remove spaces from song name

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
                canonical: `https://www.romanizedmm.com/${locale}/song/${songNameURL}/${mmid}`,
                languages: {
                    'en': `https://www.romanizedmm.com/en/song/${songNameURL}/${mmid}`,
                    'my': `https://www.romanizedmm.com/my/song/${songNameURL}/${mmid}`,
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
                alternateLocale: ["en", "my"],
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
        await connectDB();
        song = await Song.findOne({ mmid: id }).lean();
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
                    <DetailRow label={translator("artist")} value={song.artistName} />
                    <DetailRow label={translator("album")} value={song.albumName || ""} />
                    <DetailRow label={translator("genre")} value={song.genre} />
                    <DetailRow label={translator("whenToListen")} value={song.whenToListen} />
                </div>
            </div>

            {/* Medias */}
            <ExtLinks youtube={song.youtubeLink} spotify={song.spotifyLink} apple={song.appleMusicLink}/>

            {/* Radio Buttons & Lyrics */}
            <LyricsSection romanized={song.romanized} burmese={song.burmese} meaning={song.meaning} initialOption={option} />

            <SocialShare url={`https://romanizedmm.com/song/${name}/${id}?option=${option}`} title={song.songName} />
        </main>
    )
}
export default Page
