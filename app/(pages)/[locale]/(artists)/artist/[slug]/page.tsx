import React from 'react';
import Image from "next/image";
import { notFound } from "next/navigation";

import connectDB from "@/app/lib/mongodb";
import Artist from "@/app/model/Artist";
import Song from "@/app/model/Song";
import Biography from "@/app/components/artist/biography";
import SongCard from "@/app/components/artist/SongCard";
import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {Metadata} from "next";

type Props = {
    params: Promise<{ locale: string, slug: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params }: Props,
): Promise<Metadata> {
    try {
        const { locale, slug } = await params;

        if (!slug || !locale) {
            throw new Error("Missing required parameters: id or locale");
        }

        const artistQ = await Artist.findOne({ slug: slug }).lean();

        if (!artistQ) {
            throw new Error("Song not found when generating metadata");
        }

        const artistName: string = artistQ.name;
        const artistSlug: string = artistQ.slug;
        const description: string = `${artistName} (Myanmar) - ${artistQ.biography ? artistQ.biography.slice(0, 150) : ""}...`;

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "MusicRecording",
            "name": artistName,
            "byArtist": {
                "@type": "MusicGroup",
                "name": artistName,
            },
            "url": `https://romanizedmm.com/${locale}/artist/${artistSlug}`,
        };

        return {
            title: artistName,
            description: description,
            category: "Music",
            keywords: [`${artistName}`, `${artistSlug}`, "Musician", "Artist", "Myanmar", "Singer", "Band"],
            alternates: {
                canonical: `https://www.romanizedmm.com/${locale}/artist/${artistSlug}`,
                languages: {
                    'en': `https://www.romanizedmm.com/en/artist/${artistSlug}`,
                    'my': `https://www.romanizedmm.com/my/artist/${artistSlug}`,
                }
            },
            other: {
                'application/ld+json': JSON.stringify(jsonLd)
            },
            openGraph: {
                title: artistName,
                description: description,
                type: "music.song",
                images: artistQ.imageLink ? [
                    {
                        url: artistQ.imageLink,
                        width: 800,
                        height: 600,
                        alt: artistName,
                    },
                ] : [],
                locale: locale,
                alternateLocale: ["en", "my"],
                url: `https://www.romanizedmm.com/${locale}/artist/${artistSlug}`,
                siteName: "RomanizedMM",
                musicians: artistName,
            },
        };
    } catch (error) {
        console.error("Error generating metadata:", error);
        return {
            title: "Song",
        };
    }
}

interface ArtistPageProps {
    params: Promise<{ locale: string, slug: string }>;
}

interface Member {
    name: string;
    imageLink?: string;
}

const MemberCard = ({ name, imageLink }: Member) => (
    <div className="group flex flex-col items-center justify-center hover:text-amber-400 transition-all duration-300">
        <div className="relative w-48 rounded-3xl h-36 border-2 border-white overflow-hidden hover:border-amber-400">
            {imageLink && (
                <div className="flex flex-col">
                    <Image
                        src={imageLink}
                        alt={name}
                        fill
                        className="object-cover hover:scale-110 hover:cursor-pointer transition-all duration-300"
                    />
                </div>
            )}
        </div>
        <h3 className="text-lg font-bold mt-2 hover:cursor-pointer">
            {name}
        </h3>
    </div>
);

const Page = async ({ params }: ArtistPageProps) => {
    const { locale, slug } = await params;

    // Commented out original database fetching logic
    let artist;
    const artistSongs = [];
    try {
        await connectDB();
        artist = await Artist.findOne({slug: slug}).lean();

        if (!artist) {
            return notFound();
        }

        for (const songId of artist.songs) {
            const song = await Song.findOne({mmid: songId})
                .select("songName mmid imageLink about")
                .lean();
            if (song) {
                artistSongs.push(song);
            }
        }

        artistSongs.sort((a, b) => a.songName.localeCompare(b.songName));
    } catch (e) {
        console.error("Error fetching artist page data:", e);
        return notFound();
    }

    // Request more sentence
    const translator = await getTranslations("ArtistPage");
    let reqMore: string = "";
    if (locale === "en") {
        reqMore = `${translator("askMore")} ${artist.name}?`
    } else {
        reqMore = `${artist.name} ${translator("askMore")}`
    }

    return (
        <main className="flex flex-col items-center justify-center">
            {/* Artist Banner */}
            <div className="relative flex flex-col items-center justify-center md:h-[300px] h-[200px] w-full ">
                {!!artist.bannerLink ?
                    <Image
                        src={artist.bannerLink}
                        alt="artist-banner"
                        fill
                        className="object-cover overflow-hidden"
                        priority
                    /> :
                    <div className="absolute inset-0 bg-gray-800" />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>

            {/* Artist */}
            <div className="container max-w-6xl px-4 mx-auto -mt-24 relative z-10">
                {/* Artist Info Section */}
                <div className="flex flex-col md:flex-row gap-12 max-md:items-center max-md:justify-center">
                    {/* Profile Picture */}
                    <div className="relative w-48 h-48 rounded-full border-4 border-white overflow-hidden hover:scale-90 hover:border-amber-400 transition-all duration-300">
                        <Image
                            src={artist.imageLink}
                            alt={artist.name}
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Artist Details */}
                    <div className="max-md:text-center flex flex-col max-md:items-center gap-2">
                        {/* Name */}
                        <h1 className="text-5xl font-bold mb-2 hover:text-amber-400 hover:cursor-pointer transition-all duration-300">
                            {artist.name}
                        </h1>

                        {artist.type.toLowerCase() === "band" && (
                            <div className="flex md:flex-col flex-col gap-3 mb-4 text-center">
                                <div className="grid grid-cols-2 md:flex md:flex-row gap-2 justify-center items-center">
                                    {artist.members?.map((member, index) => (
                                        <span
                                            key={index}
                                            className="text-black bg-white p-2 rounded-lg text-sm hover:bg-amber-400 hover:cursor-pointer hover:text-black  transition-all duration-300"
                                        >
                                            {member.slug ? (
                                                <Link
                                                    href={`/${locale}/artist/${member.slug}`}
                                                    >
                                                    {member.name}
                                                </Link>
                                            ) :
                                                (
                                                    <span>{member.name}</span>
                                                )
                                            }
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Origin */}
                        <p className="text-muted-foreground text-lg mb-4">
                            📍 {artist.origin}
                        </p>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-2 mb-4 max-md:justify-center">
                            {artist.musicGenre.map((genre, index) => (
                                <span
                                    key={index}
                                    className="text-black bg-white p-2 rounded-lg text-sm hover:bg-amber-400 hover:cursor-pointer transition-all duration-300"
                                >
                        {genre}
                    </span>
                            ))}
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-8 max-md:justify-center">
                            {artist.socials?.facebook && (
                                <a
                                    href={artist.socials.facebook}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <img src="/facebook-icon-50.png" alt="facebook-icon" className="h-8 w-8 hover:scale-90 transition-all duration-300" />
                                </a>
                            )}
                            {artist.socials?.instagram && (
                                <a
                                    href={artist.socials.instagram}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <img src="/instagram-icon.png" alt="instagram-icon" className="h-8 w-8 hover:scale-90 transition-all duration-300" />
                                </a>
                            )}
                            {artist.socials?.youtube && (
                                <a
                                    href={artist.socials.youtube}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <img src="/youtube-icon.png" alt="youtube-icon" className="h-8 w-8 hover:scale-90 transition-all duration-300" />
                                </a>
                            )}
                            {artist.socials?.spotify && (
                                <a
                                    href={artist.socials.spotify}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <img src="/spotify-icon.png" alt="spotify-icon" className="h-8 w-8 hover:scale-90 transition-all duration-300" />
                                </a>
                            )}
                            {artist.socials?.appleMusic && (
                                <a
                                    href={artist.socials.appleMusic}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <img src="/apple-music-icon.png" alt="applemusic-icon" className="h-8 w-8 hover:scale-90 transition-all duration-300" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Artist Band Members Pics */}
                <div className="flex flex-row gap-4 max-md:flex-col items-center justify-center mt-12">
                    {artist.members?.map((member, index) => (
                        <div key={index} className="group flex flex-col items-center justify-center">
                            {member.slug ? (
                                <Link href={`/${locale}/artist/${member.slug}`}>
                                    <MemberCard
                                        name={member.name}
                                        imageLink={member.imageLink}
                                    />
                                </Link>
                            ) : (
                                <MemberCard
                                    name={member.name}
                                    imageLink={member.imageLink}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Artist Biography */}
                {artist.biography && <Biography biography={artist.biography} />}

                {/* Artist Songs */}
                <h3 className="text-4xl font-bold text-center mt-8 mb-4">Songs</h3>
                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-8 mt-8 mb-8 px-4">
                    {artistSongs.map((song, index) => (
                        <SongCard
                            key={index}
                            mmid={song.mmid}
                            songName={song.songName}
                            imageLink={song.imageLink || ""}
                            locale={locale}
                        />
                    ))}
                </div>

                {/* Song Request */}
                <div className="flex flex-col justify-center items-center flex-wrap">
                    <h3 className="text-2xl font-bold text-center mt-12 mb-4">{reqMore}</h3>
                    <Link href={`/${locale}/song-request`}>
                        <button className="bg-blue-600 text-white rounded-2xl px-4 py-2 text-lg font-bold hover:bg-blue-400 mb-12">
                            {translator("request")}
                        </button>
                    </Link>
                </div>
            </div>
        </main>

    );
};

export default Page;