"use client";

import { useState, useTransition } from "react";
import type { SpotifyTrackMetadata } from "@/integrations/spotify/spotify-metadata";
import { lookupSpotifyTrackAction } from "./spotify-lookup-action";

export default function SpotifyTrackImport({ onApply }: { onApply: (track: SpotifyTrackMetadata) => void }) {
  const [input, setInput] = useState("");
  const [track, setTrack] = useState<SpotifyTrackMetadata | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function lookup() {
    setTrack(null);
    setMessage("");
    startTransition(async () => {
      const result = await lookupSpotifyTrackAction(input);
      if (result.ok) setTrack(result.track);
      else setMessage(result.message);
    });
  }

  return <section className="rounded-xl border border-emerald-900 bg-emerald-950/10 p-4">
    <h2 className="font-semibold">Import from Spotify</h2>
    <p className="mt-1 text-sm text-zinc-400">Paste a track ID or URL. Review the result before applying; nothing is saved automatically.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <input aria-label="Spotify track ID or URL" value={input} onChange={event => setInput(event.target.value)} placeholder="Spotify track ID or URL" className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 p-3" />
      <button type="button" disabled={pending || !input.trim()} onClick={lookup} className="rounded border border-emerald-700 px-4 py-2 disabled:opacity-50">{pending ? "Looking up…" : "Find track"}</button>
    </div>
    {message && <p role="alert" className="mt-3 text-sm text-amber-300">{message}</p>}
    {track && <div className="mt-4 flex flex-wrap gap-4 rounded-lg border border-zinc-800 p-3">
      {track.imageLink && <img src={track.imageLink} alt={`${track.albumName} album artwork`} className="h-28 w-28 rounded object-contain" />}
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <p className="font-semibold">{track.name}</p>
        <p>{track.artists.map(artist => artist.name).join(", ")}</p>
        <p className="text-zinc-400">{track.albumName} · {track.releaseDate}</p>
        <p className="text-zinc-400">Genre suggestions: {track.genres.join(", ") || "Not provided"}</p>
        {track.isrc && <p className="text-zinc-400">ISRC: {track.isrc}</p>}
        <a href={track.spotifyLink} target="_blank" rel="noopener noreferrer" className="inline-block text-emerald-300 underline">View on Spotify</a>
        <div><button type="button" onClick={() => onApply(track)} className="mt-2 rounded bg-emerald-700 px-4 py-2 font-medium">Apply metadata to form</button></div>
      </div>
    </div>}
    <p className="mt-2 text-xs text-zinc-500">Spotify genres are artist-level suggestions. Verify artist matches and localized titles. Artwork remains attributed to Spotify.</p>
  </section>;
}
