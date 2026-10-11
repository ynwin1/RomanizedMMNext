"use client";

import {useState} from "react";

export default function PlaylistPreview({playlistId, title, locale}: {playlistId: string; title: string; locale: string}) {
  const [open, setOpen] = useState(false);
  return <div>
    <button type="button" aria-expanded={open} onClick={() => setOpen(current => !current)}
      className="inline-flex min-h-10 items-center text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-hover">
      {open ? (locale === "my" ? "နမူနာပိတ်ရန်" : "Hide preview") : (locale === "my" ? "နမူနာနားထောင်ရန်" : "Preview playlist")}
    </button>
    {open && <div className="mt-3 overflow-hidden rounded-xl border border-theme-border">
      <iframe
        title={`${title} — Spotify playlist preview`}
        src={`https://open.spotify.com/embed/playlist/${encodeURIComponent(playlistId)}`}
        width="100%" height="352" loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="block w-full border-0"
      />
    </div>}
  </div>;
}
