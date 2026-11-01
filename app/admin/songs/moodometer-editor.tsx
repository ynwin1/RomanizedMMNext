"use client";
import {useCallback, useEffect, useState} from "react";
import type {MoodometerAnalysis} from "@/modules/songs/domain/moodometer.types";
import {MOOD_IDS} from "@/modules/songs/domain/moodometer.types";
import type {MoodometerRecord} from "@/modules/songs/application/moodometer.service";
import {analyzeSongMoodAction} from "./moodometer-actions";
import {getMoodometerHistoryAction,publishMoodometerAction,saveMoodometerDraftAction} from "./moodometer-storage-actions";

export default function MoodometerEditor({mmid}:{mmid:number}) {
 const [draft,setDraft]=useState<MoodometerAnalysis|null>(null);
 const [history,setHistory]=useState<MoodometerRecord[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [dirty,setDirty]=useState(false);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const reload=useCallback(async()=>setHistory(await getMoodometerHistoryAction(mmid)),[mmid]);
 useEffect(()=>{let active=true;getMoodometerHistoryAction(mmid).then(records=>{if(active)setHistory(records)}).catch(error=>{if(active)setMessage(String(error))});return()=>{active=false}},[mmid]);
 useEffect(()=>{
  const listener=(event:BeforeUnloadEvent)=>{if(dirty)event.preventDefault()};
  window.addEventListener("beforeunload",listener);
  return()=>window.removeEventListener("beforeunload",listener);
 },[dirty]);
 const run=async(action:()=>Promise<void>)=>{
  setBusy(true);setMessage("");
  try{await action()}catch(error){setMessage(error instanceof Error?error.message:"Request failed")}
  finally{setBusy(false)}
 };
 const analyze=()=>run(async()=>{
  if(dirty && !window.confirm("Discard unsaved mood edits?"))return;
  const result=await analyzeSongMoodAction(mmid);
  setDraft(result);setSelectedId(null);setDirty(true);
  setMessage("Analysis generated. Review all three scores, then save draft.");
 });
 const update=(index:number,score:number)=>{setDraft(previous=>previous?{
  ...previous,moods:previous.moods.map((m,i)=>i===index?{...m,score}:m)
 }:previous);setDirty(true)};
 const save=()=>run(async()=>{
  if(!draft)return;
  const normalized={...draft,moods:[...draft.moods].sort((a,b)=>b.score-a.score),status:"draft" as const};
  const saved=await saveMoodometerDraftAction(mmid,normalized);
  setDraft(saved.analysis);setSelectedId(saved.id);setDirty(false);
  await reload();setMessage("Mood analysis saved as draft.");
 });
 const publish=(id:string)=>run(async()=>{
  if(dirty && !window.confirm("You have unsaved edits. Publish the previously saved version?"))return;
  const result=await publishMoodometerAction(mmid,id);
  if(!result)throw new Error("Analysis not found");
  await reload();setMessage("Moodometer published.");
 });
 return <div className="space-y-5">
  <div className="flex flex-wrap gap-3">
    <button type="button" disabled={busy} onClick={analyze} className="rounded bg-indigo-600 px-4 py-3 font-medium text-white disabled:opacity-50">{busy?"Working…":"Analyze Mood with AI"}</button>
    {draft && <button type="button" disabled={busy || !dirty} onClick={save} className="rounded border border-indigo-500 px-4 py-3 font-medium disabled:opacity-50">Save Draft</button>}
    {selectedId && !dirty && <button type="button" disabled={busy} onClick={()=>publish(selectedId)} className="rounded border border-emerald-500 px-4 py-3 text-emerald-300 disabled:opacity-50">Publish</button>}
  </div>
  {message && <p role="status" className="text-sm text-amber-200">{message}</p>}
  {draft && <div className="space-y-4 rounded border border-zinc-700 bg-zinc-900 p-4">
    <h2 className="text-lg font-semibold">Review analysis {dirty?"(unsaved)":""}</h2>
    {draft.moods.map((mood,index)=><div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr]">
      <label className="text-sm">Mood
        <select value={mood.moodId} onChange={event=>{setDraft(previous=>previous?{...previous,moods:previous.moods.map((m,i)=>i===index?{...m,moodId:event.target.value as typeof m.moodId}:m)}:previous);setDirty(true)}} className="mt-1 block w-full rounded border border-zinc-600 bg-zinc-950 p-2">
          {MOOD_IDS.map(id=><option key={id} value={id}>{id}</option>)}
        </select>
      </label>
      <label className="text-sm">Score (0.0–10.0)
        <input type="number" min={0} max={10} step={0.1} value={mood.score} onChange={event=>update(index,Number(event.target.value))} className="mt-1 block w-full rounded border border-zinc-600 bg-zinc-950 p-2"/>
      </label>
    </div>)}
    <label className="block text-sm">Explanation
      <textarea rows={3} maxLength={500} value={draft.summary} onChange={event=>{setDraft({...draft,summary:event.target.value});setDirty(true)}} className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 p-2"/>
    </label>
    <p className="text-xs text-zinc-400">Scores are independent, do not need to total 10, and are sorted before saving. Published results require a saved draft.</p>
  </div>}
  <div className="space-y-3">
    <h2 className="text-lg font-semibold">Saved analyses</h2>
    {history.length===0?<p className="text-sm text-zinc-400">No saved analyses yet.</p>:history.map(record=><div key={record.id} className="rounded border border-zinc-700 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><strong>{record.analysis.moods.map(m=>`${m.moodId} ${m.score.toFixed(1)}`).join(" · ")}</strong>
          <p className="text-xs text-zinc-400">{record.analysis.status} · {new Date(record.createdAt).toLocaleString()} · {record.analysis.modelVersion}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={()=>{if(dirty&&!window.confirm("Discard unsaved edits?"))return;setDraft({...record.analysis,status:"draft"});setSelectedId(record.id);setDirty(false)}} className="rounded border border-zinc-500 px-3 py-2 text-sm">Review</button>
          {record.analysis.status!=="published" && <button type="button" disabled={busy} onClick={()=>publish(record.id)} className="rounded border border-emerald-500 px-3 py-2 text-sm text-emerald-300">Publish</button>}
        </div>
      </div>
    </div>)}
  </div>
 </div>;
}
