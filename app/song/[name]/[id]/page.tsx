import React from 'react'
import connectDB from "@/app/lib/mongodb";
import Song from "@/app/model/Song";
import { notFound } from "next/navigation";

interface SongPageProps {
    params: {
        id: string;
        name: string;
    },
    searchParams: {
        lang: string,
        option: string
    }
}

const Page = async ({ params, searchParams }: SongPageProps) => {
    const { id, name } = params;
    const { lang = 'en', option = 'romanized' } = searchParams;

    await connectDB();
    const song = await Song.findOne({ mmid: id}).lean();

    if (!song) {
        return notFound();
    }

    return (
        <div>Song Page</div>
    )
}
export default Page
