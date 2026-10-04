"use client";

import { useActionState } from "react";
import { addDraftArtistAction } from "./ingestion-actions";

export default function ArtistAddForm({
  ingestionId,
  draftId,
  draftRevision,
}: {
  ingestionId: string;
  draftId: string;
  draftRevision: number;
}) {
  const [state, action, pending] = useActionState(
    addDraftArtistAction.bind(null, ingestionId, draftId, draftRevision),
    {},
  );

  return <form action={action} className="mt-5 rounded border border-zinc-800 p-3">
    <label className="block">
      <span className="text-sm text-zinc-300">Add another artist</span>
      <div className="mt-2 flex gap-2">
        <input
          name="artistName"
          placeholder="Artist name"
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
        />
        <button
          disabled={pending}
          className="rounded bg-violet-600 px-4 py-2 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add artist"}
        </button>
      </div>
    </label>
    {state.message && <p role="alert" className="mt-2 text-sm text-red-300">{state.message}</p>}
  </form>;
}
