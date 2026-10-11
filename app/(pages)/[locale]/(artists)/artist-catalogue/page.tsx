import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import ArtistCard from "@/app/components/catalogue/ArtistCard";
import Pagination from "@/app/components/catalogue/Pagination";
import ItemsPerPageSelector from "@/app/components/items-selector/ItemsSelector";
import CatalogueSearch from "@/app/components/catalogue/CatalogueSearch";
import { artistService } from "@/modules/artists";
import { normalizeArtistCatalogueQuery } from "@/modules/artists/application/artist-catalogue-search";
import { loadArtistCatalogueSongs } from "./artist-catalogue.data";

export const metadata: Metadata = {
  title: "Artist Catalogue",
  description: "A catalogue of all the artists on RomanizedMM. Find your favorite Myanmar artists here!",
};

export type ArtistCataloguePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; limit?: number | string; q?: string }>;
};

const Page = async ({ params, searchParams }: ArtistCataloguePageProps) => {
  const { locale } = await params;
  const { page, limit, q } = await searchParams;
  const currentPage = Math.max(1, Math.floor(Number(page) || 1));
  const requestedLimit = Number(limit) || 10;
  const limitPerPage = [10, 20, 30, 40, 50].includes(requestedLimit) ? requestedLimit : 10;
  const query = normalizeArtistCatalogueQuery(q ?? "");

  const { artists, totalPages } = await artistService.getCatalogue(
    currentPage,
    limitPerPage,
    query,
  );

  const songs = await loadArtistCatalogueSongs(artists);
  const songsByMmid = new Map(songs.map((song) => [song.mmid, song]));

  const translator = await getTranslations("ArtistCatalogue");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-6">
      <header className="mb-8 border-b border-theme-border pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Explore the collection</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{translator("title")}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{translator("description")}</p>
      </header>
      <div className="mb-6 rounded-xl border border-theme-border bg-surface p-4 sm:p-5">
        <CatalogueSearch initialQuery={query} locale={locale} mode="artists" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-theme-border pt-4">
          <p className="text-sm text-muted">
            {query ? `Results for “${query}”` : "Discover Myanmar artists"}
          </p>
          <ItemsPerPageSelector />
        </div>
      </div>
      {artists.length ? <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
      </div> : (
        <div className="rounded-xl border border-theme-border bg-surface px-6 py-14 text-center">
          <h2 className="text-xl font-semibold text-foreground">No artists found</h2>
          <p className="mt-2 text-sm text-muted">Try another name or browse the full artist catalogue.</p>
          {query && <Link href={`/${locale}/artist-catalogue`} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">Show all artists</Link>}
        </div>
      )}
      {totalPages > 1 && <nav aria-label="Artist catalogue pages" className="mt-10 flex justify-center">
        <Pagination totalPages={totalPages} />
      </nav>}
    </main>
  );
};

export default Page;
