"use client";

import { useActionState } from "react";
import { reopenDraftAdminInputAction } from "./ingestion-actions";

export default function AdminInputReopenForm({
  ingestionId,
  draftId,
}: {
  ingestionId: string;
  draftId: string;
}) {
  const [state, action, pending] = useActionState(
    reopenDraftAdminInputAction.bind(null, ingestionId, draftId),
    {},
  );

  return <form action={action} className="mt-4">
    <button
      disabled={pending}
      className="rounded border border-zinc-700 px-4 py-2 disabled:opacity-50"
    >
      {pending ? "Reopening…" : "Edit admin input"}
    </button>
    {state.message && <p role="alert" className="mt-2 text-sm text-red-300">{state.message}</p>}
  </form>;
}
