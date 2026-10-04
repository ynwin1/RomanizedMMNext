"use client";

import { useActionState } from "react";
import type { ContentDraftRecord } from "@/modules/content-drafts";
import { saveIngestionReviewAction } from "./ingestion-actions";

export default function ReviewForm({
  ingestionId,
  draft,
}: {
  ingestionId: string;
  draft: ContentDraftRecord;
}) {
  const [state, action, pending] = useActionState(
    saveIngestionReviewAction.bind(null, ingestionId, draft.id, draft.revision),
    {},
  );

  const fieldClass = "mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100";

  return <form action={action} className="mt-6 rounded-xl border border-zinc-800 p-4">
    <h2 className="text-xl font-semibold">Final review</h2>
    <p className="mt-1 text-sm text-zinc-400">
      Review and polish everything here. Saving does not publish the song.
    </p>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Song name *</span>
      <input name="songName" required defaultValue={draft.identity.songName || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Burmese lyrics *</span>
      <textarea name="burmeseLyrics" required rows={14} defaultValue={draft.source.burmeseLyrics || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Romanization *</span>
      <textarea name="romanized" required rows={14} defaultValue={draft.generated.romanized || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">English meaning *</span>
      <textarea name="meaning" required rows={14} defaultValue={draft.generated.meaning || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">About *</span>
      <input name="about" required defaultValue={draft.generated.about || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">When to listen *</span>
      <input name="whenToListen" required defaultValue={draft.generated.whenToListen || ""} className={fieldClass} />
    </label>

    <label className="mt-4 block">
      <span className="text-sm text-zinc-300">Genre</span>
      <input name="genre" defaultValue={draft.metadata.genre || ""} className={fieldClass} />
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
      {pending ? "Saving review…" : "Save review changes"}
    </button>
  </form>;
}
