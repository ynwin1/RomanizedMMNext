import Link from "next/link";
import { adminReads } from "../admin.data";
import { parseAdminSearchParams, type AdminSearchParams } from "../admin-query";
import { AdminListView, EmptyAdminRow, adminDate } from "../admin-list-view";

export default async function SongsPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const query = parseAdminSearchParams(await searchParams);
  const page = await adminReads.listSongs(query);
  return <><Link href="/admin/songs/new" className="mb-6 inline-block rounded bg-indigo-600 px-4 py-2">Create song</Link><AdminListView title="Songs" base="/admin/songs" query={query} page={page}
    headers={["ID", "Song", "Artists", "Genre", "Added (UTC)", "Actions"]}
    rows={page.items.length ? page.items.map(song => <tr key={song.mmid}>
      <td className="p-4">{song.mmid}</td><td className="p-4">{song.songName}</td>
      <td className="p-4">{song.artistName.map(artist => artist.name).join(", ")}</td>
      <td className="p-4">{song.genre}</td><td className="p-4">{adminDate(song.createdAt)}</td>
      <td className="p-4"><Link className="underline" href={"/admin/songs/" + song.mmid + "/edit"}>Edit<span className="sr-only"> {song.songName}</span></Link></td>
    </tr>) : <EmptyAdminRow columns={6} />} /></>;
}
