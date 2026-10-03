import { adminReads } from "../admin.data";
import { parseAdminSearchParams, type AdminSearchParams } from "../admin-query";
import { AdminListView, EmptyAdminRow, adminDate } from "../admin-list-view";

export default async function SongsPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const query = parseAdminSearchParams(await searchParams);
  const page = await adminReads.listSongs(query);
  return <AdminListView title="Songs" base="/admin/songs" query={query} page={page}
    headers={["ID", "Song", "Artists", "Genre", "Added (UTC)"]}
    rows={page.items.length ? page.items.map(song => <tr key={song.mmid}>
      <td className="p-4">{song.mmid}</td><td className="p-4">{song.songName}</td>
      <td className="p-4">{song.artistName.map(artist => artist.name).join(", ")}</td>
      <td className="p-4">{song.genre}</td><td className="p-4">{adminDate(song.createdAt)}</td>
    </tr>) : <EmptyAdminRow columns={5} />} />;
}
