"use client";

import { useActionState } from "react";
import type { ContentDraftRecord } from "@/modules/content-drafts/domain/content-draft.types";
import type { IngestionRecord } from "@/modules/ingestions/domain/ingestion.types";
import { saveIngestionSourceAction } from "./ingestion-actions";

export default function SourceForm({ ingestion, draft }: {
  ingestion: IngestionRecord;
  draft: ContentDraftRecord;
}) {
  const [state, action, pending] = useActionState(
    saveIngestionSourceAction.bind(null, ingestion.id, ingestion.revision, draft.revision),
    {},
  );

  return <form action={action} className="mt-6 space-y-4">
    <label className="block">
      <span className="mb-2 block font-medium">Trusted Burmese lyrics</span>
      <textarea
        name="burmeseLyrics"
        required
        rows={18}
        defaultValue={draft.source.burmeseLyrics ?? ""}
        className="w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100"
        aria-invalid={!!state.errors?.burmeseLyrics}
      />
      {state.errors?.burmeseLyrics?.map((message, index) =>
        <p key={index} className="mt-1 text-sm text-red-300">{message}</p>)}
    </label>
    <p className="text-sm text-zinc-400">
      Confirming this source advances the ingestion to ready_to_generate. AI generation is added in the next phases.
    </p>
    <button disabled={pending} className="rounded bg-indigo-600 px-5 py-3 font-medium disabled:opacity-50">
      {pending ? "Saving…" : "Save and confirm source"}
    </button>
    {state.message && <p role="alert" className="text-red-300">{state.message}</p>}
  </form>;
}
