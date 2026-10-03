import React from "react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import ArtistCard from "@/app/components/catalogue/ArtistCard";
import Pagination from "@/app/components/catalogue/Pagination";
import ItemsPerPageSelector from "@/app/components/items-selector/ItemsSelector";
import { artistService } from "@/modules/artists";
import { loadArtistCatalogueSongs } from "./artist-catalogue.data";

export const metadata: Metadata = {
  title: "Artist Catalogue",
  description: "A catalogue of all the artists on RomanizedMM. Find your favorite Myanmar artists here!",
};

export type ArtistCataloguePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; limit?: number }>;
};

const Page = async ({ params, searchParams }: ArtistCataloguePageProps) => {
  const { locale } = await params;
  const { page, limit } = await searchParams;
  const currentPage = Number(page) || 1;
  const limitPerPage = limit || 10;

  const { artists, totalPages } = await artistService.getCatalogue(
    currentPage,
    limitPerPage,
  );

  const songs = await loadArtistCatalogueSongs(artists);
  const songsByMmid = new Map(songs.map((song) => [song.mmid, song]));

  const translator = await getTranslations("ArtistCatalogue");

  return (
    <main className="flex flex-col items-center justify-center mb-8">
      <h1 className="text-3xl font-bold mt-8">{translator("title")}</h1>
      <h3 className="text-xl text-center mt-8 w-60vw max-md:w-[80vw] max-md:text-lg">
        {translator("description")}
      </h3>
      <ItemsPerPageSelector />
      <div className="w-full flex flex-col items-center gap-4 mt-8">
        {artists.map((artist) => {
          const artistSongs = (artist.songs ?? [])
            .map((mmid) => songsByMmid.get(mmid))
            .filter((song) => song !== undefined);

          return (
            <div key={artist.slug} className="flex align-center justify-center">
              <ArtistCard locale={locale} artist={artist} songs={artistSongs} />
            </div>
          );
        })}
      </div>
      <div className="flex w-full mt-8 mb-8 justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </main>
  );
};

export default Page;
