import React from 'react'
import connectDB from "@/app/lib/mongodb";
import Artist from "@/app/model/Artist";
import {notFound} from "next/navigation";
import Song from "@/app/model/Song";
import Image from "next/image";
import Link from "next/link";

interface ArtistPageProps {
    params: Promise<{locale: string, slug: string}>,
    searchParams: Promise<{page?: string}>,
}

const Page = async ({params, searchParams}: ArtistPageProps) => {
    const { locale, slug } = await params;
    const { page } = await searchParams;

    const currentPage: number = Number(page) || 1;

    let artist;
    const artistSongs = [];
    try {
        await connectDB();
        artist = await Artist.findOne({slug: slug}).lean();

        if (!artist) {
            return notFound();
        }

        for (const songId of artist.songs) {
            const song = await Song.findOne({mmid: songId}).select("songName imageLink about").lean();
            artistSongs.push(song);
        }
    } catch (e) {
        console.error("Error fetching artist page data:", e);
        return notFound();
    }

    return (
        <main className="flex flex-col items-center justify-center">
            {/* Artist Banner */}
            <div className="flex flex-col items-center justify-center md:h-[200px] w-full">
                <Image
                    src={artist.bannerLink || "hello"}
                    alt="artist-banner"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* Artist Info */}
            <div className="container max-w-6xl px-4 mx-auto -mt-24 relative z-10">
                {/* Artist Info Section */}
                <div className="flex flex-col md:flex-row gap-6 items-start mb-12">
                    {/* Profile Picture */}
                    <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full border-4 border-background overflow-hidden shadow-xl">
                        <Image src={artist.imageLink || "/placeholder.png"} alt={artist.name} fill className="object-cover" />
                    </div>
                    {/* Name */}
                    <div className="flex-1 pt-4">
                        <h1 className="text-3xl md:text-5xl font-bold mb-2">{artist.name}</h1>
                    </div>
                    {/* Genres */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {artist.musicGenre.map((genre, index) => (
                            <span key={index} className="text-black bg-white p-1 rounded-full text-sm">{genre}</span>
                        ))}
                    </div>
                    {/* Origin */}
                    <div className="text-muted-foreground mb-4">
                        <p>
                            {artist.origin}
                        </p>
                    </div>
                    {/* Social Links */}

                </div>
            </div>

            {/* Artist Biography */}

            {/* Artist Songs */}
        </main>
    )
}
export default Page
