import Link from "next/link";
import {requireAdmin} from "@/infrastructure/auth";
import {listPlaylistSubmissions} from "@/modules/playlists";
import ReviewButtons from "./ReviewButtons";

export const dynamic = "force-dynamic";

export default async function PlaylistSubmissionsPage() {
  await requireAdmin();
  const submissions = await listPlaylistSubmissions();
  return <section>
    <Link href="/admin/playlists" className="text-sm text-indigo-300 underline">← Back to playlists</Link>
    <h1 className="mb-2 mt-5 text-3xl font-bold">Playlist submissions</h1>
    <p className="mb-6 text-sm text-zinc-400">Review user suggestions before publishing. Approval imports metadata from Spotify.</p>
    <div className="space-y-3">
      {submissions.map(item => <article key={item.id} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-zinc-400">{item.genre} · {item.status} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-CA") : ""}</p>
            <a className="break-all text-indigo-300 underline" href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
          </div>
          {item.status === "pending" ? <ReviewButtons id={item.id} /> : <span className="capitalize text-sm text-zinc-400">{item.status}</span>}
        </div>
      </article>)}
      {!submissions.length && <p className="text-zinc-400">No playlist submissions yet.</p>}
    </div>
  </section>;
}
