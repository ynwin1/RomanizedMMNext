"use client";

import { useActionState } from "react";
import type { AdminArtistRecord } from "@/modules/artists";
import { resolveDraftArtistAction } from "./ingestion-actions";

export default function ArtistResolutionForm({
  ingestionId,
  draftId,
  draftRevision,
  artistIndex,
  candidates,
}: {
  ingestionId: string;
  draftId: string;
  draftRevision: number;
  artistIndex: number;
  candidates: AdminArtistRecord[];
}) {
  const [state, action, pending] = useActionState(
    resolveDraftArtistAction.bind(
      null,
      ingestionId,
      draftId,
      draftRevision,
      artistIndex,
    ),
    {},
  );

  return <form action={action} className="mt-3 space-y-2">
    {candidates.map(candidate =>
      <button
        key={candidate.slug}
        name="artistSlug"
        value={candidate.slug}
        disabled={pending}
        className="block w-full rounded border border-zinc-700 px-3 py-2 text-left hover:bg-zinc-900 disabled:opacity-50"
      >
        <span className="font-medium">{candidate.name}</span>
        <span className="ml-2 text-sm text-zinc-400">({candidate.slug} · {candidate.type})</span>
      </button>
    )}
    {state.message && <p role="alert" className="text-sm text-red-300">{state.message}</p>}
  </form>;
}
