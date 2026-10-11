import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {playlistService, PLAYLIST_GENRES, type PlaylistGenre} from "@/modules/playlists";
import {loadPlaylistDiscovery} from "@/modules/playlists/application/playlist-discovery";
import PlaylistCard from "@/app/components/playlists/PlaylistCard";

export const revalidate = 900;

const genreLabels: Record<PlaylistGenre, {en: string; my: string}> = {
  pop: {en: "Pop", my: "ပေါ့ပ်"},
  rock: {en: "Rock", my: "ရော့ခ်"},
  "hip-hop-rap": {en: "Hip-Hop & Rap", my: "ဟစ်ဟော့နှင့် ရက်ပ်"},
  "rnb-soul": {en: "R&B & Soul", my: "R&B နှင့် ဆိုလ်"},
  "indie-alternative": {en: "Indie & Alternative", my: "အင်ဒီနှင့် အယ်လ်တာနေးတစ်"},
  "traditional-classical": {en: "Traditional & Classical", my: "ရိုးရာနှင့် ဂန္ထဝင်"},
  "jazz-blues": {en: "Jazz & Blues", my: "ဂျက်ဇ်နှင့် ဘလူးစ်"},
  "electronic-edm": {en: "Electronic & EDM", my: "အီလက်ထရွန်းနစ်နှင့် EDM"},
};

type Props = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{genre?: string | string[]}>;
};

export async function generateMetadata({params}: Pick<Props, "params">): Promise<Metadata> {
  const {locale} = await params;
  const burmese = locale === "my";
  return {
    title: burmese ? "မြန်မာသီချင်း Playlist များ" : "Burmese Music Playlists",
    description: burmese
      ? "မြန်မာသီချင်းအမျိုးအစားအလိုက် ရွေးချယ်ထားသော Playlist များကို ရှာဖွေနားဆင်ပါ။"
      : "Discover curated Burmese music playlists by genre. Explore Myanmar pop, rock, hip-hop, and more.",
    alternates: {
      canonical: `https://www.romanizedmm.com/${locale}/playlists`,
      languages: {en: "https://www.romanizedmm.com/en/playlists", my: "https://www.romanizedmm.com/my/playlists"},
    },
  };
}

export default async function PlaylistsPage({params, searchParams}: Props) {
  const {locale} = await params;
  if (locale !== "en" && locale !== "my") notFound();
  const query = await searchParams;
  const {selectedGenre, groups} = await loadPlaylistDiscovery(
    query.genre,
    (genre, limit) => playlistService.listPublishedByGenre(genre, limit),
  );
  const my = locale === "my";
  const language = my ? "my" : "en";
  return <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 text-foreground sm:px-6">
    <header className="mb-8 border-b border-theme-border pb-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">RomanizedMM · Music discovery</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{my ? "မြန်မာသီချင်း Playlist များ" : "Discover Burmese Music Playlists"}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
        {my ? "ကြိုက်နှစ်သက်ရာ ဂီတအမျိုးအစားကို ရွေးပြီး Spotify မှ မြန်မာသီချင်း Playlist များကို နားဆင်လိုက်ပါ။"
          : "A handpicked collection of Myanmar music, organized by genre. Find something you love and listen on Spotify."}
      </p>
    </header>

    <nav aria-label={my ? "ဂီတအမျိုးအစားများ" : "Playlist genres"} className="mb-10 flex flex-wrap gap-2">
      <Link href={`/${locale}/playlists`} aria-current={!selectedGenre ? "page" : undefined}
        className={`inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${!selectedGenre ? "border-accent bg-accent text-on-accent" : "border-theme-border bg-surface text-foreground hover:border-accent hover:text-accent"}`}>
        {my ? "အားလုံး" : "All genres"}
      </Link>
      {PLAYLIST_GENRES.map(genre => <Link key={genre} href={`/${locale}/playlists?genre=${encodeURIComponent(genre)}`}
        aria-current={selectedGenre === genre ? "page" : undefined}
        className={`inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${selectedGenre === genre ? "border-accent bg-accent text-on-accent" : "border-theme-border bg-surface text-foreground hover:border-accent hover:text-accent"}`}>
        {genreLabels[genre][language]}
      </Link>)}
    </nav>

    {groups.length ? <div className="space-y-12">
      {groups.map(group => <section key={group.genre} aria-labelledby={`genre-${group.genre}`}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-theme-border-subtle pb-4">
          <div>
            <h2 id={`genre-${group.genre}`} className="text-2xl font-bold">{genreLabels[group.genre][language]}</h2>
            <p className="mt-1 text-sm text-muted">{my ? "ရွေးချယ်ထားသော Playlist များ" : "Curated playlists"}</p>
          </div>
          {!selectedGenre && <Link href={`/${locale}/playlists?genre=${encodeURIComponent(group.genre)}`}
            className="text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-hover">
            {my ? "အမျိုးအစား ကြည့်ရန်" : "Explore genre"} →
          </Link>}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {group.playlists.map(playlist => <PlaylistCard key={playlist.id} playlist={playlist} locale={locale} />)}
        </div>
      </section>)}
    </div> : <section className="rounded-xl border border-theme-border bg-surface px-6 py-14 text-center">
      <h2 className="text-xl font-semibold">{my ? "Playlist မရှိသေးပါ" : "Playlists coming soon"}</h2>
      <p className="mt-2 text-sm text-muted">
        {my ? "ဒီဂီတအမျိုးအစားအတွက် Playlist များ မကြာမီ ထည့်သွင်းပေးပါမည်။" : "We're curating great Burmese music for this genre. Check back soon."}
      </p>
      {selectedGenre && <Link href={`/${locale}/playlists`} className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-accent underline">
        {my ? "အမျိုးအစားအားလုံး ကြည့်ရန်" : "Browse all genres"}
      </Link>}
    </section>}
  </main>;
}
