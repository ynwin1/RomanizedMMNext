import React from "react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import ArtistCard from "@/app/components/catalogue/ArtistCard";
import Pagination from "@/app/components/catalogue/Pagination";
import ItemsPerPageSelector from "@/app/components/items-selector/ItemsSelector";
import {artistService} from "@/modules/artists";

export const metadata: Metadata = {
  title: "Artist Catalogue",
  description: "A catalogue of all the artists on RomanizedMM. Find your favorite Myanmar artists here!",
};

export type ArtistCataloguePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string, limit?: number }>;
};

const Page = async ({ params, searchParams }: ArtistCataloguePageProps) => {
  const { locale } = await params;
  const { page, limit } = await searchParams;
  const currentPage: number = Number(page) || 1;
  const limitPerPage: number = limit || 10;

  const { artists: allArtists, totalPages } = await artistService.getCatalogue(currentPage, limitPerPage);

  const translator = await getTranslations("ArtistCatalogue");

  return (
    <main className="flex flex-col items-center justify-center mb-8">
      <h1 className="text-3xl font-bold mt-8">{translator("title")}</h1>
      <h3 className="text-xl text-center mt-8 w-60vw max-md:w-[80vw] max-md:text-lg">
        {translator("description")}
      </h3>
      <ItemsPerPageSelector />
      <div className="w-full flex flex-col items-center gap-4 mt-8">
        {allArtists.map((artist: any) => (
          <div key={artist.slug} className="flex align-center justify-center">
            <ArtistCard locale={locale} artist={artist} />
          </div>
        ))}
      </div>
      <div className="flex w-full mt-8 mb-8 justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </main>
  );
};

export default Page;
