"use client";

import { useActionState } from "react";
import { startIngestionAction } from "../ingestions/ingestion-actions";

export default function StartIngestionForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(startIngestionAction.bind(null, requestId), {});
  return <form action={action} className="mt-6">
    <button disabled={pending} className="rounded bg-emerald-600 px-4 py-3 font-medium disabled:opacity-50">
      {pending ? "Starting…" : "Start ingestion"}
    </button>
    {state.message && <p role="alert" className="mt-3 text-red-300">{state.message}</p>}
  </form>;
}
