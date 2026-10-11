import Link from "next/link";
import {requireAdmin} from "@/infrastructure/auth";
import {playlistService} from "@/modules/playlists";

export default async function PlaylistsPage() {
  await requireAdmin();
  const playlists = await playlistService.listAdmin();
  return <section>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold">Playlists</h1><p className="mt-2 text-sm text-zinc-400">Curate public Spotify playlists by genre.</p></div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/playlists/submissions" className="rounded border border-indigo-400 px-4 py-3 font-medium text-indigo-300">Review submissions</Link>
        <Link href="/admin/playlists/new" className="rounded bg-indigo-600 px-4 py-3 font-medium hover:bg-indigo-500">Add playlist</Link>
      </div>
    </div>
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-zinc-900 text-zinc-300"><tr>
          <th className="p-4">Playlist</th><th className="p-4">Platform</th><th className="p-4">Genres</th>
          <th className="p-4">Status</th><th className="p-4">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-zinc-800">
          {playlists.map(playlist => <tr key={playlist.id}>
            <td className="p-4 font-medium">{playlist.title}</td>
            <td className="p-4 capitalize">{playlist.platform.replace("_", " ")}</td>
            <td className="p-4">{playlist.genres.join(", ")}</td>
            <td className="p-4 capitalize">{playlist.status}</td>
            <td className="p-4"><Link className="text-indigo-300 underline" href={`/admin/playlists/${playlist.id}/edit`}>Edit<span className="sr-only"> {playlist.title}</span></Link></td>
          </tr>)}
          {playlists.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-zinc-400">No playlists yet. Add your first Spotify playlist.</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
