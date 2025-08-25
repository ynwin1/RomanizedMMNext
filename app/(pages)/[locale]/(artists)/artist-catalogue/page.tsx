import React from "react";
import Artist from "@/app/model/Artist";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import connectDB from "@/app/lib/mongodb";
import ArtistCard from "@/app/components/catalogue/ArtistCard";

export const metadata: Metadata = {
  title: "Artist Catalogue",
  description: "A catalogue of all the artists on RomanizedMM. Find your favorite Myanmar artists here!",
};

export type ArtistCataloguePageProps = {
  params: Promise<{ locale: string }>;
};

const Page = async ({ params }: ArtistCataloguePageProps) => {
  const { locale } = await params;
  await connectDB();
  const allArtists = await Artist.find({}).select("name slug imageLink musicGenre type -_id").lean();

  const translator = await getTranslations("ArtistCatalogue");

  // Sort artists by name
  const sortedArtists = allArtists.sort((a: any, b: any) => a.name.localeCompare(b.name));

  return (
    <main className="flex flex-col items-center justify-center mb-8">
      <h1 className="text-3xl font-bold mt-8">{translator("title")}</h1>
      <h3 className="text-xl text-center mt-8 w-60vw max-md:w-[80vw] max-md:text-lg">
        {translator("description")}
      </h3>
      <div className="w-full flex flex-col items-center gap-4 mt-8">
        {sortedArtists.map((artist: any) => (
          <div key={artist.slug} className="flex align-center justify-center">
            <ArtistCard locale={locale} artist={artist} />
          </div>
        ))}
      </div>
    </main>
  );
};

export default Page;
