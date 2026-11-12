import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { songService, SongIdSchema } from "@/modules/songs";
import { NotFoundError } from "@/shared/errors/not-found.error";
import SongForm from "../../song-form";
import MoodometerEditor from "../../moodometer-editor";
import SongCoverEditor from "../../song-cover-editor";
import { songCoverService } from "@/modules/songs";
import { AdminAuditMeta } from "../../../admin-audit-meta";

export default async function EditSongPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; mood?: string; requestLinkFailed?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const parsed = SongIdSchema.safeParse(id);
  if (!parsed.success) notFound();
  const song = await songService.getSongForEdit(parsed.data).catch(error => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const covers = await songCoverService.adminList(song.mmid);
  const { saved, mood, requestLinkFailed } = await searchParams;
  return <section>
    <h1 className="text-3xl font-bold">Edit song</h1>
    {saved === "1" && <p role="status" className="mt-4 text-emerald-300">Song saved successfully.</p>}
    {requestLinkFailed === "1" && <p role="alert" className="mt-3 text-amber-300">Song created but request fulfillment failed. Do not create the song again; review the request separately.</p>}
    {Boolean(song.youtubeLink?.length && song.lyricsV2) && <p className="my-4"><Link href={`/admin/songs/${song.mmid}/sync`} className="inline-block rounded border border-indigo-500 px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-950">Synchronize YouTube lyrics</Link></p>}
    {Boolean(song.lyricsV2) && <p className="my-4"><Link href={`/admin/songs/${song.mmid}/moodometer`} className="inline-block rounded border border-indigo-500 px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-950">Moodometer — Analyze Mood</Link></p>}
    {mood === "ready" && <p role="status" className="mt-3 text-emerald-300">Moodometer draft generated. Review and publish it below when ready.</p>}
    {mood === "failed" && <p role="alert" className="mt-3 text-amber-300">Song saved, but Moodometer generation failed. You can try again below.</p>}
    <AdminAuditMeta createdAt={song.createdAt} updatedAt={song.updatedAt} updatedBy={song.updatedBy} />
    <SongForm key={song.mmid + ":" + song.revision} song={song} />
    <section id="covers" className="mt-10 border-t border-zinc-700 pt-8">
      <h2 className="mb-2 text-2xl font-semibold">Covers &amp; Interpretations</h2>
      <p className="mb-4 text-sm text-zinc-400">Add YouTube covers and instrumental interpretations of this song. These videos are separate from the original recording used for lyric synchronization.</p>
      <SongCoverEditor mmid={song.mmid} initialCovers={covers} />
    </section>
    {Boolean(song.lyricsV2) && <section id="moodometer" className="mt-10 border-t border-zinc-700 pt-8">
      <h2 className="mb-4 text-2xl font-semibold">Moodometer</h2>
      <MoodometerEditor mmid={song.mmid}/>
    </section>}
  </section>;
}
