import React from 'react';
import Image from "next/image";
import { notFound } from "next/navigation";

import connectDB from "@/app/lib/mongodb";
import Artist from "@/app/model/Artist";
import Song from "@/app/model/Song";
import Biography from "@/app/components/artist/biography";
import SongCard from "@/app/components/artist/SongCard";

interface ArtistPageProps {
    params: Promise<{ locale: string, slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

const Page = async ({ params, searchParams }: ArtistPageProps) => {
    const { locale, slug } = await params;
    const { page } = await searchParams;

    const currentPage: number = Number(page) || 1;

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

    // Populate for testing
    // const artist = {
    //     name: "Eternal Gosh",
    //     slug: "eternal-gosh",
    //     imageLink: "https://i.scdn.co/image/ab67616100005174788770aee1b9b4edd5769f85",
    //     bannerLink: null,
    //     biography: "It was their first date and she had been looking forward to it the entire week. She had her eyes on him for months, and it had taken a convoluted scheme with several friends to make it happen, but he'd finally taken the hint and asked her out. After all the time and effort she'd invested into it, she never thought that it would be anything but wonderful. It goes without saying that things didn't work out quite as she expected.",
    //     type: "Band",
    //     members: ["Han Nay Tar", "Bon Bon", "Nay Min", "Yee Mon"],
    //     origin: "Yangon, Myanmar",
    //     labels: ["Label 1", "Label 2"],
    //     musicGenre: ["Genre 1", "Genre 2"],
    //     songs: [1, 2, 3],
    //     socials: {
    //         facebook: "https://facebook.com",
    //         instagram: "https://instagram.com",
    //         youtube: "https://youtube.com",
    //         spotify: "https://spotify.com",
    //         appleMusic: "https://music.apple.com",
    //     },
    //     likes: 100,
    // };
    //
    // // Populate for testing
    // const artistSongs = [
    //     {
    //         songName: "Song 1",
    //         mmid: 1,
    //         imageLink: "https://i.scdn.co/image/ab67616d00001e0240812d0cd2273ec24f12f47c",
    //         about: "About Song 1",
    //     },
    //     {
    //         songName: "Song 2",
    //         mmid: 2,
    //         imageLink: "https://i.scdn.co/image/ab67616d00001e0240812d0cd2273ec24f12f47c",
    //         about: "About Song 2",
    //     },
    //     {
    //         songName: "Song 3",
    //         mmid: 3,
    //         imageLink: "https://i.scdn.co/image/ab67616d00001e0240812d0cd2273ec24f12f47c",
    //         about: "About Song 3",
    //     },
    // ];

    return (
        <main className="flex flex-col items-center justify-center">
            {/* Artist Banner */}
            <div className="relative flex flex-col items-center justify-center md:h-[300px] h-[200px] w-full">
                {!!artist.bannerLink ?
                    <Image
                        src={artist.bannerLink}
                        alt="artist-banner"
                        fill
                        className="object-cover w-full h-full"
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
                                {/*<h3 className="text-xl font-bold">*/}
                                {/*    Members:*/}
                                {/*</h3>*/}
                                <div className="grid grid-cols-3 md:flex md:flex-row gap-2">
                                    {artist.members?.map((member, index) => (
                                        <span
                                            key={index}
                                            className="text-black bg-white p-2 rounded-lg text-sm hover:bg-amber-400 hover:cursor-pointer hover:text-black  transition-all duration-300"
                                        >
                                            {member}
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
                                    className="text-black bg-white p-2 rounded-lg text-sm hover:bg-amber-400 hover:cursor-pointer hover:text-white transition-all duration-300"
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

                {/* Artist Biography */}
                <Biography biography={artist.biography} />

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
            </div>
        </main>

    );
};

export default Page;