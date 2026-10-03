import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { songService, SongIdSchema } from "@/modules/songs";
import { NotFoundError } from "@/shared/errors/not-found.error";
import SongForm from "../../song-form";
import { AdminAuditMeta } from "../../../admin-audit-meta";

export default async function EditSongPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const parsed = SongIdSchema.safeParse(id);
  if (!parsed.success) notFound();
  const song = await songService.getSongForEdit(parsed.data).catch(error => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const { saved } = await searchParams;
  return <section>
    <h1 className="text-3xl font-bold">Edit song</h1>
    {saved === "1" && <p role="status" className="mt-4 text-emerald-300">Song saved successfully.</p>}
    <AdminAuditMeta createdAt={song.createdAt} updatedAt={song.updatedAt} updatedBy={song.updatedBy} />
    <SongForm key={song.mmid + ":" + song.revision} song={song} />
  </section>;
}
