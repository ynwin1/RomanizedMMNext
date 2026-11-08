"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewSongCoverAdminAction } from "@/app/admin/songs/song-cover-actions";
import type { StoredSongCover } from "@/modules/songs/application/song-cover.repository";

export default function CoverReviewControls({ cover }: { cover: StoredSongCover }) {
  const router = useRouter();
  const [title, setTitle] = useState(cover.title ?? "");
  const [description, setDescription] = useState(cover.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);

  async function review(decision: "approved" | "rejected") {
    if (busy) return;
    setBusy(true); setError("");
    try {
      await reviewSongCoverAdminAction(cover.mmid, cover.id, decision, {
        ...(title.trim() ? {title: title.trim()} : {}),
        description: description.trim(),
      });
      setConfirmReject(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not review cover. Try again.");
    } finally { setBusy(false); }
  }

  return <div className="space-y-3 border-t border-zinc-700 pt-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-zinc-300">Video title (optional)
        <input maxLength={200} value={title} onChange={event => setTitle(event.target.value)}
          className="mt-1 w-full min-w-0 rounded border border-zinc-600 bg-zinc-950 p-2" />
      </label>
      <label className="text-sm text-zinc-300">Description (optional)
        <textarea maxLength={500} rows={2} value={description}
          onChange={event => setDescription(event.target.value)}
          className="mt-1 w-full min-w-0 rounded border border-zinc-600 bg-zinc-950 p-2" />
      </label>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => review("approved")}
        className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
        {busy ? "Saving…" : "Approve & publish"}
      </button>
      {!confirmReject && <button type="button" disabled={busy} onClick={() => setConfirmReject(true)}
        className="rounded border border-rose-600 px-4 py-2 text-rose-200 disabled:opacity-50">Reject</button>}
      {confirmReject && <>
        <button type="button" disabled={busy} onClick={() => review("rejected")}
          className="rounded bg-rose-800 px-4 py-2 text-white disabled:opacity-50">Confirm rejection</button>
        <button type="button" disabled={busy} onClick={() => setConfirmReject(false)}
          className="rounded border border-zinc-600 px-4 py-2 text-zinc-100 disabled:opacity-50">Cancel</button>
      </>}
    </div>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
  </div>;
}
