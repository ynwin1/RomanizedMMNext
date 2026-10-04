"use client";

import { useActionState } from "react";
import type { ContentDraftRecord } from "@/modules/content-drafts";
import { saveIngestionMetadataAction } from "./ingestion-actions";

export default function MetadataForm({ ingestionId, draft }: {
  ingestionId: string;
  draft: ContentDraftRecord;
}) {
  const [state, action, pending] = useActionState(
    saveIngestionMetadataAction.bind(null, ingestionId, draft.id, draft.revision),
    {},
  );

  const fieldClass = "mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100";

  return <form action={action} className="mt-6 rounded-xl border border-zinc-800 p-4">
    <h2 className="text-xl font-semibold">Factual metadata</h2>
    <p className="mt-1 text-sm text-zinc-400">Genre is required. Other fields are optional and can be cleared.</p>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Genre *</span>
      <input name="genre" defaultValue={draft.metadata.genre || ""} required className={fieldClass} />
      {state.errors?.genre?.map(error => <span key={error} className="mt-1 block text-sm text-red-300">{error}</span>)}
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Album</span>
      <input name="albumName" defaultValue={draft.metadata.albumName || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Spotify track ID</span>
      <input name="spotifyTrackId" defaultValue={draft.metadata.spotifyTrackId || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Spotify link</span>
      <input name="spotifyLink" type="url" defaultValue={draft.metadata.spotifyLink || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Apple Music link</span>
      <input name="appleMusicLink" type="url" defaultValue={draft.metadata.appleMusicLink || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">YouTube links</span>
      <textarea
        name="youtubeLinks"
        rows={4}
        defaultValue={(draft.metadata.youtubeLinks || []).join("\n")}
        placeholder="One URL per line"
        className={fieldClass}
      />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Image link</span>
      <input name="imageLink" type="url" defaultValue={draft.metadata.imageLink || ""} className={fieldClass} />
    </label>

    {state.message && <p role="alert" className="mt-4 text-red-300">{state.message}</p>}

    <button
      disabled={pending}
      className="mt-5 rounded bg-violet-600 px-5 py-3 font-medium disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save factual metadata"}
    </button>
  </form>;
}
