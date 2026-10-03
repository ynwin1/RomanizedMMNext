"use client";

import { useActionState } from "react";
import type { AdminSongRequestDetail } from "@/modules/requests/application/song-request.dto";
import { updateRequestStatusAction } from "./request-actions";

const statuses = ["pending", "reviewing", "accepted", "rejected", "completed"] as const;

export default function RequestStatusForm({ request }: { request: AdminSongRequestDetail }) {
  const [state, action, pending] = useActionState(updateRequestStatusAction.bind(null, request.id, request.revision), {});
  return <form action={action} className="mt-6 flex flex-wrap items-end gap-3">
    <label className="flex flex-col gap-1">Status
      <select name="status" defaultValue={request.status} className="rounded border border-zinc-700 bg-zinc-900 p-3">
        {statuses.map(status => <option key={status} value={status}>{status}</option>)}
      </select>
    </label>
    <button disabled={pending} className="rounded bg-indigo-600 px-4 py-3 disabled:opacity-50">{pending ? "Saving…" : "Update status"}</button>
    {state.message && <p role="alert" className="w-full text-red-300">{state.message}</p>}
  </form>;
}
