import Link from "next/link";
import { adminReads } from "../../admin.data";
import type { LyricsMigrationStatus } from "@/modules/songs";

const statusStyle: Record<LyricsMigrationStatus, string> = {
  SAFE: "border-emerald-800 bg-emerald-950/40 text-emerald-200",
  WARNING: "border-amber-800 bg-amber-950/40 text-amber-200",
  MANUAL_REVIEW: "border-orange-800 bg-orange-950/40 text-orange-200",
  INVALID: "border-red-800 bg-red-950/40 text-red-200",
};

export default async function LyricsV2MigrationPage() {
  const report = await adminReads.lyricsMigrationReadiness();

  return (
    <section aria-labelledby="lyrics-v2-migration-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="lyrics-v2-migration-heading" className="text-3xl font-bold">Lyrics V2 migration readiness</h1>
          <p className="mt-3 max-w-3xl text-zinc-400">
            Read-only analysis of the current catalogue. This page does not write or migrate any song.
          </p>
        </div>
        <Link href="/admin/songs" className="rounded border border-zinc-700 px-4 py-2 hover:border-indigo-400">
          Back to songs
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total</p>
          <p className="mt-2 text-3xl font-semibold">{report.total}</p>
        </div>
        {(["SAFE", "WARNING", "MANUAL_REVIEW", "INVALID"] as const).map(status => (
          <div key={status} className={`rounded-xl border p-5 ${statusStyle[status]}`}>
            <p className="text-sm">{status.replace("_", " ")}</p>
            <p className="mt-2 text-3xl font-semibold">{report.counts[status]}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-300">
            <tr>
              <th className="p-4">MMID</th>
              <th className="p-4">Song</th>
              <th className="p-4">Status</th>
              <th className="p-4">Diagnostics</th>
              <th className="p-4">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {report.assessments.map(assessment => (
              <tr key={assessment.mmid} className="align-top">
                <td className="p-4 font-mono">{assessment.mmid}</td>
                <td className="p-4">
                  <Link href={`/admin/songs/${assessment.mmid}/edit`} className="font-medium underline decoration-zinc-600 underline-offset-4 hover:text-indigo-300">
                    {assessment.songName}
                  </Link>
                </td>
                <td className="p-4">
                  <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${statusStyle[assessment.status]}`}>
                    {assessment.status.replace("_", " ")}
                  </span>
                </td>
                <td className="p-4">
                  {assessment.diagnostics.length ? (
                    <ul className="space-y-2">
                      {assessment.diagnostics.map((diagnostic, index) => (
                        <li key={`${diagnostic.code}:${diagnostic.line ?? "all"}:${index}`}>
                          <span className="font-mono text-xs text-zinc-400">{diagnostic.code}</span>
                          <span className="ml-2">{diagnostic.message}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <span className="text-zinc-500">None</span>}
                </td>
                <td className="p-4 text-zinc-300">
                  {assessment.preview
                    ? `${assessment.preview.entries.filter(entry => entry.kind === "line").length} lyric rows`
                    : "No automatic preview"}
                </td>
              </tr>
            ))}
            {!report.assessments.length && (
              <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No songs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
