"use client";

import { useActionState } from "react";
import { confirmDraftArtistsAction } from "./ingestion-actions";

export default function ArtistConfirmForm({
  ingestionId,
  draftId,
}: {
  ingestionId: string;
  draftId: string;
}) {
  const [state, action, pending] = useActionState(
    confirmDraftArtistsAction.bind(null, ingestionId, draftId),
    {},
  );

  return <form action={action} className="mt-5">
    <button
      disabled={pending}
      className="rounded bg-emerald-600 px-5 py-3 font-medium disabled:opacity-50"
    >
      {pending ? "Confirming…" : "Confirm artist list"}
    </button>
    {state.message && <p role="alert" className="mt-2 text-sm text-red-300">{state.message}</p>}
  </form>;
}
