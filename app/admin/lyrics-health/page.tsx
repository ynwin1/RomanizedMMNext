import Link from "next/link";
import { adminReads } from "../admin.data";
import { requireAdmin } from "@/infrastructure/auth";
import type { LyricsMigrationStatus } from "@/modules/songs";
import { filterLyricsHealth, parseLyricsHealthFilter } from "./lyrics-health-filter";

const statusStyle: Record<LyricsMigrationStatus, string> = {
  SAFE: "border-emerald-800 bg-emerald-950/40 text-emerald-200",
  WARNING: "border-amber-800 bg-amber-950/40 text-amber-200",
  MANUAL_REVIEW: "border-orange-800 bg-orange-950/40 text-orange-200",
  INVALID: "border-red-800 bg-red-950/40 text-red-200",
};

const statusLabel: Record<LyricsMigrationStatus, string> = {
  SAFE: "Healthy",
  WARNING: "Warning",
  MANUAL_REVIEW: "Needs review",
  INVALID: "Invalid",
};

export default async function LyricsHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const selectedStatus = parseLyricsHealthFilter(params.status);
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const report = await adminReads.lyricsMigrationReadiness();
  const assessments = filterLyricsHealth(report.assessments, selectedStatus, query);

  return (
    <section aria-labelledby="lyrics-health-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="lyrics-health-heading" className="text-3xl font-bold">Lyrics Health</h1>
          <p className="mt-3 max-w-3xl text-zinc-400">
            Read-only quality checks for the canonical Lyrics V2 catalogue. Use this page to spot malformed,
            incomplete, or suspicious lyric data before it reaches users.
          </p>
        </div>
        <Link href="/admin/songs" className="rounded border border-zinc-700 px-4 py-2 hover:border-indigo-400">
          Back to songs
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total songs</p>
          <p className="mt-2 text-3xl font-semibold">{report.total}</p>
        </div>
        {(["SAFE", "WARNING", "MANUAL_REVIEW", "INVALID"] as const).map(status => (
          <div key={status} className={`rounded-xl border p-5 ${statusStyle[status]}`}>
            <p className="text-sm">{statusLabel[status]}</p>
            <p className="mt-2 text-3xl font-semibold">{report.counts[status]}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-xl font-semibold">Permanent quality checks</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Lyrics V2 is the source of truth for all normal song writes. This dashboard is intentionally read-only:
          fix flagged songs through the normal song editor rather than running catalogue-wide migration actions.
        </p>
      </div>

      <form method="get" className="mt-8 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-800 p-4">
        <label className="flex flex-col gap-2 text-sm text-zinc-300">
          Health status
          <select name="status" defaultValue={selectedStatus} className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2">
            <option value="ISSUES">Issues only</option>
            <option value="ALL">All songs</option>
            <option value="WARNING">Warning</option>
            <option value="MANUAL_REVIEW">Needs review</option>
            <option value="INVALID">Invalid</option>
            <option value="SAFE">Healthy</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-zinc-300">
          Song or MMID
          <input name="q" type="search" maxLength={100} defaultValue={query}
            placeholder="Search songs" className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2" />
        </label>
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500">Apply filters</button>
        <Link href="/admin/lyrics-health" className="rounded border border-zinc-700 px-4 py-2 hover:border-indigo-400">Reset</Link>
        <p className="text-sm text-zinc-400" role="status">{assessments.length} of {report.total} songs shown</p>
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-300">
            <tr>
              <th className="p-4">MMID</th>
              <th className="p-4">Song</th>
              <th className="p-4">Health</th>
              <th className="p-4">V2 rows</th>
              <th className="p-4">Diagnostics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {assessments.map(assessment => (
              <tr key={assessment.mmid} className="align-top">
                <td className="p-4 font-mono">{assessment.mmid}</td>
                <td className="p-4">
                  <Link
                    href={`/admin/songs/${assessment.mmid}/edit`}
                    className="font-medium underline decoration-zinc-600 underline-offset-4 hover:text-indigo-300"
                  >
                    {assessment.songName}
                  </Link>
                </td>
                <td className="p-4">
                  <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${statusStyle[assessment.status]}`}>
                    {statusLabel[assessment.status]}
                  </span>
                </td>
                <td className="p-4 font-mono text-zinc-300">
                  {assessment.preview
                    ? assessment.preview.entries.filter(entry => entry.kind === "line").length
                    : "—"}
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
                  ) : (
                    <span className="text-emerald-300">No issues detected</span>
                  )}
                </td>
              </tr>
            ))}
            {!assessments.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">No songs match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
