"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {reviewPlaylistSubmissionAction} from "./actions";

export default function ReviewButtons({id}: {id: string}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(decision: "approved" | "rejected") {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await reviewPlaylistSubmissionAction(id, decision);
      if (result.error) setError(result.error);
      else router.refresh();
    } catch { setError("Review failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-wrap items-center gap-2">
    <button type="button" disabled={busy} onClick={() => decide("approved")} className="rounded bg-emerald-700 px-3 py-2 font-semibold text-white disabled:opacity-50">Approve & publish</button>
    <button type="button" disabled={busy} onClick={() => decide("rejected")} className="rounded border border-red-500 px-3 py-2 text-red-300 disabled:opacity-50">Reject</button>
    {error && <p role="alert" className="w-full text-red-400">{error}</p>}
  </div>;
}
