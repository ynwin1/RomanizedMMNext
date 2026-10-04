import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { artistService } from "@/modules/artists";
import { contentDraftService } from "@/modules/content-drafts";
import { ingestionService, IngestionIdSchema } from "@/modules/ingestions";
import { NotFoundError } from "@/shared/errors/not-found.error";
import SourceForm from "../source-form";
import GenerationForm from "../generation-form";
import ReviewForm from "../review-form";
import ArtistResolutionForm from "../artist-resolution-form";
import ArtistAddForm from "../artist-add-form";
import ArtistRemoveForm from "../artist-remove-form";

type IngestionSearchParams = {
  aiGenerated?: string | string[];
  generationFailed?: string | string[];
  reviewSaved?: string | string[];
  artistChanged?: string | string[];
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
  const aiGenerated = first(query.aiGenerated);
  const generationFailed = first(query.generationFailed);
  const reviewSaved = first(query.reviewSaved);
  const artistChanged = first(query.artistChanged);
  const artistQ = (first(query.artistQ) ?? "").trim().slice(0, 100);
  const parsedArtistIndex = Number(first(query.artistIndex));
  const artistIndex = Number.isInteger(parsedArtistIndex) && parsedArtistIndex >= 0
    ? parsedArtistIndex
    : -1;

  const reviewStage =
    ingestion.status === "ready_for_review" ||
    ingestion.status === "needs_admin_input";

  const selectedArtist = draft.artists[artistIndex];
  const canSearchArtist =
    reviewStage &&
    artistQ.length > 0 &&
    selectedArtist?.kind === "unresolved";

  const artistCandidates = canSearchArtist
    ? (await artistService.getAdminList({ page: 1, limit: 10, q: artistQ })).items
    : [];

  return <section>
    <Link href={"/admin/requests/" + ingestion.songRequestId} className="underline">Back to request</Link>
    <h1 className="mt-4 text-3xl font-bold">Song workflow</h1>

    <div className="mt-6 rounded-xl border border-zinc-800 p-4">
      <p><span className="text-zinc-400">Song:</span> {draft.identity.songName || "—"}</p>
      <p><span className="text-zinc-400">Requested artist:</span> {draft.artists[0]?.name || "—"}</p>
    </div>

    {aiGenerated === "1" &&
      <p role="status" className="mt-4 text-emerald-300">AI content generated. Review and polish it below.</p>}
    {generationFailed === "1" &&
      <p role="status" className="mt-4 text-red-300">AI generation failed. You can retry without re-entering the source.</p>}
    {reviewSaved === "1" &&
      <p role="status" className="mt-4 text-emerald-300">Review changes saved.</p>}
    {artistChanged === "1" &&
      <p role="status" className="mt-4 text-emerald-300">Artist list updated.</p>}

    {ingestion.status === "awaiting_source" && <>
      <h2 className="mt-6 text-xl font-semibold">Provide the Burmese source</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Once saved, AI generation runs automatically.
      </p>
      <SourceForm ingestion={ingestion} draft={draft} />
    </>}

    {ingestion.status === "failed" && <>
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="font-semibold">Trusted Burmese source</h2>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-zinc-200">
          {draft.source.burmeseLyrics || "—"}
        </pre>
      </div>
      <GenerationForm ingestionId={ingestion.id} retry />
    </>}

    {(ingestion.status === "ready_to_generate" || ingestion.status === "generating") &&
      <div className="mt-6 rounded-xl border border-zinc-800 p-4 text-zinc-300">
        AI generation is in progress for this draft.
      </div>}

    {reviewStage && <>
      <ReviewForm ingestionId={ingestion.id} draft={draft} />

      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="text-xl font-semibold">Artists</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Add as many artists as needed. Artists may stay name-only if they do not exist in RomanizedMM yet.
        </p>

        <div className="mt-4 space-y-5">
          {draft.artists.length === 0 && <p className="text-zinc-400">No artists added yet.</p>}
          {draft.artists.map((artist, index) =>
            <div key={index} className="rounded border border-zinc-800 p-3">
              <p className="font-medium">{artist.name}</p>
              {artist.kind === "resolved"
                ? <p className="text-sm text-emerald-300">Resolved · {artist.slug}</p>
                : <p className="text-sm text-amber-300">Name-only</p>}

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
                  <button className="rounded border border-zinc-700 px-4 py-2">Search existing</button>
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
                        No match found. Keeping this artist name-only is fine.
                      </p>}
                </>}
              </>}
            </div>
          )}
        </div>

        <ArtistAddForm
          ingestionId={ingestion.id}
          draftId={draft.id}
          draftRevision={draft.revision}
        />
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <h2 className="font-semibold">Publish</h2>
        <p className="mt-1 text-sm text-zinc-400">
          The next publishing PR will turn this reviewed draft into the canonical song and complete the request.
        </p>
      </div>
    </>}

    {ingestion.status === "approved" &&
      <p className="mt-6 text-emerald-300">This ingestion has been approved and published.</p>}
    {ingestion.status === "rejected" &&
      <p className="mt-6 text-zinc-400">This ingestion was rejected.</p>}
  </section>;
}
