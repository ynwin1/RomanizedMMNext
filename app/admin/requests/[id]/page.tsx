import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { ingestionService } from "@/modules/ingestions";
import { songRequestService, SongRequestIdSchema } from "@/modules/requests";
import { NotFoundError } from "@/shared/errors/not-found.error";
import RequestStatusForm from "../request-status-form";
import StartIngestionForm from "../start-ingestion-form";

export default async function RequestPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!SongRequestIdSchema.safeParse(id).success) notFound();
  const request = await songRequestService.getAdminDetail(id).catch(error => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const ingestion = await ingestionService.findByRequestId(id);
  const { saved } = await searchParams;
  const rows = [
    ["Song", request.songName], ["Artist", request.artist], ["YouTube", request.youtubeLink],
    ["Details", request.details], ["Requested by", request.requestedBy], ["Notify email", request.notifyEmail],
    ["Song story", request.songStory],
  ];
  return <section>
    <Link href="/admin/requests" className="underline">Back to requests</Link>
    <h1 className="mt-4 text-3xl font-bold">Song request</h1>
    {saved === "1" && <p role="status" className="mt-4 text-emerald-300">Request updated successfully.</p>}
    <dl className="mt-6 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
      {rows.map(([label, value]) => <div key={label} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr]"><dt className="text-zinc-400">{label}</dt><dd className="whitespace-pre-wrap">{value || "—"}</dd></div>)}
    </dl>
    <RequestStatusForm request={request} />
    {ingestion
      ? <div className="mt-6 rounded-xl border border-zinc-800 p-4">
          <p className="text-zinc-400">Ingestion status: <span className="text-zinc-100">{ingestion.status}</span></p>
          <Link href={"/admin/ingestions/" + ingestion.id} className="mt-3 inline-block underline">Open ingestion</Link>
        </div>
      : request.status === "accepted"
        ? <StartIngestionForm requestId={request.id} />
        : <p className="mt-6 text-sm text-zinc-400">Accept this request before starting ingestion.</p>}
  </section>;
}
