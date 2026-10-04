"use client";

import { useActionState } from "react";
import type { AdminSongRequestDetail } from "@/modules/requests/application/song-request.dto";
import { decideRequestAction } from "./request-actions";

export default function RequestDecisionForm({ request }: { request: AdminSongRequestDetail }) {
  const [state, action, pending] = useActionState(
    decideRequestAction.bind(null, request.id, request.revision),
    {},
  );

  return <form action={action} className="mt-6 flex flex-wrap gap-3">
    <button
      name="decision"
      value="accept"
      disabled={pending}
      className="rounded bg-emerald-600 px-5 py-3 font-medium disabled:opacity-50"
    >
      {pending ? "Working…" : "Accept request"}
    </button>
    <button
      name="decision"
      value="reject"
      disabled={pending}
      className="rounded bg-red-700 px-5 py-3 font-medium disabled:opacity-50"
    >
      Reject request
    </button>
    {state.message && <p role="alert" className="w-full text-red-300">{state.message}</p>}
  </form>;
}
