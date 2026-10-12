"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import type { LyricsV2Entry, SongEditRecord } from "@/modules/songs";
import { renderLyricsV2Column } from "@/modules/songs/domain/lyrics.compatibility";
import { buildLyricsV2FromAlignedText } from "@/modules/songs/application/lyrics-v2.builder";
import { createSongAction, generateSongAiContentAction, searchSongArtistsAction, updateSongAction } from "./song-actions";
import { songTextFields } from "./song-form.data";
import { requiresGenerationOverwriteConfirmation } from "./song-generation-overwrite";
import SpotifyTrackImport from "../spotify-track-import";
import RomanizationRefinementReview from "@/app/components/admin/RomanizationRefinementReview";
import type {RomanizationRefinement} from "@/modules/content-generation/domain/content-generation.types";

const labels: Record<string, string> = {
  songName: "Song name", albumName: "Album", genre: "Genre", spotifyTrackId: "Spotify track ID",
  spotifyLink: "Spotify URL", appleMusicLink: "Apple Music URL", imageLink: "Image URL",
  about: "About", whenToListen: "When to listen", requestedBy: "Requested by",
  songStoryEn: "Song story (English)", songStoryMy: "Song story (Burmese)",
};
const multiline = new Set(["about", "whenToListen", "songStoryEn", "songStoryMy"]);
const required = new Set(["songName", "genre", "about", "whenToListen"]);
const inputClass = "w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100";

function emptyLine(): LyricsV2Entry {
  return { kind: "line", burmese: "", romanized: "", meaning: null };
}

type EditableArtist = { name: string; slug: string };

function ArtistEntry({ artist, onChange, onRemove, canRemove }: {
  artist: EditableArtist;
  onChange: (artist: EditableArtist) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [matches, setMatches] = useState<EditableArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (artist.name.trim().length < 2 || artist.slug) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const results = await searchSongArtistsAction(artist.name);
        if (active) setMatches(results);
      } catch {
        if (active) setMatches([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [artist.name, artist.slug]);

  const suggestions = focused && !artist.slug && artist.name.trim().length >= 2;
  return <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
    <div className="relative text-sm">
      <label>Artist name
        <input
          required
          autoComplete="off"
          role="combobox"
          aria-expanded={suggestions}
          aria-autocomplete="list"
          className={inputClass}
          value={artist.name}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChange={event => {
            setMatches([]);
            setSearching(event.target.value.trim().length >= 2);
            onChange({ name: event.target.value, slug: "" });
          }}
        />
      </label>
      {suggestions && <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded border border-zinc-600 bg-zinc-950 shadow-xl">
        {matches.map(match => <button
          type="button"
          key={match.slug}
          onMouseDown={event => event.preventDefault()}
          onClick={() => { onChange(match); setFocused(false); setMatches([]); }}
          className="block w-full px-3 py-2 text-left hover:bg-zinc-800 focus:bg-zinc-800"
        >{match.name} <span className="block text-xs text-zinc-400">{match.slug}</span></button>)}
        {searching && <p className="px-3 py-2 text-zinc-400">Searching artists…</p>}
        {!searching && matches.length === 0 && <p className="px-3 py-2 text-zinc-400">No match. You can keep the name without a slug.</p>}
      </div>}
    </div>
    <label className="text-sm">Artist slug <span className="text-zinc-400">(optional)</span>
      <input className={inputClass} placeholder="Select an existing artist, or leave blank" value={artist.slug} onChange={event => onChange({ ...artist, slug: event.target.value })} />
    </label>
    <button type="button" disabled={!canRemove} onClick={onRemove} className="self-end rounded border border-zinc-700 p-3 disabled:opacity-40">Remove</button>
  </div>;
}

function LyricsV2Editor({
  entries,
  setEntries,
  onPendingChange,
  errorMessages,
}: {
  entries: LyricsV2Entry[];
  setEntries: React.Dispatch<React.SetStateAction<LyricsV2Entry[]>>;
  onPendingChange: (pending: boolean) => void;
  errorMessages?: string[];
}) {
  const [view, setView] = useState<"rows" | "blob">("rows");
  const [blobText, setBlobText] = useState({ burmese: "", romanized: "", meaning: "" });
  const [blobDirty, setBlobDirty] = useState(false);

  const blobResult = (() => {
    try {
      return { lyrics: buildLyricsV2FromAlignedText(blobText.burmese, blobText.romanized, blobText.meaning), error: "" };
    } catch (error) {
      return { lyrics: null, error: error instanceof Error ? error.message : "Lyrics do not align." };
    }
  })();

  function openBlob() {
    const lyrics = { version: 2 as const, entries };
    setBlobText({
      burmese: renderLyricsV2Column(lyrics, "burmese"),
      romanized: renderLyricsV2Column(lyrics, "romanized"),
      meaning: renderLyricsV2Column(lyrics, "meaning"),
    });
    setBlobDirty(false);
    onPendingChange(false);
    setView("blob");
  }

  function applyBlob() {
    if (!blobResult.lyrics) return;
    setEntries(blobResult.lyrics.entries);
    setBlobDirty(false);
    onPendingChange(false);
  }

  function discardBlob() {
    setBlobDirty(false);
    onPendingChange(false);
    setView("rows");
  }

  const replace = (index: number, entry: LyricsV2Entry) =>
    setEntries(current => current.map((item, i) => i === index ? entry : item));

  const insert = (index: number, entry: LyricsV2Entry) =>
    setEntries(current => [...current.slice(0, index), entry, ...current.slice(index)]);

  const remove = (index: number) =>
    setEntries(current => current.filter((_, i) => i !== index));

  return (
    <fieldset className="rounded-xl border border-zinc-800 p-4">
      <legend className="px-2 font-semibold">Lyrics V2 <span className="text-sm font-normal text-emerald-300">(source of truth)</span></legend>
      <p className="mb-4 text-sm text-zinc-400">
        Edit line by line or edit the three complete lyric texts. Full-lyrics edits are checked for
        matching lines and section breaks before they become Lyrics V2.
      </p>
      <div role="group" aria-label="Lyrics display" className="mb-4 inline-flex flex-wrap gap-1 rounded-lg border border-zinc-700 p-1">
        <button type="button" aria-pressed={view === "rows"} disabled={view === "blob" && blobDirty} onClick={() => setView("rows")}
          className={`rounded px-4 py-2 text-sm ${view === "rows" ? "bg-indigo-600 text-white" : "text-zinc-300 hover:bg-zinc-800"}`}>
          Aligned rows
        </button>
        <button type="button" aria-pressed={view === "blob"} disabled={view === "blob"} onClick={openBlob}
          className={`rounded px-4 py-2 text-sm ${view === "blob" ? "bg-indigo-600 text-white" : "text-zinc-300 hover:bg-zinc-800"}`}>
          Full lyrics
        </button>
      </div>
      <input
        type="hidden"
        name="lyricsV2"
        value={entries.length ? JSON.stringify({ version: 2, entries }) : ""}
      />

      {view === "blob" ? (
        <div className="grid gap-4 lg:grid-cols-3" aria-label="Full lyrics by type">
          {(["burmese", "romanized", "meaning"] as const).map(column => (
            <label key={column} className="min-w-0 text-sm">
              <span className="font-medium">{{ burmese: "Burmese / source", romanized: "Romanized", meaning: "English meaning" }[column]}</span>
              <textarea
                rows={18}
                value={blobText[column]}
                onChange={event => {
                  setBlobText(previous => ({ ...previous, [column]: event.target.value }));
                  setBlobDirty(true);
                  onPendingChange(true);
                }}
                className={`${inputClass} mt-2 resize-y whitespace-pre-wrap font-mono text-sm leading-relaxed`}
              />
            </label>
          ))}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs text-zinc-400">Each text area must have the same number of lines. Leave all three lines empty to make a section break; a blank Meaning line is allowed for lyrics without a translation.</p>
            {blobDirty && blobResult.error && <p role="alert" className="text-sm text-amber-300">{blobResult.error} Fix the alignment to apply these changes.</p>}
            {blobDirty && !blobResult.error && <p role="status" className="text-sm text-emerald-300">Lyrics are aligned and ready to apply.</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={!blobDirty || !blobResult.lyrics} onClick={applyBlob} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-40">Apply full-lyrics changes</button>
              {blobDirty && <button type="button" onClick={discardBlob} className="rounded border border-zinc-700 px-4 py-2 text-sm">Discard changes and return to rows</button>}
            </div>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
          No V2 lyrics yet. Add at least one aligned lyric row before saving.
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

      {view === "rows" && <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setEntries(current => [...current, emptyLine()])} className="rounded border border-zinc-700 px-3 py-2">Add lyric line</button>
        {entries.length > 0 && <button type="button" onClick={() => setEntries(current => [...current, { kind: "break" }])} className="rounded border border-zinc-700 px-3 py-2">Add section break</button>}
      </div>}
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
  const [lyricsEntries, setLyricsEntries] = useState<LyricsV2Entry[]>(song?.lyricsV2?.entries ?? []);
  const [blobChangesPending, setBlobChangesPending] = useState(false);
  const [sourceLyrics, setSourceLyrics] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [refinements, setRefinements] = useState<RomanizationRefinement[]>([]);
  const [lastGeneratedRomanized, setLastGeneratedRomanized] = useState("");
  const [confirmAiOverwrite, setConfirmAiOverwrite] = useState(false);
  const [aiPending, startAiTransition] = useTransition();
  const change = (field: string, value: string) => setValues(previous => ({ ...previous, [field]: value }));

  const autoGenerate = () => {
    setAiMessage("");
    if (!sourceLyrics.trim()) {
      setAiMessage("Paste Burmese lyrics before generating.");
      return;
    }

    if (requiresGenerationOverwriteConfirmation(lyricsEntries) && !confirmAiOverwrite) {
      setConfirmAiOverwrite(true);
      setAiMessage("Existing Lyrics V2 rows will be replaced. Review your edits, then click Confirm replacement to regenerate.");
      return;
    }
    setConfirmAiOverwrite(false);
    startAiTransition(async () => {
      const result = await generateSongAiContentAction({
        burmeseLyrics: sourceLyrics,
        songName: values.songName?.trim() || undefined,
        artistNames: artists.map(artist => artist.name.trim()).filter(Boolean),
      });

      if (!result.ok) {
        setAiMessage(result.message);
        return;
      }

      setLyricsEntries(result.generated.lyricsV2.entries);
      setRefinements(result.generated.refinements);
      setLastGeneratedRomanized(result.generated.romanized);
      change("about", result.generated.about);
      change("whenToListen", result.generated.whenToListen);
      setAiMessage("Generated Romanization, Meaning, metadata, and Lyrics V2. Review and edit before saving.");
    });
  };
  const errors = (field: string) => state.errors?.[field]?.map((message, index) => <p key={index} className="mt-1 text-sm text-red-300">{message}</p>);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state.message && <div role="alert" className="rounded border border-red-400 bg-red-950/30 p-4">{state.message}</div>}
      <fieldset disabled={pending} className="space-y-6">
        <SpotifyTrackImport onApply={track => {
          setValues(previous => ({
            ...previous,
            songName: track.name,
            albumName: track.albumName,
            imageLink: track.imageLink,
            spotifyTrackId: track.trackId,
            spotifyLink: track.spotifyLink,
            genre: previous.genre || track.genres[0] || "",
          }));
          // Existing catalogue slugs must be confirmed by the admin.
          setArtists(track.artists.map(artist => ({ name: artist.name, slug: "" })));
        }} />
        {song ? <p className="text-zinc-400">Song ID: {song.mmid}</p> :
          <label className="block">Song ID <span className="text-zinc-400">(required, unique)</span>
            <input name="mmid" value={mmid} onChange={event => setMmid(event.target.value)} type="number" min="1" step="1" required className={inputClass} aria-invalid={!!state.errors?.mmid} />{errors("mmid")}
          </label>}
        <fieldset className="rounded-xl border border-zinc-800 p-4">
          <legend className="px-2 font-semibold">Artists</legend>
          <p className="mb-4 text-sm text-zinc-400">Start typing to find an existing catalogue artist. Select a match to fill its slug, or leave the slug blank for a name-only artist.</p>
          <input name="artistName" type="hidden" value={JSON.stringify(artists)} />
          {artists.map((artist, index) => <ArtistEntry
            key={index}
            artist={artist}
            onChange={updated => setArtists(current => current.map((item, i) => i === index ? updated : item))}
            onRemove={() => setArtists(current => current.filter((_, i) => i !== index))}
            canRemove={artists.length > 1}
          />)}
          <button type="button" disabled={artists.length >= 30} onClick={() => setArtists([...artists, { name: "", slug: "" }])} className="rounded border border-zinc-700 px-3 py-2">Add artist</button>
          {errors("artistName")}
        </fieldset>

        {!song && (
          <fieldset className="rounded-xl border border-violet-900 bg-violet-950/20 p-4">
            <legend className="px-2 font-semibold text-violet-200">AI song setup</legend>
            <p className="mb-3 text-sm text-zinc-400">
              Paste the Burmese lyrics as-is. Auto-generate creates aligned Romanization and English Meaning,
              generates About / When to listen, and builds Lyrics V2 automatically.
            </p>
            <textarea
              rows={14}
              value={sourceLyrics}
              onChange={event => { setSourceLyrics(event.target.value); setConfirmAiOverwrite(false); }}
              placeholder="Paste Burmese lyrics here…"
              className={inputClass}
            />
            <button
              type="button"
              onClick={autoGenerate}
              disabled={aiPending}
              className="mt-3 rounded bg-violet-600 px-5 py-3 font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {aiPending ? "Generating…" : confirmAiOverwrite ? "Confirm replacement and regenerate" : "Auto-generate song content"}
            </button>
            {confirmAiOverwrite && <button type="button" onClick={() => { setConfirmAiOverwrite(false); setAiMessage(""); }} className="ml-3 rounded border border-zinc-700 px-4 py-3 text-sm">Cancel replacement</button>}
            <p className="mt-2 text-xs text-zinc-500">AI tokens are used only when you confirm generation. Existing V2 rows require confirmation before regeneration.</p>
            {aiMessage && <p className="mt-3 text-sm text-violet-200">{aiMessage}</p>}
          </fieldset>
        )}

        <RomanizationRefinementReview refinements={refinements} currentLines={lastGeneratedRomanized.split("\n")} />
        <LyricsV2Editor entries={lyricsEntries} setEntries={next => {setRefinements([]); setLyricsEntries(next);}} onPendingChange={setBlobChangesPending} errorMessages={state.errors?.lyricsV2} />
        {blobChangesPending && <p role="alert" className="text-sm text-amber-300">Apply or discard your full-lyrics edits before saving the song.</p>}

        <div className="grid gap-5 md:grid-cols-2">
          {songTextFields.map(field => <label key={field} className={multiline.has(field) ? "block md:col-span-2" : "block"}>
            {labels[field]} {required.has(field) && <span className="text-sm text-zinc-400">(required)</span>}
            {multiline.has(field)
              ? <textarea name={field} rows={3} value={values[field]} onChange={event => change(field, event.target.value)} required={required.has(field)} className={inputClass} aria-invalid={!!state.errors?.[field]} />
              : <input name={field} type={field.endsWith("Link") ? "url" : "text"} value={values[field]} onChange={event => change(field, event.target.value)} required={required.has(field)} className={inputClass} aria-invalid={!!state.errors?.[field]} />}
            {errors(field)}
          </label>)}
        </div>
        <label className="block">YouTube URLs <span className="text-sm text-zinc-400">(one per line)</span>
          <textarea name="youtubeLink" rows={3} value={youtube} onChange={event => setYoutube(event.target.value)} className={inputClass} aria-invalid={!!state.errors?.youtubeLink} />{errors("youtubeLink")}
        </label>
        <label className="flex items-center gap-3"><input type="checkbox" name="isRequested" checked={requested} onChange={event => setRequested(event.target.checked)} />This song came from a listener request</label>
        <div className="flex items-center gap-5">
          <button type="submit" disabled={blobChangesPending} className="rounded bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50">{pending ? "Saving…" : song ? "Save changes" : "Create song"}</button>
          <Link href="/admin/songs" className="underline">Back to songs</Link>
        </div>
      </fieldset>
    </form>
  );
}
