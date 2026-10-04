import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { ingestionService } from "@/modules/ingestions";
import { songRequestService, SongRequestIdSchema } from "@/modules/requests";
import { NotFoundError } from "@/shared/errors/not-found.error";
import RequestDecisionForm from "../request-decision-form";
import StartIngestionForm from "../start-ingestion-form";

export default async function RequestPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!SongRequestIdSchema.safeParse(id).success) notFound();

  const request = await songRequestService.getAdminDetail(id).catch(error => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const ingestion = await ingestionService.findByRequestId(id);

  const rows = [
    ["Song", request.songName],
    ["Artist", request.artist],
    ["YouTube reference", request.youtubeLink],
    ["Details", request.details],
    ["Requested by", request.requestedBy],
    ["Notify email", request.notifyEmail],
    ["Song story", request.songStory],
  ];

  const reviewable = request.status === "pending" || request.status === "reviewing";

  return <section>
    <Link href="/admin/requests" className="underline">Back to requests</Link>
    <h1 className="mt-4 text-3xl font-bold">Song request</h1>

    <dl className="mt-6 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
      {rows.map(([label, value]) =>
        <div key={label} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr]">
          <dt className="text-zinc-400">{label}</dt>
          <dd className="whitespace-pre-wrap">{value || "—"}</dd>
        </div>)}
    </dl>

    {reviewable && <RequestDecisionForm request={request} />}

    {request.status === "accepted" && ingestion &&
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <Link href={"/admin/ingestions/" + ingestion.id} className="underline">
          Continue song workflow
        </Link>
      </div>}

    {request.status === "accepted" && !ingestion &&
      <div className="mt-6 rounded-xl border border-zinc-800 p-4">
        <p className="text-sm text-zinc-400">
          This request was accepted but its workflow did not finish starting. Resume it here.
        </p>
        <StartIngestionForm requestId={request.id} />
      </div>}

    {request.status === "rejected" &&
      <p className="mt-6 text-zinc-400">This request was rejected.</p>}

    {request.status === "completed" &&
      <p className="mt-6 text-zinc-400">This request has been completed.</p>}
  </section>;
}
