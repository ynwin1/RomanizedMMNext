/** Keep incomplete rows in the editor but only persist complete pairs. */
export function secondsToMilliseconds(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error("Time must be a finite non-negative number");
  return Math.round(value * 1000);
}

export function draftTimingLines(rows: Record<number, {startMs?: number; endMs?: number}>) {
  return Object.entries(rows).flatMap(([index, row]) =>
    row.startMs !== undefined && row.endMs !== undefined
      ? [{entryIndex: Number(index), startMs: row.startMs, endMs: row.endMs}] : [])
    .sort((a, b) => a.entryIndex - b.entryIndex);
}
