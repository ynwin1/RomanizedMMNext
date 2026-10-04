import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { artistService } from "@/modules/artists";
import {
  contentDraftService,
  evaluateDraftAdminInputCompleteness,
  evaluateDraftMetadataCompleteness,
} from "@/modules/content-drafts";
import { ingestionService, IngestionIdSchema } from "@/modules/ingestions";
import { NotFoundError } from "@/shared/errors/not-found.error";
import SourceForm from "../source-form";
import GenerationForm from "../generation-form";
import MetadataForm from "../metadata-form";
import ArtistResolutionForm from "../artist-resolution-form";
import ArtistAddForm from "../artist-add-form";
import ArtistRemoveForm from "../artist-remove-form";
import ArtistConfirmForm from "../artist-confirm-form";
import AdminInputReopenForm from "../admin-input-reopen-form";

type IngestionSearchParams = {
  sourceSaved?: string | string[];
  aiGenerated?: string | string[];
  metadataSaved?: string | string[];
  artistChanged?: string | string[];
  artistsConfirmed?: string | string[];
  adminInputReopened?: string | string[];
  artistQ?: string | string[];
  artistIndex?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function IngestionPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<IngestionSearchParams>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!IngestionIdSchema.safeParse(id).success) notFound();

  const ingestion = await ingestionService.getById(id).catch(error => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const draft = await contentDraftService.getByIngestionId(id).catch(error => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const query = await searchParams;
  const sourceSaved = first(query.sourceSaved);
  const aiGenerated = first(query.aiGenerated);
  const metadataSaved = first(query.metadataSaved);
  const artistChanged = first(query.artistChanged);
  const artistsConfirmed = first(query.artistsConfirmed);
  const adminInputReopened = first(query.adminInputReopened);
  const artistQ = (first(query.artistQ) ?? "").trim().slice(0, 100);
  const parsedArtistIndex = Number(first(query.artistIndex));
  const artistIndex = Number.isInteger(parsedArtistIndex) && parsedArtistIndex >= 0
    ? parsedArtistIndex
    : -1;

  const metadataCompleteness = evaluateDraftMetadataCompleteness(draft.metadata);
  const adminInputCompleteness = evaluateDraftAdminInputCompleteness(draft);

  const selectedArtist = draft.artists[artistIndex];
  const canSearchArtist =
    ingestion.status === "needs_admin_input" &&
    artistQ.length > 0 &&
    selectedArtist?.kind === "unresolved";

  const artistCandidates = canSearchArtist
    ? (await artistService.getAdminList({ page: 1, limit: 10, q: artistQ })).items
    : [];

  const showGenerated = [
    "needs_admin_input",
    "ready_for_review",
    "approved",
    "rejected",
  ].includes(ingestion.status);

  const showArtists = [
    "needs_admin_input",
    "ready_for_review",
    "approved",
    "rejected",
  ].includes(ingestion.status);

  return <section>
    <Link href={"/admin/requests/" + ingestion.songRequestId} className="underline">Back to request</Link>
    <h1 className="mt-4 text-3xl font-bold">Song ingestion</h1>
    <p className="mt-2 text-zinc-400">Status: <span className="text-zinc-100">{ingestion.status}</span></p>

    <div className="mt-6 rounded-xl border border-zinc-800 p-4">
      <p><span className="text-zinc-400">Song:</span> {draft.identity.songName || "—"}</p>
      <p><span className="text-zinc-400">Requested artist:</span> {draft.artists[0]?.name || "—"}</p>
    </div>

    {sourceSaved === "1" &&
      <p role="status" className="mt-4 text-emerald-300">Burmese source saved and confirmed.</p>}
    {aiGenerated === "1" &&
      <p role="status" className="mt-4 text-emerald-300">AI content generated successfully.</p>}
    {metadataSaved === "1" &&
      <p role="status" className="mt-4 text-emerald-300">Factual metadata saved.</p>}
    {artistChanged === "1" &&
      <p role="status" className="mt-4 text-emerald-300">Artist list updated.</p>}
    {artistsConfirmed === "1" &&
      <p role="status" className="mt-4 text-emerald-300">Artist list confirmed.</p>}
    {adminInputReopened === "1" &&
      <p role="status" className="mt-4 text-emerald-300">Admin input reopened for editing.</p>}

    {ingestion.status === "awaiting_source"
      ? <SourceForm ingestion={ingestion} draft={draft} />
      : <div className="mt-6 rounded-xl border border-zinc-800 p-4">
          <h2 className="font-semibold">Confirmed Burmese source</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-zinc-200">{draft.source.burmeseLyrics || "—"}</pre>
        </div>}

    {(ingestion.status === "ready_to_generate" || ingestion.status === "failed") &&
      <GenerationForm ingestionId={ingestion.id} retry={ingestion.status === "failed"} />}

    {showGenerated && <>
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="font-semibold">Generated romanization</h2>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-zinc-200">{draft.generated.romanized || "—"}</pre>
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="font-semibold">Generated meaning</h2>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-zinc-200">{draft.generated.meaning || "—"}</pre>
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="font-semibold">About</h2>
        <p className="mt-3 whitespace-pre-wrap text-zinc-200">{draft.generated.about || "—"}</p>
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="font-semibold">When to listen</h2>
        <p className="mt-3 whitespace-pre-wrap text-zinc-200">{draft.generated.whenToListen || "—"}</p>
      </div>
    </>}

    {ingestion.status === "needs_admin_input" && <>
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="font-semibold">Admin input completeness</h2>
        <p className="mt-2 text-zinc-300">
          Metadata: {adminInputCompleteness.metadataComplete ? "complete" : "incomplete"} ·
          Artist list: {adminInputCompleteness.artistsComplete ? " present" : " empty"}
        </p>
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="font-semibold">Factual metadata completeness</h2>
        <p className="mt-2 text-zinc-300">
          {metadataCompleteness.complete
            ? "Complete"
            : "Missing required fields: " + metadataCompleteness.missing.join(", ")}
        </p>
      </div>
      <MetadataForm ingestionId={ingestion.id} draft={draft} />
    </>}

    {ingestion.status === "ready_for_review" &&
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="font-semibold">Need to change metadata or artists?</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Reopen admin input, make your changes, then confirm the artist list again.
        </p>
        <AdminInputReopenForm ingestionId={ingestion.id} draftId={draft.id} />
      </div>}

    {showArtists && <div className="mt-6 rounded-xl border border-zinc-800 p-4">
      <h2 className="text-xl font-semibold">Artists</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Artists may stay name-only if they do not exist in RomanizedMM yet. Resolve to an existing artist when available.
      </p>

      <div className="mt-4 space-y-5">
        {draft.artists.length === 0 && <p className="text-zinc-400">No artists added yet.</p>}
        {draft.artists.map((artist, index) =>
          <div key={index} className="rounded border border-zinc-800 p-3">
            <p className="font-medium">{artist.name}</p>
            {artist.kind === "resolved"
              ? <p className="text-sm text-emerald-300">Resolved · {artist.slug} · {artist.artistId}</p>
              : <p className="text-sm text-amber-300">Name-only · valid for this draft</p>}

            {ingestion.status === "needs_admin_input" && <>
              <ArtistRemoveForm
                ingestionId={ingestion.id}
                draftId={draft.id}
                draftRevision={draft.revision}
                artistIndex={index}
              />

              {artist.kind === "unresolved" && <>
                <form method="get" className="mt-3 flex gap-2">
                  <input type="hidden" name="artistIndex" value={index} />
                  <input
                    name="artistQ"
                    defaultValue={artistIndex === index ? artistQ : artist.name}
                    placeholder="Search existing artists"
                    className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
                  />
                  <button className="rounded border border-zinc-700 px-4 py-2">Search</button>
                </form>
                {artistIndex === index && artistQ && <>
                  {artistCandidates.length > 0
                    ? <ArtistResolutionForm
                        ingestionId={ingestion.id}
                        draftId={draft.id}
                        draftRevision={draft.revision}
                        artistIndex={index}
                        candidates={artistCandidates}
                      />
                    : <p className="mt-3 text-sm text-zinc-400">
                        No existing artists matched. You can keep this name-only and continue.
                      </p>}
                </>}
              </>}
            </>}
          </div>
        )}
      </div>

      {ingestion.status === "needs_admin_input" && <>
        <ArtistAddForm
          ingestionId={ingestion.id}
          draftId={draft.id}
          draftRevision={draft.revision}
        />
        <ArtistConfirmForm ingestionId={ingestion.id} draftId={draft.id} />
      </>}
    </div>}
  </section>;
}
