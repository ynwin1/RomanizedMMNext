"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type ReactPlayer from "react-player";
import type { LyricsV2 } from "@/modules/songs/domain/lyrics-v2.types";
import type { LyricTimingLine, LyricTimingTrack } from "@/modules/songs/domain/lyric-timing.types";
import { getLyricTimingAction, saveLyricTimingAction } from "./lyric-timing-actions";
import { draftTimingLines, secondsToMilliseconds, nudgeTime, activeTimingIndex, validateDraftTimes } from "./timing-editor-data";

const VideoPlayer = dynamic(() => import("react-player"), {ssr: false});
type Recording = {videoId: string; url: string};
type Row = {entryIndex: number; burmese: string; romanized: string};

export default function TimingEditor({mmid, fingerprint, lyrics, recordings}: {
  mmid: number; fingerprint: string; lyrics: LyricsV2; recordings: Recording[];
}) {
  const [videoId, setVideoId] = useState(recordings[0].videoId);
  const [times, setTimes] = useState<Record<number, {startMs?: number; endMs?: number}>>({});
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const player = useRef<ReactPlayer>(null);
  const rows: Row[] = useMemo(() => lyrics.entries.flatMap((entry, index) =>
    entry.kind === "line" ? [{entryIndex: index, burmese: entry.burmese, romanized: entry.romanized}] : []), [lyrics]);
  const validationErrors = useMemo(() => validateDraftTimes(times), [times]);
  const completedLines = useMemo(() => draftTimingLines(times), [times]);
  const activeIndex = activeTimingIndex(completedLines, Math.round(seconds * 1000));
  const recording = recordings.find(item => item.videoId === videoId) ?? recordings[0];

  useEffect(() => {
    let active = true;
    setBusy(true);
    setMessage("");
    setTimes({});
    setDirty(false);
    getLyricTimingAction(mmid, videoId).then(track => {
      if (!active) return;
      setTimes(Object.fromEntries((track?.lines ?? []).map(line =>
        [line.entryIndex, {startMs: line.startMs, endMs: line.endMs}])));
      setMessage(track ? `Loaded ${track.status} timing track.` : "No timing draft yet.");
    }).catch(error => {
      if (active) setMessage(error instanceof Error ? error.message : "Failed to load timings.");
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [mmid, videoId]);

  function change(index: number, field: "startMs" | "endMs", value: number | undefined) {
    setTimes(previous => ({...previous, [index]: {...previous[index], [field]: value}}));
    setDirty(true);
    setMessage("");
  }
  function capture(index: number, field: "startMs" | "endMs") {
    change(index, field, secondsToMilliseconds(seconds));
  }
  function seek(startMs: number | undefined) {
    if (startMs !== undefined) player.current?.seekTo(startMs / 1000, "seconds");
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      if (validationErrors.length) throw new Error("Correct incomplete or invalid timing rows before saving.");
      const lines: LyricTimingLine[] = draftTimingLines(times);
      const track: LyricTimingTrack = {
        version: 1, youtubeVideoId: videoId, lyricsFingerprint: fingerprint, status: "draft", lines,
      };
      await saveLyricTimingAction(mmid, track);
      setDirty(false);
      setMessage(`Draft saved (${lines.length}/${rows.length} lines). Publication comes in a later phase.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't save timing draft.");
    } finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <div className="rounded border border-zinc-700 bg-zinc-900 p-4 text-sm" aria-live="polite">
      <strong>Timing preview:</strong> {completedLines.length}/{rows.length} lines complete.
      {activeIndex !== null ? <span className="ml-2 text-emerald-300">Now playing line {rows.findIndex(row => row.entryIndex === activeIndex) + 1}</span> :
        <span className="ml-2 text-zinc-400">Instrumental or unsynchronized section</span>}
      {validationErrors.length > 0 && <ul className="mt-2 list-disc pl-5 text-amber-300">{validationErrors.map(error => <li key={error}>{error}</li>)}</ul>}
    </div>
    <label className="block max-w-xl text-sm font-medium">YouTube recording
      <select value={videoId} onChange={event => {
        if (dirty && !window.confirm("Discard unsaved timing changes?")) return;
        setVideoId(event.target.value);
        setSeconds(0);
      }} className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 p-3">
        {recordings.map((item, index) => <option key={item.videoId} value={item.videoId}>Recording {index + 1} — {item.videoId}</option>)}
      </select>
    </label>
    <div className="max-w-3xl space-y-2">
      <div className="aspect-video overflow-hidden rounded border border-zinc-700 bg-black">
        <VideoPlayer key={videoId} url={recording.url} controls width="100%" height="100%"
          ref={player} onProgress={state => setSeconds(state.playedSeconds)} />
      </div>
      <p className="text-sm text-zinc-400">Current playback: <strong className="text-zinc-100">{seconds.toFixed(2)}s</strong>. Play the video, then capture the start and end of each line.</p>
    </div>
    <div className="space-y-3">
      {rows.map((row, n) => {
        const timing = times[row.entryIndex] ?? {};
        return <div key={row.entryIndex} className={`rounded border p-3 sm:p-4 ${activeIndex === row.entryIndex ? "border-emerald-500 bg-emerald-950/30" : "border-zinc-700"}`}>
          <div className="mb-3">
            <span className="text-xs text-zinc-400">Line {n + 1}</span>
            <p className="mt-1 text-base">{row.burmese}</p>
            <p className="text-sm text-zinc-400">{row.romanized}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {(["startMs", "endMs"] as const).map(field => <label key={field} className="min-w-28 flex-1 text-sm">
              {field === "startMs" ? "Start (seconds)" : "End (seconds)"}
              <input type="number" min="0" step=".01"
                className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 p-2"
                value={timing[field] === undefined ? "" : timing[field] / 1000}
                onChange={event => change(row.entryIndex, field, event.target.value === "" ? undefined : secondsToMilliseconds(Number(event.target.value)))}/>
            </label>)}
            <button type="button" onClick={() => capture(row.entryIndex, "startMs")}
              className="rounded border border-zinc-600 px-3 py-2 text-sm hover:bg-zinc-800">Capture start</button>
            <button type="button" onClick={() => capture(row.entryIndex, "endMs")}
              className="rounded border border-zinc-600 px-3 py-2 text-sm hover:bg-zinc-800">Capture end</button>
            {(["startMs", "endMs"] as const).map(field => <span key={field} className="flex items-center gap-1 text-xs">
              <span>{field === "startMs" ? "Start" : "End"}</span>
              {([-100, 100] as const).map(delta => <button key={delta} type="button"
                disabled={timing[field] === undefined}
                onClick={() => change(row.entryIndex, field, nudgeTime(timing[field], delta))}
                className="rounded border border-zinc-600 px-2 py-2 disabled:opacity-40"
                aria-label={`${delta < 0 ? "Move earlier" : "Move later"} ${field === "startMs" ? "start" : "end"} of line ${n + 1} by 0.1 seconds`}>
                  {delta < 0 ? "−0.1s" : "+0.1s"}
                </button>)}
            </span>)}
            <button type="button" onClick={() => seek(timing.startMs)} disabled={timing.startMs === undefined}
              className="rounded border border-zinc-600 px-3 py-2 text-sm disabled:opacity-40">Seek</button>
          </div>
        </div>;
      })}
    </div>
    <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t border-zinc-700 bg-zinc-950 p-4">
      <button type="button" disabled={busy || validationErrors.length > 0} onClick={save}
        className="rounded bg-indigo-600 px-5 py-3 font-medium text-white disabled:opacity-50">{busy ? "Working…" : "Save draft"}</button>
      {dirty && <span className="text-sm text-amber-300">Unsaved edits</span>}
      {message && <span role="status" className="text-sm text-zinc-300">{message}</span>}
    </div>
  </div>;
}
