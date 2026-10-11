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
    <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-10 sm:px-6">
      <header className="mb-8 border-b border-theme-border pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Explore the collection</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{translator("title")}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{translator("description")}</p>
      </header>
      <div className="mb-4 flex justify-end">
        <ItemsPerPageSelector />
      </div>
      <div className="w-full">
        {artists.map((artist) => {
          const artistSongs = (artist.songs ?? [])
            .map((mmid) => songsByMmid.get(mmid))
            .filter((song) => song !== undefined);

          return (
            <div key={artist.slug} className="w-full">
              <ArtistCard locale={locale} artist={artist} songs={artistSongs} />
            </div>
          );
        })}
      </div>
      <nav aria-label="Artist catalogue pages" className="mt-10 flex justify-center">
        <Pagination totalPages={totalPages} />
      </nav>
    </main>
  );
};

export default Page;
