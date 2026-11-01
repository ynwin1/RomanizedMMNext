import Link from "next/link";
import {notFound} from "next/navigation";
import {requireAdmin} from "@/infrastructure/auth";
import {songService, SongIdSchema} from "@/modules/songs";
import MoodometerEditor from "../../moodometer-editor";
export default async function Page({params}:{params:Promise<{id:string}>}) {
  await requireAdmin();
  const {id}=await params;
  const parsed=SongIdSchema.safeParse(id);
  if (!parsed.success) notFound();
  const song=await songService.getSongForEdit(parsed.data);
  return <section className="mx-auto max-w-4xl space-y-6">
    <Link className="text-sm text-indigo-300 underline" href={`/admin/songs/${song.mmid}/edit`}>Back to song editor</Link>
    <h1 className="text-3xl font-bold">Moodometer — {song.songName}</h1>
    <p className="text-sm text-zinc-400">Analyze lyrics, review scores out of 10, and publish when ready. Older versions remain in history.</p>
    {song.lyricsV2 ? <MoodometerEditor mmid={song.mmid}/> : <p>LyricsV2 is required to analyze mood.</p>}
  </section>;
}
