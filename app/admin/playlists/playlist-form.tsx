"use client";

import Link from "next/link";
import {useActionState, useState, useTransition} from "react";
import {PLAYLIST_GENRES, type PlaylistEntity} from "@/modules/playlists/domain/playlist.types";
import {lookupSpotifyPlaylistAction} from "./spotify-playlist-lookup";
import {createPlaylistAction, updatePlaylistAction, changePlaylistStatusAction} from "./playlist-actions";

const fieldClass = "mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100";
const genreLabels: Record<string, string> = {
  pop: "Pop", rock: "Rock", "hip-hop-rap": "Hip-Hop / Rap", "rnb-soul": "R&B / Soul",
  "indie-alternative": "Indie / Alternative", "traditional-classical": "Traditional / Classical",
  "jazz-blues": "Jazz / Blues", "electronic-edm": "Electronic / EDM",
};

function PublicationControls({playlist}: {playlist: PlaylistEntity}) {
  const action = changePlaylistStatusAction.bind(null, playlist.id, playlist.revision);
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="mt-8 rounded-lg border border-zinc-700 p-4">
    <h2 className="font-semibold">Publication</h2>
    <p className="mt-1 text-sm text-zinc-400">Current status: <strong className="text-zinc-100">{playlist.status}</strong>. Only published playlists will appear publicly in P3.</p>
    {state.message && <p role="alert" className="mt-3 text-sm text-amber-300">{state.message}</p>}
    <div className="mt-4 flex flex-wrap gap-2">
      {(["draft", "published", "archived"] as const).filter(status => status !== playlist.status).map(status =>
        <button key={status} type="submit" name="status" value={status} disabled={pending}
          className="rounded border border-indigo-600 px-4 py-2 font-medium capitalize hover:bg-indigo-900/30 disabled:opacity-50">
          {status === "published" ? "Publish" : status === "archived" ? "Archive" : "Move to draft"}
        </button>)}
    </div>
  </form>;
}

export default function PlaylistForm({playlist}: {playlist?: PlaylistEntity}) {
  const [url, setUrl] = useState(playlist?.url ?? "");
  const [title, setTitle] = useState(playlist?.title ?? "");
  const [description, setDescription] = useState(playlist?.description ?? "");
  const [imageUrl, setImageUrl] = useState(playlist?.imageUrl ?? "");
  const [curator, setCurator] = useState(playlist?.curator ?? "");
  const [lookupError, setLookupError] = useState("");
  const [lookupPending, beginLookup] = useTransition();
  const action = playlist ? updatePlaylistAction.bind(null, playlist.id, playlist.revision) : createPlaylistAction;
  const [state, formAction, pending] = useActionState(action, {});
  const errors = (name: string) => state.errors?.[name]?.map((error, i) =>
    <p key={i} className="mt-1 text-sm text-red-300">{error}</p>);

  function lookup() {
    setLookupError("");
    beginLookup(async () => {
      const result = await lookupSpotifyPlaylistAction(url);
      if (!result.ok) {setLookupError(result.message); return;}
      setUrl(result.playlist.url);
      setTitle(result.playlist.title);
      setDescription(result.playlist.description ?? "");
      setImageUrl(result.playlist.imageUrl ?? "");
      setCurator(result.playlist.curator ?? "");
    });
  }

  return <>
    <section className="mt-6 rounded-xl border border-emerald-900 bg-emerald-950/10 p-4">
      <h2 className="font-semibold">Import from Spotify</h2>
      <p className="mt-1 text-sm text-zinc-400">Paste a public playlist URL. Import fills the form only; review it before saving.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input type="url" aria-label="Spotify playlist URL for import" value={url} onChange={event => setUrl(event.target.value)}
          placeholder="https://open.spotify.com/playlist/..." className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 p-3" />
        <button type="button" disabled={lookupPending || !url.trim()} onClick={lookup}
          className="rounded border border-emerald-700 px-4 py-2 disabled:opacity-50">{lookupPending ? "Importing…" : "Import metadata"}</button>
      </div>
      {lookupError && <p role="alert" className="mt-3 text-sm text-amber-300">{lookupError}</p>}
    </section>

    <form action={formAction} className="mt-6 space-y-5">
      {state.message && <div role="alert" className="rounded border border-red-400 bg-red-950/30 p-4">{state.message}</div>}
      <fieldset disabled={pending} className="space-y-5">
        <input type="hidden" name="url" value={url} />
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">Title <span className="text-zinc-400">(required)</span>
            <input name="title" required value={title} onChange={event => setTitle(event.target.value)} className={fieldClass} aria-invalid={!!state.errors?.title} />
            {errors("title")}
          </label>
          <label className="block">Curator
            <input name="curator" value={curator} onChange={event => setCurator(event.target.value)} className={fieldClass} />
            {errors("curator")}
          </label>
          <label className="block">Featured order <span className="text-zinc-400">(lower is first)</span>
            <input name="sortOrder" type="number" min={0} max={10000} defaultValue={playlist?.sortOrder ?? 0} className={fieldClass} />
            {errors("sortOrder")}
          </label>
          <label className="block md:col-span-2">Artwork URL
            <input name="imageUrl" type="url" value={imageUrl} onChange={event => setImageUrl(event.target.value)} className={fieldClass} />
            {errors("imageUrl")}
          </label>
          {imageUrl.startsWith("https://") && <div className="md:col-span-2"><img src={imageUrl} alt="Playlist artwork preview" className="h-28 w-28 rounded object-cover" /></div>}
        </div>
        <label className="block">Description
          <textarea name="description" rows={4} maxLength={1200} value={description} onChange={event => setDescription(event.target.value)} className={fieldClass} />
          {errors("description")}
        </label>
        <fieldset className="rounded-lg border border-zinc-700 p-4">
          <legend className="px-1 font-semibold">Genres <span className="text-sm font-normal text-zinc-400">(choose 1–3)</span></legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {PLAYLIST_GENRES.map(genre => <label key={genre} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="genres" value={genre} defaultChecked={playlist?.genres.includes(genre)} className="h-4 w-4 accent-indigo-500" />
              {genreLabels[genre]}
            </label>)}
          </div>
          {errors("genres")}
        </fieldset>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="rounded bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50">
            {pending ? "Saving…" : playlist ? "Save changes" : "Create draft"}
          </button>
          <Link href="/admin/playlists" className="underline">Back to playlists</Link>
          {playlist && <a href={playlist.url} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">View on Spotify ↗</a>}
        </div>
      </fieldset>
    </form>
    {playlist && <PublicationControls playlist={playlist} />}
  </>;
}
