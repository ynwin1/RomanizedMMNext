"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ArtistEditRecord } from "@/modules/artists/application/artist.dto";
import { createArtistAction, updateArtistAction } from "./artist-actions";

const inputClass = "w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100";
const socialFields = ["facebook", "instagram", "youtube", "spotify", "appleMusic"] as const;

function lines(values?: Array<string | number>): string {
  return values?.join("\n") ?? "";
}

export default function ArtistForm({ artist }: { artist?: ArtistEditRecord }) {
  const action = artist ? updateArtistAction.bind(null, artist.slug, artist.revision) : createArtistAction;
  const [state, formAction, pending] = useActionState(action, {});
  const errors = (field: string) => state.errors?.[field]?.map((message, index) =>
    <p key={index} className="mt-1 text-sm text-red-300">{message}</p>);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state.message && <div role="alert" className="rounded border border-red-400 bg-red-950/30 p-4">{state.message}</div>}
      <fieldset disabled={pending} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">Name <span className="text-zinc-400">(required)</span>
            <input name="name" defaultValue={artist?.name ?? ""} required className={inputClass} aria-invalid={!!state.errors?.name} />{errors("name")}
          </label>
          {artist ? <p className="self-end pb-3 text-zinc-400">Slug: {artist.slug}</p> :
            <label className="block">Slug <span className="text-zinc-400">(required, immutable)</span>
              <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={inputClass} aria-invalid={!!state.errors?.slug} />{errors("slug")}
            </label>}
          <label className="block">Type <span className="text-zinc-400">(required)</span>
            <input name="type" defaultValue={artist?.type ?? ""} required className={inputClass} aria-invalid={!!state.errors?.type} />{errors("type")}
          </label>
          <label className="block">Image URL <span className="text-zinc-400">(required)</span>
            <input name="imageLink" type="url" defaultValue={artist?.imageLink ?? ""} required className={inputClass} aria-invalid={!!state.errors?.imageLink} />{errors("imageLink")}
          </label>
          <label className="block md:col-span-2">Banner URL
            <input name="bannerLink" type="url" defaultValue={artist?.bannerLink ?? ""} className={inputClass} aria-invalid={!!state.errors?.bannerLink} />{errors("bannerLink")}
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">Genres <span className="text-zinc-400">(one per line, at least one)</span>
            <textarea name="musicGenre" rows={5} defaultValue={lines(artist?.musicGenre)} required className={inputClass} aria-invalid={!!state.errors?.musicGenre} />{errors("musicGenre")}
          </label>
          <label className="block">Song IDs <span className="text-zinc-400">(one per line)</span>
            <textarea name="songs" rows={5} defaultValue={lines(artist?.songs)} className={inputClass} aria-invalid={!!state.errors?.songs} />{errors("songs")}
          </label>
          <label className="block">Origins <span className="text-zinc-400">(one per line)</span>
            <textarea name="origin" rows={4} defaultValue={lines(artist?.origin)} className={inputClass} aria-invalid={!!state.errors?.origin} />{errors("origin")}
          </label>
          <label className="block">Labels <span className="text-zinc-400">(one per line)</span>
            <textarea name="labels" rows={4} defaultValue={lines(artist?.labels)} className={inputClass} aria-invalid={!!state.errors?.labels} />{errors("labels")}
          </label>
        </div>

        <label className="block">Biography
          <textarea name="biography" rows={6} defaultValue={artist?.biography ?? ""} className={inputClass} aria-invalid={!!state.errors?.biography} />{errors("biography")}
        </label>
        <label className="block">Biography (Burmese)
          <textarea name="biographyMy" rows={6} defaultValue={artist?.biographyMy ?? ""} className={inputClass} aria-invalid={!!state.errors?.biographyMy} />{errors("biographyMy")}
        </label>
        <label className="block">Unknown fact
          <textarea name="unknownFact" rows={3} defaultValue={artist?.unknownFact ?? ""} className={inputClass} aria-invalid={!!state.errors?.unknownFact} />{errors("unknownFact")}
        </label>

        <label className="block">Members <span className="text-zinc-400">(JSON array; leave blank when not applicable)</span>
          <textarea name="members" rows={6} defaultValue={artist?.members?.length ? JSON.stringify(artist.members, null, 2) : ""} className={inputClass} aria-invalid={!!state.errors?.members} />{errors("members")}
        </label>

        <fieldset className="rounded-xl border border-zinc-800 p-4">
          <legend className="px-2 font-semibold">Social links</legend>
          <div className="grid gap-4 md:grid-cols-2">
            {socialFields.map(field => <label key={field} className="block capitalize">{field === "appleMusic" ? "Apple Music" : field}
              <input name={field} type="url" defaultValue={artist?.socials?.[field] ?? ""} className={inputClass} aria-invalid={!!state.errors?.socials} />
            </label>)}
          </div>
          {errors("socials")}
        </fieldset>

        <div className="flex items-center gap-5">
          <button type="submit" className="rounded bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50">
            {pending ? "Saving…" : artist ? "Save changes" : "Create artist"}
          </button>
          <Link href="/admin/artists" className="underline">Back to artists</Link>
        </div>
      </fieldset>
    </form>
  );
}
