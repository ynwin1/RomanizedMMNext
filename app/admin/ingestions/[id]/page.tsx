import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { contentDraftService } from "@/modules/content-drafts";
import { ingestionService, IngestionIdSchema } from "@/modules/ingestions";
import { NotFoundError } from "@/shared/errors/not-found.error";
import SourceForm from "../source-form";

export default async function IngestionPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sourceSaved?: string }>;
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
  const { sourceSaved } = await searchParams;

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
    {ingestion.status === "awaiting_source"
      ? <SourceForm ingestion={ingestion} draft={draft} />
      : <div className="mt-6 rounded-xl border border-zinc-800 p-4">
          <h2 className="font-semibold">Confirmed Burmese source</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-zinc-200">{draft.source.burmeseLyrics || "—"}</pre>
        </div>}
  </section>;
}
