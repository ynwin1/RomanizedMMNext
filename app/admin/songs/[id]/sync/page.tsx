import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/infrastructure/auth";
import { songService, SongIdSchema } from "@/modules/songs";
import { lyricTimingFingerprint } from "@/modules/songs/application/lyric-timing.fingerprint";
import { extractYouTubeVideoId } from "@/modules/songs/application/lyric-timing.service";
import TimingEditor from "../../timing-editor";

export default async function SyncSongPage({params}: {params: Promise<{id: string}>}) {
  await requireAdmin();
  const {id} = await params;
  const parsed = SongIdSchema.safeParse(id);
  if (!parsed.success) notFound();
  const song = await songService.getSongForEdit(parsed.data);
  if (!song.lyricsV2) return <p>LyricsV2 is required before synchronizing this song.</p>;
  const recordings = (song.youtubeLink ?? []).flatMap(url => {
    const videoId = extractYouTubeVideoId(url);
    return videoId ? [{videoId, url}] : [];
  }).filter((recording, index, all) => all.findIndex(other => other.videoId === recording.videoId) === index);
  return <section className="mx-auto max-w-6xl space-y-5">
    <Link href={`/admin/songs/${song.mmid}/edit`} className="text-sm text-indigo-300 underline">Back to song editor</Link>
    <h1 className="text-3xl font-bold">Synchronize lyrics — {song.songName}</h1>
    <p className="text-sm text-zinc-400">Timing changes are saved as drafts and are not shown to visitors yet.</p>
    {recordings.length ? <TimingEditor mmid={song.mmid} fingerprint={lyricTimingFingerprint(song.lyricsV2)}
      lyrics={song.lyricsV2} recordings={recordings}/> :
      <p className="rounded border border-zinc-700 p-4">Add a valid YouTube URL to this song and save it before starting synchronization.</p>}
  </section>;
}
