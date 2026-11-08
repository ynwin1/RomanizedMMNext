"use client";

import { useState } from "react";
import { parseYouTubeVideoId } from "@/modules/songs/application/song-cover.youtube";

type Props = { mmid: number; locale: string };
const labels = {
  en: {
    trigger: "Suggest a cover",
    intro: "Found a cover, dub, or instrumental version? Send us its YouTube link for review.",
    url: "YouTube link",
    description: "Description (optional)",
    name: "Your name (optional)",
    submit: "Submit suggestion",
    submitting: "Submitting…",
    cancel: "Cancel",
    success: "Thanks! Your suggestion was submitted for review.",
    invalid: "Please enter a valid YouTube video URL.",
    error: "Unable to submit your suggestion. Please try again.",
    limited: "Too many suggestions for now. Please try again later.",
  },
  my: {
    trigger: "ပြန်လည်သီဆိုထားသော ဗီဒီယို အကြံပြုရန်",
    intro: "ပြန်လည်သီဆိုထားတာ၊ dub နဲ့ တီးခတ်ထားတဲ့ YouTube ဗီဒီယိုတွေကို အကြံပြုနိုင်ပါတယ်။",
    url: "YouTube လင့်ခ်",
    description: "ဖော်ပြချက် (မဖြည့်လည်းရသည်)",
    name: "သင့်အမည် (မဖြည့်လည်းရသည်)",
    submit: "အကြံပြုချက် ပေးပို့ရန်",
    submitting: "ပေးပို့နေသည်…",
    cancel: "ပိတ်ရန်",
    success: "ကျေးဇူးတင်ပါတယ်။ သင့်အကြံပြုချက်ကို စစ်ဆေးရန် လက်ခံရရှိပါပြီ။",
    invalid: "မှန်ကန်သော YouTube ဗီဒီယိုလင့်ခ် ထည့်ပါ။",
    error: "အကြံပြုချက် ပေးပို့၍ မရပါ။ ထပ်ကြိုးစားပါ။",
    limited: "အကြံပြုချက်များလွန်းနေပါသည်။ နောက်မှ ပြန်ကြိုးစားပါ။",
  },
};
const fieldClass = "w-full min-w-0 rounded-lg border border-theme-border bg-background p-3 text-foreground focus:border-accent focus:outline-none";

export default function SuggestSongCover({ mmid, locale }: Props) {
  const copy = locale === "my" ? labels.my : labels.en;
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    if (!parseYouTubeVideoId(url)) {
      setError(copy.invalid);
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/song/${mmid}/covers/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: url,
          ...(description.trim() && { description: description.trim() }),
          ...(name.trim() && { contributorName: name.trim() }),
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        setError(response.status === 429 ? copy.limited : response.status === 409 ? (result?.error || copy.error) : copy.error);
        return;
      }
      setSuccess(true);
      setOpen(false);
      setUrl("");
      setDescription("");
      setName("");
    } catch {
      setError(copy.error);
    } finally {
      setPending(false);
    }
  }

  return <section className="w-full min-w-0" aria-label={copy.trigger}>
    {success && <p role="status" className="mb-3 text-sm text-accent">{copy.success}</p>}
    {!open ? <button type="button" onClick={() => { setOpen(true); setError(""); setSuccess(false); }}
      className="min-h-11 rounded-lg border border-theme-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent hover:text-accent">
      + {copy.trigger}
    </button> : <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-theme-border bg-surface p-4">
      <h2 className="text-lg font-semibold text-foreground">{copy.trigger}</h2>
      <p className="text-sm text-muted">{copy.intro}</p>
      <label className="block space-y-1 text-sm text-foreground">
        <span>{copy.url}</span>
        <input type="url" required maxLength={2048} value={url} onChange={event => setUrl(event.target.value)}
          placeholder="https://youtu.be/..." className={fieldClass} />
      </label>
      <label className="block space-y-1 text-sm text-foreground">
        <span>{copy.description}</span>
        <textarea rows={2} maxLength={500} value={description} onChange={event => setDescription(event.target.value)}
          placeholder="Acoustic cover, guitar instrumental…" className={fieldClass} />
      </label>
      <label className="block space-y-1 text-sm text-foreground">
        <span>{copy.name}</span>
        <input maxLength={100} value={name} onChange={event => setName(event.target.value)} className={fieldClass} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending || !parseYouTubeVideoId(url)}
          className="min-h-11 rounded-lg bg-accent px-4 py-2 font-medium text-background disabled:opacity-50">
          {pending ? copy.submitting : copy.submit}
        </button>
        <button type="button" disabled={pending} onClick={() => { setOpen(false); setError(""); }}
          className="min-h-11 rounded-lg border border-theme-border px-4 py-2 text-foreground">{copy.cancel}</button>
      </div>
      {error && <p role="alert" className="text-sm text-accent">{error}</p>}
    </form>}
  </section>;
}
