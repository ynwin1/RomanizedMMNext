"use client";

import {useState, type FormEvent} from "react";
import {PLAYLIST_GENRES, type PlaylistGenre} from "@/modules/playlists/domain/playlist.types";

const labels: Record<PlaylistGenre, string> = {
  pop: "Pop", rock: "Rock", "hip-hop-rap": "Hip-Hop & Rap", "rnb-soul": "R&B & Soul",
  "indie-alternative": "Indie & Alternative", "traditional-classical": "Traditional & Classical",
  "jazz-blues": "Jazz & Blues", "electronic-edm": "Electronic & EDM",
};

export default function PlaylistSubmissionForm({locale}: {locale: string}) {
  const my = locale === "my";
  const [open, setOpen] = useState(false);
  const [playlistId, setPlaylistId] = useState("");
  const [genre, setGenre] = useState<PlaylistGenre>("pop");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch("/api/playlist-submissions", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({playlistId, genre}),
      });
      const result = await response.json() as {message?: string; error?: string};
      if (!response.ok) throw new Error(result.error || "Submission failed");
      setFeedback(my ? "ကျေးဇူးတင်ပါတယ်။ Playlist ကို စစ်ဆေးရန် ပို့ပြီးပါပြီ။" : result.message || "Submitted for review!");
      setSuccess(true);
      setPlaylistId("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Please try again.");
      setSuccess(false);
    } finally { setBusy(false); }
  }

  return <section className="mt-16 rounded-2xl border border-theme-border bg-surface p-6 sm:p-9" aria-labelledby="submit-playlist-title">
    <h2 id="submit-playlist-title" className="text-2xl font-bold">{my ? "ကောင်းတဲ့ Playlist တစ်ခု သိထားလား?" : "Know a great Burmese music playlist?"}</h2>
    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{my
      ? "ဒီမှာ ဖော်ပြသင့်တဲ့ Spotify Playlist ရှိရင် အကြံပြုပေးပါ။"
      : "Have a quality playlist you think deserves to be featured here? Send it our way."}</p>
    {!open && <button type="button" onClick={() => setOpen(true)} className="mt-5 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-on-accent hover:bg-accent-hover">
      {my ? "Playlist အကြံပြုရန်" : "Submit a playlist"}
    </button>}
    {open && <form onSubmit={submit} className="mt-6 grid max-w-xl gap-4">
      <label className="grid gap-2 text-sm font-medium">{my ? "Spotify Playlist ID သို့မဟုတ် Link" : "Spotify playlist ID or link"}
        <input type="text" required maxLength={2048} value={playlistId} onChange={event => setPlaylistId(event.target.value)}
          placeholder="https://open.spotify.com/playlist/..." className="min-h-11 rounded-lg border border-theme-border bg-background px-3 py-2 text-foreground" />
      </label>
      <label className="grid gap-2 text-sm font-medium">{my ? "ဂီတအမျိုးအစား" : "Genre"}
        <select value={genre} onChange={event => setGenre(event.target.value as PlaylistGenre)} className="min-h-11 rounded-lg border border-theme-border bg-background px-3 py-2 text-foreground">
          {PLAYLIST_GENRES.map(value => <option key={value} value={value}>{labels[value]}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-accent px-5 py-2 font-semibold text-on-accent disabled:opacity-60">
          {busy ? (my ? "ပို့နေသည်..." : "Submitting...") : (my ? "ပို့ရန်" : "Send for review")}
        </button>
        <button type="button" onClick={() => {setOpen(false); setFeedback("");}} className="min-h-11 rounded-lg border border-theme-border px-4 py-2 text-sm">{my ? "ပိတ်ရန်" : "Cancel"}</button>
      </div>
      {feedback && <p role="status" className={`text-sm ${success ? "text-accent" : "text-red-400"}`}>{feedback}</p>}
    </form>}
  </section>;
}
