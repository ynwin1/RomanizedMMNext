import { adminReads } from "../admin.data";
import { parseAdminSearchParams, type AdminSearchParams } from "../admin-query";
import { AdminListView, EmptyAdminRow } from "../admin-list-view";

export default async function ArtistsPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const query = parseAdminSearchParams(await searchParams);
  const page = await adminReads.listArtists(query);
  return <AdminListView title="Artists" base="/admin/artists" query={query} page={page}
    headers={["Artist", "Slug", "Type", "Genres", "Songs"]}
    rows={page.items.length ? page.items.map(artist => <tr key={artist.slug}>
      <td className="p-4">{artist.name}</td><td className="p-4">{artist.slug}</td>
      <td className="p-4">{artist.type}</td><td className="p-4">{artist.musicGenre.join(", ")}</td>
      <td className="p-4">{artist.songCount}</td>
    </tr>) : <EmptyAdminRow columns={5} />} />;
}
