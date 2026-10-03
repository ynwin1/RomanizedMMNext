import Link from "next/link";
import { adminReads } from "../admin.data";
import { parseAdminSearchParams, type AdminSearchParams } from "../admin-query";
import { AdminListView, EmptyAdminRow } from "../admin-list-view";

export default async function ArtistsPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const query = parseAdminSearchParams(await searchParams);
  const page = await adminReads.listArtists(query);
  return <><Link href="/admin/artists/new" className="mb-6 inline-block rounded bg-indigo-600 px-4 py-2">Create artist</Link>
    <AdminListView title="Artists" base="/admin/artists" query={query} page={page}
      headers={["Artist", "Slug", "Type", "Genres", "Songs", "Actions"]}
      rows={page.items.length ? page.items.map(artist => <tr key={artist.slug}>
        <td className="p-4">{artist.name}</td><td className="p-4">{artist.slug}</td>
        <td className="p-4">{artist.type}</td><td className="p-4">{artist.musicGenre.join(", ")}</td>
        <td className="p-4">{artist.songCount}</td>
        <td className="p-4"><Link className="underline" href={"/admin/artists/" + encodeURIComponent(artist.slug) + "/edit"}>Edit<span className="sr-only"> {artist.name}</span></Link></td>
      </tr>) : <EmptyAdminRow columns={6} />} />
  </>;
}
