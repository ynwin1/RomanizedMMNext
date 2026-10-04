"use client";

import { useMemo, useState } from "react";
import type { LyricsMeaningAlignmentPreview } from "@/modules/songs/domain/lyrics-meaning-alignment.types";

type Row = LyricsMeaningAlignmentPreview["rows"][number];

export function MeaningReviewEditor({
  rows,
  action,
}: {
  rows: Row[];
  action: (form: FormData) => void | Promise<void>;
}) {
  const originals = useMemo(() => rows.map(row => row.meaning), [rows]);
  const [meanings, setMeanings] = useState(originals);
  const invalid = meanings.some(meaning => !meaning.trim());

  function update(index: number, value: string) {
    setMeanings(current => current.map((meaning, position) => position === index ? value : meaning));
  }

  return (
    <form action={action}>
      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-300">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Burmese</th>
              <th className="p-4">Romanized</th>
              <th className="p-4">Meaning</th>
              <th className="p-4">Source</th>
              <th className="p-4">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((row, index) => {
              const edited = row.edited || meanings[index] !== originals[index];
              return (
                <tr key={row.index} className="align-top">
                  <td className="p-4 font-mono text-zinc-500">{row.index + 1}</td>
                  <td className="p-4">{row.burmese}</td>
                  <td className="p-4">{row.romanized}</td>
                  <td className="p-4">
                    <textarea
                      name="meaning"
                      value={meanings[index]}
                      onChange={event => update(index, event.target.value)}
                      rows={2}
                      className="min-w-[320px] w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
                    />
                  </td>
                  <td className="p-4">
                    <span className={
                      "rounded border px-2 py-1 text-xs " +
                      (edited
                        ? "border-blue-700 bg-blue-950/40 text-blue-200"
                        : row.source === "generated"
                          ? "border-violet-700 bg-violet-950/40 text-violet-200"
                          : "border-zinc-700 bg-zinc-900 text-zinc-300")
                    }>
                      {edited ? "edited" : row.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={
                      "rounded border px-2 py-1 text-xs " +
                      (edited
                        ? "border-blue-700 bg-blue-950/40 text-blue-200"
                        : row.confidence === "high"
                          ? "border-emerald-700 bg-emerald-950/40 text-emerald-200"
                          : row.confidence === "medium"
                            ? "border-amber-700 bg-amber-950/40 text-amber-200"
                            : "border-red-700 bg-red-950/40 text-red-200")
                    }>
                      {edited ? "manual" : row.confidence}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={invalid}
          className="rounded border border-zinc-700 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:border-indigo-400"
        >
          Save review draft
        </button>
        <button
          type="submit"
          name="intent"
          value="approve"
          disabled={invalid}
          className="rounded bg-indigo-600 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-indigo-500"
        >
          Save reviewed lyricsV2
        </button>
        <p className="text-sm text-zinc-500">
          Saving a draft or approving does not call AI. Burmese and Romanized stay protected.
        </p>
      </div>
    </form>
  );
}
