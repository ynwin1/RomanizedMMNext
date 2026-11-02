"use client";
import {useState} from "react";
import Link from "next/link";
import {generateMissingMoodometerDraftAction,listMissingMoodometerAction} from "../moodometer-batch-actions";

type Candidate={mmid:number;songName:string;artistName:string};
export default function MoodometerBackfill({initialSongs}:{initialSongs:Candidate[]}) {
 const [songs,setSongs]=useState(initialSongs);
 const [selected,setSelected]=useState<number[]>([]);
 const [working,setWorking]=useState(false);
 const [progress,setProgress]=useState("");
 const [errors,setErrors]=useState<string[]>([]);
 const generate=async()=>{
  if(!selected.length || !window.confirm(`Generate AI drafts for ${selected.length} songs? No drafts will be published.`))return;
  setWorking(true);setErrors([]);
  const failures:string[]=[];
  for(let i=0;i<selected.length;i++){
   const id=selected[i];setProgress(`Generating ${i+1} of ${selected.length} (song #${id})…`);
   try {await generateMissingMoodometerDraftAction(id)}
   catch(error){failures.push(`#${id}: ${error instanceof Error?error.message:"Could not generate"}`)}
  }
  setErrors(failures);setSelected([]);
  try {setSongs(await listMissingMoodometerAction())}catch{failures.push("Unable to refresh song list");setErrors([...failures])}
  setProgress(`Completed. ${selected.length-failures.length} drafts saved; ${failures.length} failed.`);
  setWorking(false);
 };
 return <div className="space-y-4">
  <p className="text-sm text-zinc-300">Showing up to 20 songs without any existing Moodometer analysis. Select at most 5 per batch.</p>
  <button type="button" disabled={working||!selected.length} onClick={generate} className="rounded bg-indigo-600 px-4 py-3 font-semibold disabled:opacity-50">Generate {selected.length} draft{selected.length===1?"":"s"}</button>
  {progress&&<p role="status" className="text-sm text-indigo-200">{progress}</p>}
  {errors.map(error=><p key={error} role="alert" className="text-sm text-amber-300">{error}</p>)}
  {songs.length===0?<p>No eligible songs in the current batch.</p>:<div className="divide-y divide-zinc-700 rounded border border-zinc-700">
   {songs.map(song=><label key={song.mmid} className="flex items-center gap-3 p-3">
    <input type="checkbox" disabled={working||(!selected.includes(song.mmid)&&selected.length>=5)}
      checked={selected.includes(song.mmid)}
      onChange={event=>setSelected(previous=>event.target.checked?[...previous,song.mmid]:previous.filter(id=>id!==song.mmid))}/>
    <span className="min-w-0 flex-1"><strong>{song.songName}</strong><span className="ml-2 text-xs text-zinc-400">#{song.mmid} · {song.artistName}</span></span>
    <Link href={`/admin/songs/${song.mmid}/edit`} className="text-sm text-indigo-300 underline">Edit</Link>
   </label>)}
  </div>}
 </div>;
}
