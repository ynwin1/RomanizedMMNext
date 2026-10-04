"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { LyricsV2Entry, SongEditRecord } from "@/modules/songs";
import { createSongAction, updateSongAction } from "./song-actions";
import { songTextFields } from "./song-form.data";

const labels: Record<string, string> = {
  songName: "Song name", albumName: "Album", genre: "Genre", spotifyTrackId: "Spotify track ID",
  spotifyLink: "Spotify URL", appleMusicLink: "Apple Music URL", imageLink: "Image URL",
  about: "About", whenToListen: "When to listen", lyrics: "Lyrics", romanized: "Romanized lyrics",
  burmese: "Burmese lyrics", meaning: "English meaning", requestedBy: "Requested by",
  songStoryEn: "Song story (English)", songStoryMy: "Song story (Burmese)",
};
const multiline = new Set(["about", "whenToListen", "lyrics", "romanized", "burmese", "meaning", "songStoryEn", "songStoryMy"]);
const required = new Set(["songName", "genre", "about", "whenToListen", "lyrics", "romanized", "burmese", "meaning"]);
const inputClass = "w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100";

function emptyLine(): LyricsV2Entry {
  return { kind: "line", burmese: "", romanized: "", meaning: null };
}

function LyricsV2Editor({
  initial,
  errorMessages,
}: {
  initial: LyricsV2Entry[];
  errorMessages?: string[];
}) {
  const [entries, setEntries] = useState<LyricsV2Entry[]>(initial);

  const replace = (index: number, entry: LyricsV2Entry) =>
    setEntries(current => current.map((item, i) => i === index ? entry : item));

  const insert = (index: number, entry: LyricsV2Entry) =>
    setEntries(current => [...current.slice(0, index), entry, ...current.slice(index)]);

  const remove = (index: number) =>
    setEntries(current => current.filter((_, i) => i !== index));

  return (
    <fieldset className="rounded-xl border border-zinc-800 p-4">
      <legend className="px-2 font-semibold">Lyrics V2 <span className="text-sm font-normal text-zinc-400">(optional during migration)</span></legend>
      <p className="mb-4 text-sm text-zinc-400">
        Edit aligned lyric rows directly. Section breaks are explicit rows; English meaning may be intentionally blank.
      </p>
      <input
        type="hidden"
        name="lyricsV2"
        value={entries.length ? JSON.stringify({ version: 2, entries }) : ""}
      />

      {entries.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
          No V2 lyrics yet. Legacy fields below will continue to be saved normally.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div key={index} className="rounded-lg border border-zinc-800 p-3">
              {entry.kind === "break" ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-300">Section break</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => insert(index, emptyLine())} className="rounded border border-zinc-700 px-3 py-2 text-sm">Insert line above</button>
                    <button type="button" onClick={() => remove(index)} className="rounded border border-zinc-700 px-3 py-2 text-sm">Remove</button>
                    <button type="button" onClick={() => insert(index + 1, emptyLine())} className="rounded border border-zinc-700 px-3 py-2 text-sm">Insert line below</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 grid gap-3 lg:grid-cols-3">
                    <label className="text-sm">Burmese / source
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={entry.burmese}
                        onChange={event => replace(index, { ...entry, burmese: event.target.value })}
                      />
                    </label>
                    <label className="text-sm">Romanized
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={entry.romanized}
                        onChange={event => replace(index, { ...entry, romanized: event.target.value })}
                      />
                    </label>
                    <label className="text-sm">English meaning <span className="text-zinc-500">(blank = intentionally omitted)</span>
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={entry.meaning ?? ""}
                        onChange={event => replace(index, { ...entry, meaning: event.target.value === "" ? null : event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => insert(index, emptyLine())} className="rounded border border-zinc-700 px-3 py-2 text-sm">Insert line above</button>
                    <button type="button" onClick={() => insert(index + 1, { kind: "break" })} className="rounded border border-zinc-700 px-3 py-2 text-sm">Insert break below</button>
                    <button type="button" onClick={() => insert(index + 1, emptyLine())} className="rounded border border-zinc-700 px-3 py-2 text-sm">Insert line below</button>
                    <button type="button" onClick={() => remove(index)} className="rounded border border-zinc-700 px-3 py-2 text-sm">Remove line</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setEntries(current => [...current, emptyLine()])} className="rounded border border-zinc-700 px-3 py-2">Add lyric line</button>
        {entries.length > 0 && <button type="button" onClick={() => setEntries(current => [...current, { kind: "break" }])} className="rounded border border-zinc-700 px-3 py-2">Add section break</button>}
        {entries.length > 0 && <button type="button" onClick={() => setEntries([])} className="rounded border border-red-900 px-3 py-2 text-red-300">Remove V2 lyrics</button>}
      </div>
      {errorMessages?.map((message, index) => <p key={index} className="mt-2 text-sm text-red-300">{message}</p>)}
    </fieldset>
  );
}

export default function SongForm({ song }: { song?: SongEditRecord }) {
  const action = song ? updateSongAction.bind(null, song.mmid, song.revision) : createSongAction;
  const [state, formAction, pending] = useActionState(action, {});
  const [artists, setArtists] = useState(song?.artistName.length ? song.artistName.map(artist => ({ name: artist.name, slug: artist.slug ?? "" })) : [{ name: "", slug: "" }]);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(songTextFields.map(field => [field, song?.[field] ?? ""])));
  const [mmid, setMmid] = useState("");
  const [youtube, setYoutube] = useState(song?.youtubeLink?.join("\n") ?? "");
  const [requested, setRequested] = useState(song?.isRequested ?? false);
  const change = (field: string, value: string) => setValues(previous => ({ ...previous, [field]: value }));
  const errors = (field: string) => state.errors?.[field]?.map((message, index) => <p key={index} className="mt-1 text-sm text-red-300">{message}</p>);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state.message && <div role="alert" className="rounded border border-red-400 bg-red-950/30 p-4">{state.message}</div>}
      <fieldset disabled={pending} className="space-y-6">
        {song ? <p className="text-zinc-400">Song ID: {song.mmid}</p> :
          <label className="block">Song ID <span className="text-zinc-400">(required, unique)</span>
            <input name="mmid" value={mmid} onChange={event => setMmid(event.target.value)} type="number" min="1" step="1" required className={inputClass} aria-invalid={!!state.errors?.mmid} />{errors("mmid")}
          </label>}
        <fieldset className="rounded-xl border border-zinc-800 p-4">
          <legend className="px-2 font-semibold">Artists</legend>
          <p className="mb-4 text-sm text-zinc-400">Use each artist’s existing catalogue slug.</p>
          <input name="artistName" type="hidden" value={JSON.stringify(artists)} />
          {artists.map((artist, index) => <div key={index} className="mb-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="text-sm">Artist name
              <input required className={inputClass} value={artist.name} onChange={event => setArtists(artists.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
            </label>
            <label className="text-sm">Artist slug
              <input required className={inputClass} value={artist.slug} onChange={event => setArtists(artists.map((item, i) => i === index ? { ...item, slug: event.target.value } : item))} />
            </label>
            <button type="button" disabled={artists.length === 1} onClick={() => setArtists(artists.filter((_, i) => i !== index))} className="self-end rounded border border-zinc-700 p-3 disabled:opacity-40">Remove</button>
          </div>)}
          <button type="button" disabled={artists.length >= 30} onClick={() => setArtists([...artists, { name: "", slug: "" }])} className="rounded border border-zinc-700 px-3 py-2">Add artist</button>
          {errors("artistName")}
        </fieldset>

        <LyricsV2Editor initial={song?.lyricsV2?.entries ?? []} errorMessages={state.errors?.lyricsV2} />

        <div className="grid gap-5 md:grid-cols-2">
          {songTextFields.map(field => <label key={field} className={multiline.has(field) ? "block md:col-span-2" : "block"}>
            {labels[field]} {required.has(field) && <span className="text-sm text-zinc-400">(required)</span>}
            {multiline.has(field)
              ? <textarea name={field} rows={["lyrics", "romanized", "burmese", "meaning"].includes(field) ? 8 : 3} value={values[field]} onChange={event => change(field, event.target.value)} required={required.has(field)} className={inputClass} aria-invalid={!!state.errors?.[field]} />
              : <input name={field} type={field.endsWith("Link") ? "url" : "text"} value={values[field]} onChange={event => change(field, event.target.value)} required={required.has(field)} className={inputClass} aria-invalid={!!state.errors?.[field]} />}
            {errors(field)}
          </label>)}
        </div>
        <label className="block">YouTube URLs <span className="text-sm text-zinc-400">(one per line)</span>
          <textarea name="youtubeLink" rows={3} value={youtube} onChange={event => setYoutube(event.target.value)} className={inputClass} aria-invalid={!!state.errors?.youtubeLink} />{errors("youtubeLink")}
        </label>
        <label className="flex items-center gap-3"><input type="checkbox" name="isRequested" checked={requested} onChange={event => setRequested(event.target.checked)} />This song came from a listener request</label>
        <div className="flex items-center gap-5">
          <button type="submit" className="rounded bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50">{pending ? "Saving…" : song ? "Save changes" : "Create song"}</button>
          <Link href="/admin/songs" className="underline">Back to songs</Link>
        </div>
      </fieldset>
    </form>
  );
}
