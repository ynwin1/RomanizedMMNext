import Link from "next/link";
import SongDiscoveryTabs from "@/app/components/catalogue/SongDiscoveryTabs";
import {setRequestLocale} from "next-intl/server";
import {MOOD_IDS} from "@/modules/songs/domain/moodometer.types";
import {isMoodId} from "@/modules/songs/application/mood-discovery";
import {discoverMoodSongs} from "@/modules/songs";
import type {Metadata} from "next";
export const revalidate=300;
export const metadata:Metadata={title:"Discover songs by mood | RomanizedMM",description:"Discover Burmese songs through their moods."};
const faces:Record<string,string>={
 romantic:"🥰",nostalgic:"🥹",heartbroken:"😢",celebratory:"🥳",peaceful:"😌",energetic:"🤩",
 melancholic:"😔",hopeful:"😊",confident:"😎",angry:"😠",longing:"🥺",dreamy:"🌙",anxious:"😰",
 comforting:"🤗",playful:"😜"
};
export default async function MoodPage({params,searchParams}:{
 params:Promise<{locale:string}>;
 searchParams:Promise<{mood?:string}>;
}) {
 const {locale}=await params;
 setRequestLocale(locale);
 const {mood}=await searchParams;
 const selected=mood && isMoodId(mood)?mood:"romantic";
 const results=await discoverMoodSongs(selected);
 return <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
   <header className="space-y-2">
     <h1 className="text-3xl font-bold text-foreground">Discover by mood</h1>
     <p className="text-muted">Explore Burmese songs by the feelings in their lyrics.</p>
   </header>
   <SongDiscoveryTabs locale={locale} active="moods" />
   <nav aria-label="Choose a mood" className="flex flex-wrap gap-2">
     {MOOD_IDS.map(id=><Link key={id} href={`/${locale}/moods?mood=${id}`}
       aria-current={selected===id?"page":undefined}
       className={`rounded-full border px-3 py-2 text-sm capitalize transition-colors ${selected===id?"border-accent bg-accent text-background":"border-theme-border text-foreground hover:border-accent"}`}>
         {faces[id]} {id}
     </Link>)}
   </nav>
   <section aria-label={`Songs matching ${selected}`} className="space-y-4">
     <h2 className="text-xl font-semibold capitalize">{faces[selected]} {selected} songs</h2>
     {results.length ? <div className="grid gap-3 sm:grid-cols-2">
       {results.map(({song,score})=><Link key={song.mmid}
          href={`/${locale}/song/${encodeURIComponent(song.songName.replace(/\\s+/g,""))}/${song.mmid}`}
          className="flex items-center gap-3 rounded-lg border border-theme-border p-3 hover:border-accent">
           {song.imageLink?<img src={song.imageLink} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded object-cover"/>:
             <div className="h-16 w-16 shrink-0 rounded bg-surface"/>}
           <div className="min-w-0 flex-1">
             <p className="truncate font-semibold text-foreground">{song.songName}</p>
             <p className="truncate text-sm text-muted">{song.artistName.map(a=>a.name).join(", ")}</p>
           </div>
           <span className="shrink-0 font-semibold tabular-nums text-accent">{score.toFixed(1)}/10</span>
         </Link>)}
     </div>:<p className="rounded-lg border border-theme-border p-6 text-muted">No published songs for this mood yet. Try a different mood.</p>}
   </section>
 </main>;
}
