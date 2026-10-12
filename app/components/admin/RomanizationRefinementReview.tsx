"use client";

import type {RomanizationRefinement} from "@/modules/content-generation/domain/content-generation.types";

export default function RomanizationRefinementReview({
  refinements, currentLines, onRestore,
}: {
  refinements: RomanizationRefinement[];
  currentLines: string[];
  onRestore?: (index: number, original: string) => void;
}) {
  if (!refinements.length) return null;
  const current = refinements.filter(change => currentLines[change.index] === change.corrected);
  if (!current.length) return null;
  return <section aria-label="Romanization refinement details" className="mt-4 rounded-lg border border-emerald-800/70 bg-emerald-950/20 p-4">
    <h3 className="font-semibold text-emerald-200">Romanization refinements</h3>
    <p className="mt-1 text-sm text-zinc-300">
      {current.filter(change => change.kind !== "conflict").length} line{current.filter(change => change.kind !== "conflict").length === 1 ? "" : "s"} updated using your corrected song catalogue.
      Check each suggestion and edit the lyrics freely.
    </p>
    <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
      {current.map(change => <div key={`${change.index}-${change.kind}`} className="rounded border border-zinc-700 bg-zinc-900/70 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-zinc-100">Line {change.index + 1}</span>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">{change.kind === "exact-line" ? "Exact line" : change.kind === "word" ? "Word match" : "Conflict notice"}</span>
          {change.hasConflict && <span className="rounded bg-amber-950 px-2 py-0.5 text-xs text-amber-200">Spelling variants exist</span>}
        </div>
        <p className="mt-2 break-words text-zinc-400"><span className="font-medium">{change.kind === "conflict" ? "Current:" : "AI:"}</span> {change.original}</p>
        {change.kind !== "conflict" && <p className="mt-1 break-words text-emerald-200"><span className="font-medium">Refined:</span> {change.corrected}</p>}
        {change.referenceMmids.length > 0 && <p className="mt-2 text-xs text-zinc-400">Reference song ID{change.referenceMmids.length === 1 ? "" : "s"}: {change.referenceMmids.join(", ")}</p>}
        {onRestore && change.kind !== "conflict" && <button type="button" onClick={() => onRestore(change.index, change.original)} className="mt-2 rounded border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:border-zinc-400">
          Restore AI version
        </button>}
      </div>)}
    </div>
  </section>;
}
