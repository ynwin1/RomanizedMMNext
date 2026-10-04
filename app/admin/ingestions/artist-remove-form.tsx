"use client";

import { useActionState } from "react";
import { removeDraftArtistAction } from "./ingestion-actions";

export default function ArtistRemoveForm({
  ingestionId,
  draftId,
  draftRevision,
  artistIndex,
}: {
  ingestionId: string;
  draftId: string;
  draftRevision: number;
  artistIndex: number;
}) {
  const [state, action, pending] = useActionState(
    removeDraftArtistAction.bind(
      null,
      ingestionId,
      draftId,
      draftRevision,
      artistIndex,
    ),
    {},
  );

  return <form action={action} className="mt-2">
    <button
      disabled={pending}
      className="text-sm text-red-300 underline disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
    {state.message && <p role="alert" className="mt-1 text-sm text-red-300">{state.message}</p>}
  </form>;
}
