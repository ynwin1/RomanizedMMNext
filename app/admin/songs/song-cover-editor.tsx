"use client";

import { useState, useTransition } from "react";
import {
  addSongCoverAdminAction,
} from "./song-cover-actions";
import { parseYouTubeVideoId } from "@/modules/songs/application/song-cover.youtube";
import type { StoredSongCover } from "@/modules/songs/application/song-cover.repository";

const control = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-400 focus:outline-none";

export default function SongCoverEditor({ mmid, initialCovers }: {
  mmid: number;
  initialCovers: StoredSongCover[];
}) {
  const [covers, setCovers] = useState(initialCovers);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const parsedId = parseYouTubeVideoId(youtubeUrl);

  function addCover(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!parsedId) {
      setError("Paste a valid YouTube video link.");
      return;
    }
    startTransition(async () => {
      try {
        const added = await addSongCoverAdminAction(mmid, {
          youtubeUrl,
          ...(description.trim() ? { description: description.trim() } : {}),
        });
        setCovers(previous => [...previous, added]);
        setYoutubeUrl("");
        setDescription("");
        setMessage("Cover added. It is approved and ready for the public carousel when that feature launches.");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to add cover. Try again.");
      }
    });
  }

  return <div className="space-y-6">
    <form onSubmit={addCover} className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-900/30 p-4">
      <h3 className="text-lg font-semibold">Add a YouTube cover</h3>
      <label htmlFor="cover-youtube-url" className="block space-y-1 text-sm">
        <span>YouTube URL <span className="text-rose-300">*</span></span>
        <input
          id="cover-youtube-url"
          type="url"
          required
          maxLength={2048}
          value={youtubeUrl}
          onChange={event => setYoutubeUrl(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className={control}
        />
      </label>
      {parsedId && <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
        <span className="rounded bg-zinc-800 px-2 py-1">YouTube video recognized</span>
        <a className="text-indigo-300 underline hover:text-indigo-200" href={`https://www.youtube.com/watch?v=${parsedId}`} target="_blank" rel="noopener noreferrer">Preview on YouTube</a>
      </div>}
      <label htmlFor="cover-description" className="block space-y-1 text-sm">
        <span>Description <span className="text-zinc-400">(optional)</span></span>
        <textarea
          id="cover-description"
          rows={2}
          maxLength={500}
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder="e.g. Acoustic vocal cover, guitar instrumental, piano arrangement"
          className={control}
        />
      </label>
      <button type="submit" disabled={pending || !parsedId} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
        {pending ? "Adding cover…" : "Add cover"}
      </button>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    </form>

    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Existing covers <span className="text-sm font-normal text-zinc-400">({covers.length})</span></h3>
      {covers.length === 0 ? <p className="rounded-lg border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
        No covers for this song yet. Add a YouTube video above to start the collection.
      </p> : <ul className="space-y-3">
        {covers.map(cover => <li key={cover.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-zinc-700 p-3 sm:flex-row sm:items-center">
          <a
            href={`https://www.youtube.com/watch?v=${cover.youtubeVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-zinc-800 sm:w-36"
            aria-label={`Preview YouTube cover ${cover.title || cover.youtubeVideoId}`}
          >
            {/* YouTube-generated thumbnails require no metadata API key. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${cover.youtubeVideoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </a>
          <div className="min-w-0 flex-1 space-y-1">
            <a href={`https://www.youtube.com/watch?v=${cover.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
              className="break-words font-medium text-indigo-300 underline-offset-2 hover:underline">
              {cover.title || `YouTube video · ${cover.youtubeVideoId}`}
            </a>
            {cover.description && <p className="break-words text-sm text-zinc-300">{cover.description}</p>}
            <p className="text-xs text-zinc-400">{cover.source === "admin" ? "Added by admin" : "Community suggestion"} · {cover.status}</p>
          </div>
        </li>)}
      </ul>}
      <p className="text-xs text-zinc-500">Editing, removal, and reordering controls will be added in P2.3. Public carousel display arrives in P3.</p>
    </div>
  </div>;
}
