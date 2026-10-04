import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { songService } from "@/modules/songs";
import { LyricsMeaningAlignmentService } from "@/modules/songs/application/lyrics-meaning-alignment.service";
import { createOpenAILyricsMeaningAlignmentAdapter } from "@/integrations/ai/openai-lyrics-meaning-alignment.adapter";

export default async function MeaningAlignmentPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const mmid = Number(id);
  if (!Number.isInteger(mmid) || mmid <= 0) notFound();

  const service = new LyricsMeaningAlignmentService(
    songService,
    createOpenAILyricsMeaningAlignmentAdapter(),
  );

  let preview;
  try {
    preview = await service.preview(mmid);
  } catch {
    notFound();
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Meaning Alignment Preview</h1>
          <p className="mt-2 text-zinc-400">{preview.songName} · MMID {preview.mmid}</p>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Preview only. Burmese and Romanized are protected inputs and are never rewritten by this operation.
          </p>
        </div>
        <Link href="/admin/migrations/lyrics-v2" className="rounded border border-zinc-700 px-4 py-2 hover:border-indigo-400">
          Back to migration
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-400">Reused</p><p className="mt-1 text-2xl font-semibold">{preview.counts.reused}</p></div>
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-400">Generated</p><p className="mt-1 text-2xl font-semibold">{preview.counts.generated}</p></div>
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-400">Low confidence</p><p className="mt-1 text-2xl font-semibold">{preview.counts.lowConfidence}</p></div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-300">
            <tr><th className="p-4">#</th><th className="p-4">Burmese</th><th className="p-4">Romanized</th><th className="p-4">Meaning</th><th className="p-4">Source</th><th className="p-4">Confidence</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {preview.rows.map(row => (
              <tr key={row.index} className="align-top">
                <td className="p-4 font-mono text-zinc-500">{row.index + 1}</td>
                <td className="p-4">{row.burmese}</td>
                <td className="p-4">{row.romanized}</td>
                <td className="p-4">{row.meaning}</td>
                <td className="p-4">{row.source}</td>
                <td className="p-4">{row.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
