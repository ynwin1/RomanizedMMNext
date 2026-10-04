import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { lyricsMeaningReviewDraftRepository, songService } from "@/modules/songs";
import { LyricsMeaningAlignmentService } from "@/modules/songs/application/lyrics-meaning-alignment.service";
import type { LyricsMeaningAlignmentProvider } from "@/modules/songs/application/lyrics-meaning-alignment.provider";
import { createOpenAILyricsMeaningAlignmentAdapter } from "@/integrations/ai/openai-lyrics-meaning-alignment.adapter";
import { MeaningReviewEditor } from "./meaning-review-editor";
import {
  regenerateMeaningAlignmentAction,
  saveMeaningAlignmentReviewAction,
} from "./meaning-review-actions";

const lazyProvider: LyricsMeaningAlignmentProvider = {
  alignMeaning: input => createOpenAILyricsMeaningAlignmentAdapter().alignMeaning(input),
};

export default async function MeaningAlignmentPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const principal = await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const saveError = typeof query.saveError === "string" ? query.saveError : undefined;
  const draftSaved = query.draftSaved === "1";
  const regenerated = query.regenerated === "1";
  const mmid = Number(id);
  if (!Number.isInteger(mmid) || mmid <= 0) notFound();

  const service = new LyricsMeaningAlignmentService(
    songService,
    lyricsMeaningReviewDraftRepository,
    lazyProvider,
  );

  let preview;
  try {
    preview = await service.preview(mmid, { updatedBy: principal.userId });
  } catch {
    notFound();
  }

  const saveAction = saveMeaningAlignmentReviewAction.bind(null, preview.mmid, preview.legacySnapshot);
  const regenerateAction = regenerateMeaningAlignmentAction.bind(null, preview.mmid);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Meaning Alignment Review</h1>
          <p className="mt-2 text-zinc-400">{preview.songName} · MMID {preview.mmid}</p>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Burmese and Romanized are protected. The AI preview is persisted as a review draft, so reopening this page does not call AI again.
          </p>
        </div>
        <Link href="/admin/migrations/lyrics-v2" className="rounded border border-zinc-700 px-4 py-2 hover:border-indigo-400">
          Back to migration
        </Link>
      </div>

      <div className="mt-6 rounded border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-200">
        {preview.cached
          ? "Loaded saved review draft — no AI tokens were spent opening this page."
          : "Generated once and saved as a review draft. Future opens will use this saved copy."}
      </div>

      {(draftSaved || regenerated) && (
        <div role="status" className="mt-4 rounded border border-indigo-900 bg-indigo-950/30 p-4 text-sm text-indigo-200">
          {draftSaved
            ? "Review draft saved. Your manual Meaning edits will be here when you return."
            : "AI preview regenerated and replaced the previous draft."}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-400">Reused</p><p className="mt-1 text-2xl font-semibold">{preview.counts.reused}</p></div>
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-400">Generated</p><p className="mt-1 text-2xl font-semibold">{preview.counts.generated}</p></div>
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-400">Low confidence</p><p className="mt-1 text-2xl font-semibold">{preview.counts.lowConfidence}</p></div>
      </div>

      {saveError && (
        <div role="alert" className="mt-6 rounded border border-red-800 bg-red-950/40 p-4 text-red-200">
          {saveError === "stale"
            ? "This song changed after the review draft was generated. Generate a fresh AI preview before saving."
            : saveError === "regenerate"
              ? "AI regeneration failed. Your existing saved review draft was not removed."
              : "The review could not be saved. No lyricsV2 changes were written."}
        </div>
      )}

      <MeaningReviewEditor rows={preview.rows} action={saveAction} />

      <form action={regenerateAction} className="mt-8 rounded-lg border border-amber-900/70 bg-amber-950/20 p-4">
        <h2 className="font-semibold text-amber-200">Regenerate with AI</h2>
        <p className="mt-2 text-sm text-zinc-400">
          This is the only action on this page that makes a new AI request and spends tokens. It replaces the saved review draft, including manual edits.
        </p>
        <button type="submit" className="mt-4 rounded border border-amber-700 px-4 py-2 text-amber-100 hover:bg-amber-950">
          Regenerate with AI
        </button>
      </form>
    </section>
  );
}
