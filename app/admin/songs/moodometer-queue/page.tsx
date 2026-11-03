import Link from "next/link";
import {requireAdmin} from "@/infrastructure/auth";
import {listMoodReviewQueue} from "@/modules/songs";
import {QUEUE_STATUSES,queueStatusCounts,type QueueStatus} from "@/modules/songs/application/moodometer.review-queue";
import {adminDate} from "../../admin-list-view";
export const dynamic="force-dynamic";
const labels:Record<QueueStatus,string>={missing:"Missing",draft:"Awaiting review",published:"Published",stale:"Stale lyrics","needs-lyrics":"Needs Lyrics V2"};
const order:Record<QueueStatus,number>={draft:0,stale:1,missing:2,"needs-lyrics":3,published:4};
export default async function Page({searchParams}:{searchParams:Promise<{status?:string;q?:string;page?:string}>}){
 await requireAdmin();
 const params=await searchParams;
 const status=QUEUE_STATUSES.find(item=>item===params.status);
 const query=(typeof params.q==="string"?params.q:"").trim().slice(0,100);
 const requested=Number(params.page);const requestedPage=Number.isSafeInteger(requested)&&requested>0?requested:1;
 const all=await listMoodReviewQueue();
 const counts=queueStatusCounts(all);
 const results=all.filter(s=>(!status||s.status===status)&&(!query||[s.songName,s.artistName,String(s.mmid)]
   .some(value=>value.toLocaleLowerCase().includes(query.toLocaleLowerCase()))))
   .sort((a,b)=>order[a.status]-order[b.status]||b.mmid-a.mmid);
 const pages=Math.max(1,Math.ceil(results.length/20));const page=Math.min(requestedPage,pages);
 const href=(n:number,filter?:QueueStatus)=>{
   const q=new URLSearchParams({page:String(n)});
   if(filter??status)q.set("status",(filter??status)!);
   if(query)q.set("q",query);
   return "/admin/songs/moodometer-queue?"+q.toString();
 };
 return <main className="mx-auto max-w-6xl space-y-6">
  <header className="space-y-2"><h1 className="text-3xl font-bold">Moodometer review queue</h1>
   <p className="text-sm text-zinc-400">Review drafts and identify missing or stale analyses. Nothing is generated or published automatically.</p></header>
  <div className="flex flex-wrap gap-3">
   <Link href="/admin/songs/moodometer-backfill" className="rounded border border-indigo-500 px-4 py-2 text-sm text-indigo-200">Generate missing drafts</Link>
   <Link href="/admin/songs" className="rounded border border-zinc-600 px-4 py-2 text-sm">All songs</Link>
  </div>
  <nav aria-label="Moodometer statuses" className="flex flex-wrap gap-2">
   <Link href="/admin/songs/moodometer-queue" aria-current={!status?"page":undefined} className="rounded border border-zinc-700 px-3 py-2 text-sm">All · {all.length}</Link>
   {QUEUE_STATUSES.map(s=><Link key={s} href={href(1,s)} aria-current={status===s?"page":undefined}
    className={`rounded border px-3 py-2 text-sm ${status===s?"border-indigo-400 text-indigo-200":"border-zinc-700"}`}>{labels[s]} · {counts[s]}</Link>)}
  </nav>
  <form action="/admin/songs/moodometer-queue" method="get" className="flex flex-wrap items-end gap-3">
   {status&&<input type="hidden" name="status" value={status}/>}
   <label className="flex flex-col gap-1 text-sm">Search<input name="q" maxLength={100} defaultValue={query} placeholder="Song, artist or ID"
    className="rounded border border-zinc-700 bg-zinc-900 p-2"/></label>
   <button type="submit" className="rounded bg-indigo-600 px-4 py-2">Apply</button>
   <Link href="/admin/songs/moodometer-queue" className="p-2 text-sm underline">Clear</Link>
  </form>
  <p role="status" className="text-sm text-zinc-400">{results.length} matching songs · Page {page} of {pages}</p>
  <div className="overflow-x-auto rounded-xl border border-zinc-800"><table className="w-full text-left text-sm">
   <thead className="bg-zinc-900"><tr><th scope="col" className="p-3">Song</th><th scope="col" className="p-3">Artist</th>
    <th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Last analysis (UTC)</th><th scope="col" className="p-3">Action</th></tr></thead>
   <tbody className="divide-y divide-zinc-800">{results.slice((page-1)*20,page*20).map(song=><tr key={song.mmid}>
    <td className="p-3"><span className="font-medium">{song.songName}</span><span className="block text-xs text-zinc-400">#{song.mmid}</span></td>
    <td className="p-3">{song.artistName}</td><td className="p-3">{labels[song.status]}</td>
    <td className="p-3">{adminDate(song.lastAnalyzedAt)}</td>
    <td className="p-3"><Link className="text-indigo-300 underline" href={`/admin/songs/${song.mmid}/edit#moodometer`}>
     {song.status==="published"?"View":song.status==="needs-lyrics"?"Edit lyrics":"Review"}</Link></td>
   </tr>)}
   {results.length===0&&<tr><td colSpan={5} className="p-8 text-center text-zinc-400">No matching songs.</td></tr>}
   </tbody>
  </table></div>
  <nav aria-label="Review queue pagination" className="flex gap-5 text-sm">
   {page>1&&<Link href={href(page-1)} className="underline">Previous</Link>}
   <span>Page {page} of {pages}</span>
   {page<pages&&<Link href={href(page+1)} className="underline">Next</Link>}
  </nav>
 </main>;
}
