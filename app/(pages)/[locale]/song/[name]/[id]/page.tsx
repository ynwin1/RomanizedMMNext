import React from 'react';
import {Metadata, ResolvingMetadata} from "next";
import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";
import { notFound } from "next/navigation";
import SearchBar from "@/app/components/searchbar/SearchBar";
import LyricsSection from "@/app/components/music-box/LyricsSection";
import ExtLinks from "@/app/components/music-box/ExtLinks";
import {setRequestLocale} from "next-intl/server";
import {useTranslations} from "next-intl";
import About from "@/app/components/music-box/About";

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

        const songQ = await Song.findOne({ mmid: id }).select('songName').lean();

        if (!songQ) {
            throw new Error("Song not found when generating metadata");
        }

        const { engName, mmName } = extractSongName(songQ.songName);

        return {
            title: locale === "en" ? engName : mmName,
        };
    } catch (error) {
        console.error("Error generating metadata:", error);
        return {
            title: "Song",
        };
    }
}

function extractSongName(songName: string): { engName: string, mmName: string } {
    const names = songName.split("(");

    if (names.length < 2) {
        throw new Error("Song name is not in the correct format");
    }

    return {
        engName: names[0].trim(),
        mmName: names[1].replace(/[()]/g, "").trim(),
    };
}

interface SongPageProps {
    params: {
        locale: string;
        id: string;
        name: string;
    },
    searchParams: {
        option: string
    }
}

const Page = async ({ params, searchParams }: SongPageProps) => {
    const { locale, id, name } = params;
    const { option = 'romanized' } = searchParams;

    await connectDB();
    const song = await Song.findOne({ mmid: id}).lean();

    if (!song) {
        return notFound();
    }

    setRequestLocale(locale);

    const { engName, mmName } = extractSongName(song.songName);

    return (
        <div className="flex flex-col gap-10 mt-5 mb-8 justify-center items-center">
            <SearchBar />

            {/* Album Cover */}
            {song.imageLink && <img src={song.imageLink} alt={song.songName} className="w-40 rounded-xl" />}

            {/* Song Description */}
            <p className="text-xl text-wrap text-center leading-10 max-md:w-[80vw] md:w-[60vw] max-md:text-lg max-md:leading-8">{song.about}</p>

            {/* About */}
            <About
                engSongName={engName}
                mmSongName={mmName}
                locale={locale}
                artistName={song.artistName}
                albumName={song.albumName? song.albumName : "N/A"}
                genre={song.genre}
                whenToListen={song.whenToListen}
            />

            {/* Medias */}
            <ExtLinks youtube={song.youtubeLink} spotify={song.spotifyLink} apple={song.appleMusicLink}/>

            {/* Radio Buttons & Lyrics */}
            <LyricsSection romanized={song.romanized} burmese={song.burmese} meaning={song.meaning} initialOption={option} />
        </div>
    )
}
export default Page
