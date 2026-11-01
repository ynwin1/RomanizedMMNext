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

export function nudgeTime(value: number | undefined, deltaMs: number): number | undefined {
  if (value === undefined) return undefined;
  return Math.max(0, Math.round(value + deltaMs));
}

export function activeTimingIndex(lines: Array<{entryIndex: number; startMs: number; endMs: number}>, nowMs: number): number | null {
  const active = lines.find(line => nowMs >= line.startMs && nowMs < line.endMs);
  return active?.entryIndex ?? null;
}

export function validateDraftTimes(rows: Record<number, {startMs?: number; endMs?: number}>): string[] {
  const errors: string[] = [];
  let lastEnd = -1;
  for (const [index, row] of Object.entries(rows).sort((a,b)=>Number(a[0])-Number(b[0]))) {
    const {startMs, endMs} = row;
    if (startMs === undefined && endMs === undefined) continue;
    if (startMs === undefined || endMs === undefined) {
      errors.push(`Line ${Number(index)+1}: set both start and end to save this line.`);
      continue;
    }
    if (!Number.isInteger(startMs) || !Number.isInteger(endMs) || startMs < 0 || endMs <= startMs) {
      errors.push(`Line ${Number(index)+1}: end must be after start, with non-negative times.`);
    }
    if (startMs < lastEnd) errors.push(`Line ${Number(index)+1}: overlaps a preceding line.`);
    lastEnd = Math.max(lastEnd, endMs);
  }
  return errors;
}
