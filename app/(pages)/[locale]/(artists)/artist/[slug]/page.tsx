import Image from "@/app/components/media/ResilientImage";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";
import type {Metadata} from "next";
import Biography from "@/app/components/artist/biography";
import SongCard from "@/app/components/artist/SongCard";
import {artistService, type ArtistEntity} from "@/modules/artists";
import {songService, type SongEntity} from "@/modules/songs";
import {logger} from "@/infrastructure/logging/logger";
import {artistSeo, jsonLdScriptValue} from "@/app/lib/artist-seo";
import {artistBiographyForLocale} from "./artist-profile-content";

type Params = {params: Promise<{locale: string; slug: string}>; searchParams?: Promise<Record<string, string | string[] | undefined>>};

export async function generateMetadata({params}: Params): Promise<Metadata> {
  try {
    const {locale, slug} = await params;
    if (!slug || !locale) throw new Error("Missing artist slug or locale");
    const artist = await artistService.getBySlug(slug);
    const seo = artistSeo(artist, locale);
    return {
      title: seo.title, description: seo.description, category: "Music",
      alternates: {canonical: seo.canonical, languages: seo.alternateLanguages},
      openGraph: {
        title: seo.title, description: seo.description, type: "profile",
        images: artist.imageLink ? [{url: artist.imageLink, alt: artist.name}] : [],
        locale, alternateLocale: locale === "en" ? ["my"] : ["en"],
        url: seo.canonical, siteName: "RomanizedMM",
      },
    };
  } catch (error) {
    logger.error("Failed to generate artist metadata", error);
    return {title: "Artist"};
  }
}

const socialPlatforms = [
  {key: "facebook", label: "Facebook"},
  {key: "instagram", label: "Instagram"},
  {key: "youtube", label: "YouTube"},
  {key: "spotify", label: "Spotify"},
  {key: "appleMusic", label: "Apple Music"},
] as const;

const ArtistPortrait = ({src, name}: {src?: string; name: string}) => (
  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-surface-raised shadow-lg sm:h-36 sm:w-36 md:h-44 md:w-44">
    {src ? <Image src={src} alt={name} fill sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px" className="object-cover" priority />
      : <div aria-label="No artist photo" className="flex h-full w-full items-center justify-center text-5xl text-accent">♫</div>}
  </div>
);

export default async function Page({params}: Params) {
  const {locale, slug} = await params;
  let artist: ArtistEntity;
  let artistSongs: SongEntity[] = [];
  try {
    artist = await artistService.getBySlug(slug);
    if (artist.songs?.length) artistSongs = await songService.getSongsByMmids(artist.songs);
    artistSongs.sort((a, b) => a.songName.localeCompare(b.songName));
  } catch (error) {
    logger.error("Failed to fetch artist page data", error);
    return notFound();
  }

  const translator = await getTranslations("ArtistPage");
  const seo = artistSeo(artist, locale);
  const biography = artistBiographyForLocale(artist, locale);
  const genres = artist.musicGenre ?? [];
  const members = artist.members ?? [];
  const origins = artist.origin ?? [];
  const requestHeading = locale === "my" ? `${artist.name} ${translator("askMore")}` : `${translator("askMore")} ${artist.name}?`;

  return (
    <main className="w-full pb-16 text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLdScriptValue(seo.entity)}} />
      <div className="relative h-40 w-full overflow-hidden bg-surface-raised sm:h-52 md:h-64">
        {artist.bannerLink && <Image src={artist.bannerLink} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-14 w-full max-w-6xl px-4 sm:-mt-20 sm:px-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:gap-7">
          <ArtistPortrait src={artist.imageLink} name={artist.name} />
          <div className="min-w-0 flex-1 pb-1">
            <Link href={`/${locale}/artist-catalogue`} className="text-xs font-semibold uppercase tracking-widest text-accent hover:underline">← {locale === "my" ? "အဆိုတော်များ" : "Artist catalogue"}</Link>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{artist.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {artist.type && <span className="rounded-full border border-theme-border bg-surface px-3 py-1 font-medium">{artist.type}</span>}
              {genres.map(genre => <span key={genre} className="rounded-full bg-surface-raised px-3 py-1 text-muted">{genre}</span>)}
            </div>
            {origins.length > 0 && <p className="mt-3 text-sm text-muted">{origins.join(" · ")}</p>}
          </div>
        </div>

        {artist.socials && <div aria-label="Artist social profiles" className="mt-6 flex flex-wrap gap-2">
          {socialPlatforms.map(({key, label}) => {
            const href = artist.socials?.[key];
            if (!href || !/^https?:\/\//i.test(href)) return null;
            return <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-theme-border bg-surface px-3 text-sm font-medium text-foreground hover:border-accent hover:text-accent">{label} <span aria-hidden="true" className="ml-1">↗</span></a>;
          })}
        </div>}

        {members.length > 0 && <section aria-labelledby="band-members-title" className="mt-10">
          <h2 id="band-members-title" className="mb-4 text-xl font-semibold">{locale === "my" ? "အဖွဲ့ဝင်များ" : "Members"}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {members.map((member, index) => {
              const content = <>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-raised text-2xl text-accent">
                  {member.imageLink ? <Image src={member.imageLink} alt="" width={64} height={64} className="h-full w-full object-cover" /> : "♫"}
                </div>
                <span className="min-w-0 break-words text-sm font-semibold">{member.name}</span>
              </>;
              const classes = "flex min-w-0 items-center gap-3 rounded-xl border border-theme-border bg-surface p-3 text-foreground";
              return member.slug
                ? <Link key={`${member.name}-${index}`} href={`/${locale}/artist/${member.slug}`} className={`${classes} hover:border-accent hover:text-accent`}>{content}</Link>
                : <div key={`${member.name}-${index}`} className={classes}>{content}</div>;
            })}
          </div>
        </section>}

        {biography.trim() && <section className="mt-10 rounded-xl border border-theme-border bg-surface p-5 sm:p-7">
          <Biography biography={biography} locale={locale} />
        </section>}

        <section aria-labelledby="artist-songs-title" className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-theme-border pb-4">
            <h2 id="artist-songs-title" className="text-2xl font-bold sm:text-3xl">{locale === "my" ? "သီချင်းများ" : "Songs"}</h2>
            <span className="text-sm text-muted">{artistSongs.length} {locale === "my" ? "ပုဒ်" : artistSongs.length === 1 ? "song" : "songs"}</span>
          </div>
          {artistSongs.length ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {artistSongs.map(song => <SongCard key={song.mmid} mmid={song.mmid} songName={song.songName} imageLink={song.imageLink || ""} locale={locale} />)}
          </div> : <div className="rounded-xl border border-theme-border bg-surface p-8 text-center text-sm text-muted">{locale === "my" ? "သီချင်းများ မရှိသေးပါ။" : "No songs listed yet."}</div>}
        </section>

        <div className="mt-12 rounded-xl border border-theme-border bg-surface p-6 text-center sm:p-8">
          <h2 className="text-lg font-semibold sm:text-xl">{requestHeading}</h2>
          <Link href={`/${locale}/song-request`} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">{translator("request")}</Link>
        </div>
      </div>
    </main>
  );
}
