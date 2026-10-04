import Link from "next/link";
import { adminReads } from "../../admin.data";
import { requireAdmin } from "@/infrastructure/auth";
import { lyricsMeaningReviewDraftRepository } from "@/modules/songs";
import type { LyricsMigrationRepairStrategy, LyricsMigrationStatus } from "@/modules/songs";
import { migrateLowRiskLyricsV2Action } from "./migration-actions";

const statusStyle: Record<LyricsMigrationStatus, string> = {
  SAFE: "border-emerald-800 bg-emerald-950/40 text-emerald-200",
  WARNING: "border-amber-800 bg-amber-950/40 text-amber-200",
  MANUAL_REVIEW: "border-orange-800 bg-orange-950/40 text-orange-200",
  INVALID: "border-red-800 bg-red-950/40 text-red-200",
};

const repairStyle: Record<LyricsMigrationRepairStrategy, string> = {
  READY: "border-emerald-800 bg-emerald-950/40 text-emerald-200",
  DETERMINISTIC_REPAIR: "border-cyan-800 bg-cyan-950/40 text-cyan-200",
  AI_MEANING_ALIGNMENT: "border-indigo-800 bg-indigo-950/40 text-indigo-200",
  AI_ROMANIZATION_REPAIR: "border-violet-800 bg-violet-950/40 text-violet-200",
  MANUAL_REVIEW: "border-red-800 bg-red-950/40 text-red-200",
};

export default async function LyricsV2MigrationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [report, repairs, draftMmids] = await Promise.all([
    adminReads.lyricsMigrationReadiness(),
    adminReads.lyricsMigrationRepairs(),
    lyricsMeaningReviewDraftRepository.listMmids(),
  ]);
  const draftMmidSet = new Set(draftMmids);
  const migrated = typeof params.migrated === "string" ? params.migrated : undefined;
  const alreadyV2 = typeof params.alreadyV2 === "string" ? params.alreadyV2 : undefined;
  const skippedConcurrent = typeof params.skippedConcurrent === "string" ? params.skippedConcurrent : undefined;
  const migrationError = typeof params.migrationError === "string" ? params.migrationError : undefined;
  const saveResult = typeof params.saveResult === "string" ? params.saveResult : undefined;
  const savedMmid = typeof params.mmid === "string" ? params.mmid : undefined;

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

      {migrated !== undefined && (
        <div role="status" className="mt-6 rounded border border-emerald-800 bg-emerald-950/40 p-4 text-emerald-200">
          Migration complete: {migrated} songs migrated, {alreadyV2 ?? "0"} already on V2, {skippedConcurrent ?? "0"} skipped because they changed concurrently.
        </div>
      )}
      {migrationError && (
        <div role="alert" className="mt-6 rounded border border-red-800 bg-red-950/40 p-4 text-red-200">
          {migrationError === "confirmation"
            ? "Type MIGRATE_LOW_RISK exactly before running the migration."
            : "The migration stopped after an unexpected error. It is safe to rerun because writes are idempotent."}
        </div>
      )}
      {saveResult === "meaning-reviewed" && (
        <div role="status" className="mt-6 rounded border border-emerald-800 bg-emerald-950/40 p-4 text-emerald-200">
          Reviewed lyricsV2 saved{savedMmid ? ` for MMID ${savedMmid}` : ""}. Its AI review draft has been cleared.
        </div>
      )}

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-xl font-semibold">Phase 7 auto-repair plan</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Burmese and existing Romanization are treated as protected anchors. This is still preview-only and performs no migration writes.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {(["READY", "DETERMINISTIC_REPAIR", "AI_MEANING_ALIGNMENT", "AI_ROMANIZATION_REPAIR", "MANUAL_REVIEW"] as const).map(strategy => (
            <div key={strategy} className={`rounded-lg border p-4 ${repairStyle[strategy]}`}>
              <p className="text-xs font-semibold">{strategy.replaceAll("_", " ")}</p>
              <p className="mt-2 text-2xl font-semibold">{repairs.counts[strategy]}</p>
            </div>
          ))}
        </div>

        <form action={migrateLowRiskLyricsV2Action} className="mt-6 rounded-lg border border-zinc-700 bg-zinc-950/60 p-4">
          <h3 className="font-semibold">Migrate low-risk songs</h3>
          <p className="mt-2 text-sm text-zinc-400">
            This writes lyricsV2 only for READY and DETERMINISTIC REPAIR songs. AI Meaning Alignment and AI Romanization Repair songs are excluded.
            Existing lyricsV2 is never overwritten.
          </p>
          <label className="mt-4 block max-w-md text-sm">
            Type <span className="font-mono text-zinc-200">MIGRATE_LOW_RISK</span> to confirm
            <input
              name="confirmation"
              autoComplete="off"
              className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100"
            />
          </label>
          <button type="submit" className="mt-4 rounded bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500">
            Migrate READY + deterministic songs
          </button>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-300">
            <tr>
              <th className="p-4">MMID</th>
              <th className="p-4">Song</th>
              <th className="p-4">Status</th>
              <th className="p-4">Repair plan</th>
              <th className="p-4">Diagnostics</th>
              <th className="p-4">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {report.assessments.map(assessment => {
              const repair = repairs.plans.find(plan => plan.mmid === assessment.mmid);
              return (
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
                  {repair ? (
                    <div>
                      <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${repairStyle[repair.strategy]}`}>
                        {repair.strategy.replaceAll("_", " ")}
                      </span>
                      <p className="mt-2 max-w-md text-xs text-zinc-400">{repair.reason}</p>
                      <p className="mt-2 font-mono text-xs text-zinc-500">
                        B {repair.sourceLyricLines} · R {repair.romanizedLines} · M {repair.meaningLines}
                      </p>
                    </div>
                  ) : <span className="text-zinc-500">No plan</span>}
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
                    ? <span className="text-emerald-300">V2 saved · {assessment.preview.entries.filter(entry => entry.kind === "line").length} lyric rows</span>
                    : repair?.strategy === "AI_MEANING_ALIGNMENT"
                      ? (
                        <Link
                          href={`/admin/migrations/lyrics-v2/${assessment.mmid}/meaning-preview`}
                          className="underline decoration-zinc-600 underline-offset-4 hover:text-indigo-300"
                        >
                          {draftMmidSet.has(assessment.mmid) ? "Continue review" : "Generate AI preview"}
                        </Link>
                      )
                      : "No automatic preview"}
                </td>
              </tr>
            )})}
            {!report.assessments.length && (
              <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No songs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
