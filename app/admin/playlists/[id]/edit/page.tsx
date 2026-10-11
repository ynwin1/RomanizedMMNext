import {notFound} from "next/navigation";
import {requireAdmin} from "@/infrastructure/auth";
import {playlistService, PlaylistIdSchema} from "@/modules/playlists";
import {NotFoundError} from "@/shared/errors/not-found.error";
import {AdminAuditMeta} from "@/app/admin/admin-audit-meta";
import PlaylistForm from "../../playlist-form";

export default async function EditPlaylistPage({params, searchParams}: {
  params: Promise<{id: string}>;
  searchParams: Promise<{saved?: string}>;
}) {
  await requireAdmin();
  const {id} = await params;
  if (!PlaylistIdSchema.safeParse(id).success) notFound();
  const playlist = await playlistService.getForAdmin(id).catch(error => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const {saved} = await searchParams;
  return <section>
    <h1 className="text-3xl font-bold">Edit playlist</h1>
    {saved === "1" && <p role="status" className="mt-4 text-emerald-300">Playlist saved successfully.</p>}
    <AdminAuditMeta createdAt={playlist.createdAt} updatedAt={playlist.updatedAt} updatedBy={playlist.updatedBy} />
    <PlaylistForm key={`${playlist.id}:${playlist.revision}`} playlist={playlist} />
  </section>;
}
