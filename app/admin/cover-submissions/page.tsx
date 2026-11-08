import Link from "next/link";
import { requireAdmin } from "@/infrastructure/auth";
import { songCoverService, songService } from "@/modules/songs";
import { z } from "zod";
import CoverReviewControls from "./CoverReviewControls";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).catch("pending"),
  page: z.coerce.number().int().positive().max(100000).catch(1),
  q: z.string().trim().max(100).catch(""),
});
type SearchParams = {status?: string; page?: string; q?: string};
const statuses = ["pending", "approved", "rejected"] as const;
const queryUrl = (status: string, q: string, page: number) =>
  "/admin/cover-submissions?" + new URLSearchParams({status, ...(q ? {q} : {}), page: String(page)}).toString();

export default async function CoverSubmissionsPage({searchParams}: {searchParams: Promise<SearchParams>}) {
  await requireAdmin();
  const query = QuerySchema.parse(await searchParams);
  // Catalogue data is used only to resolve song title searches and display
  // the names for the limited set of result rows.
  const catalogue = await songService.getCatalogueSongs();
  const songNames = new Map(catalogue.map(song => [song.mmid, song.songName]));
  const needle = query.q.toLocaleLowerCase();
  const matchingIds = needle
    ? catalogue.filter(song => song.songName.toLocaleLowerCase().includes(needle) || String(song.mmid) === needle)
        .map(song => song.mmid)
    : undefined;
  const queue = await songCoverService.adminQueue({
    status: query.status, page: query.page, limit: 20, ...(matchingIds ? {mmids:matchingIds} : {}),
  });

  return <section className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold">Cover submissions</h1>
      <p className="mt-2 text-sm text-zinc-400">Review YouTube performances suggested by visitors. Nothing becomes public until you approve it.</p>
    </div>
    <nav aria-label="Submission status" className="flex flex-wrap gap-2">
      {statuses.map(status => <Link key={status} href={queryUrl(status,query.q,1)}
        aria-current={query.status===status ? "page" : undefined}
        className={`rounded-lg border px-4 py-2 text-sm capitalize ${query.status === status ? "border-indigo-400 bg-indigo-950 text-indigo-100" : "border-zinc-700 text-zinc-300 hover:border-indigo-500"}`}>
        {status}
      </Link>)}
    </nav>
    <form className="flex max-w-xl flex-wrap gap-2" action="/admin/cover-submissions">
      <input type="hidden" name="status" value={query.status}/>
      <label htmlFor="cover-song-search" className="sr-only">Search songs</label>
      <input id="cover-song-search" name="q" defaultValue={query.q} maxLength={100}
        placeholder="Search by song name or ID"
        className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"/>
      <button className="rounded-lg bg-indigo-700 px-4 py-2 text-white" type="submit">Search</button>
      {query.q && <Link className="self-center text-sm text-indigo-300 underline" href={queryUrl(query.status,"",1)}>Clear</Link>}
    </form>
    <p className="text-sm text-zinc-400">{queue.total} {query.status} community suggestion{queue.total === 1 ? "" : "s"}</p>
    {queue.items.length === 0 && <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-zinc-400">No matching cover submissions.</p>}
    <div className="space-y-4">
      {queue.items.map(cover => <article key={cover.id} className="min-w-0 space-y-4 rounded-xl border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
          <a href={`https://www.youtube.com/watch?v=${cover.youtubeVideoId}`}
            target="_blank" rel="noopener noreferrer"
            className="block aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-zinc-800 sm:w-48"
            aria-label={`Preview ${cover.title || cover.youtubeVideoId} on YouTube`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${cover.youtubeVideoId}/hqdefault.jpg`}
              alt="" loading="lazy" className="h-full w-full object-cover"/>
          </a>
          <div className="min-w-0 flex-1 space-y-2">
            <Link href={`/admin/songs/${cover.mmid}/edit#covers`} className="break-words font-semibold text-indigo-300 underline">
              {songNames.get(cover.mmid) ?? `Song #${cover.mmid}`} (#{cover.mmid})
            </Link>
            <p className="break-words text-sm text-zinc-200">{cover.title || `YouTube video ${cover.youtubeVideoId}`}</p>
            {cover.description && <p className="break-words text-sm text-zinc-400">{cover.description}</p>}
            {cover.contributorName && <p className="text-xs text-zinc-400">Suggested by: {cover.contributorName}</p>}
            <p className="text-xs capitalize text-zinc-500">{cover.status} · {cover.createdAt ? new Date(cover.createdAt).toLocaleDateString("en-CA",{timeZone:"UTC"}) : "Date unavailable"}</p>
            <a href={`https://www.youtube.com/watch?v=${cover.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
              className="inline-block text-sm text-indigo-300 underline">Watch on YouTube</a>
          </div>
        </div>
        {cover.status === "pending" ? <CoverReviewControls cover={cover}/> : <p className="text-sm capitalize text-zinc-400">Reviewed: {cover.status}</p>}
      </article>)}
    </div>
    {queue.totalPages > 1 && <nav aria-label="Submission pages" className="flex items-center justify-between gap-4">
      {query.page > 1 ? <Link className="text-indigo-300 underline" href={queryUrl(query.status,query.q,query.page-1)}>Previous</Link> : <span/>}
      <span className="text-sm text-zinc-400">Page {query.page} of {queue.totalPages}</span>
      {query.page < queue.totalPages ? <Link className="text-indigo-300 underline" href={queryUrl(query.status,query.q,query.page+1)}>Next</Link> : <span/>}
    </nav>}
  </section>;
}
