"use client";

import { useActionState } from "react";
import { generateAiContentAction } from "./ingestion-actions";

export default function GenerationForm({ ingestionId, retry = false }: {
  ingestionId: string;
  retry?: boolean;
}) {
  const [state, action, pending] = useActionState(
    generateAiContentAction.bind(null, ingestionId),
    {},
  );

  return <form action={action} className="mt-6">
    <button
      disabled={pending}
      className="rounded bg-violet-600 px-5 py-3 font-medium disabled:opacity-50"
    >
      {pending ? "Generating AI content…" : retry ? "Retry AI generation" : "Generate AI content"}
    </button>
    {state.message && <p role="alert" className="mt-3 text-red-300">{state.message}</p>}
  </form>;
}
