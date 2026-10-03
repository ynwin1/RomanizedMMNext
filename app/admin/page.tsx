import Link from "next/link";
import { adminReads } from "./admin.data";
import { adminDate } from "./admin-list-view";

export default async function AdminPage() {
  const dashboard = await adminReads.dashboard();
  const cards = [
    { label: "Songs", total: dashboard.songs, href: "/admin/songs" },
    { label: "Artists", total: dashboard.artists, href: "/admin/artists" },
    { label: "Requests", total: dashboard.requests, href: "/admin/requests" },
    { label: "Pending requests", total: dashboard.pendingRequests, href: "/admin/requests?status=pending" },
  ];
  return (
    <section aria-labelledby="overview-heading">
      <h1 id="overview-heading" className="text-3xl font-bold">Overview</h1>
      <p className="mt-3 text-zinc-400">Your RomanizedMM content at a glance.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => <Link key={card.label} href={card.href} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-indigo-400">
          <h2 className="text-sm text-zinc-400">{card.label}</h2><p className="mt-2 text-3xl font-semibold">{card.total}</p>
        </Link>)}
      </div>
      <h2 className="mt-10 text-xl font-semibold">Recent song additions</h2>
      <ul className="mt-4 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {dashboard.recentSongs.map(song => <li key={song.mmid} className="flex flex-wrap justify-between gap-2 p-4">
          <div><p className="font-medium">{song.songName}</p><p className="text-sm text-zinc-400">{song.artistName.map(artist => artist.name).join(", ")}</p></div>
          <span className="text-sm text-zinc-400">{adminDate(song.createdAt)} (UTC)</span>
        </li>)}
        {!dashboard.recentSongs.length && <li className="p-6 text-zinc-400">No songs have been added yet.</li>}
      </ul>
    </section>
  );
}
