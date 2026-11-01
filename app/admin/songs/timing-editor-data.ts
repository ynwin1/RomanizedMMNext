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

/** Diagnose conflicts using displayed lyric rows, not LyricsV2 break-inclusive indices. */
export function validateDraftTimes(
  rows: Record<number, {startMs?: number; endMs?: number}>,
  visibleEntryIndices?: number[],
): string[] {
  const errors: string[] = [];
  const sorted = Object.entries(rows).sort((a, b) => Number(a[0]) - Number(b[0]));
  const visibleNumber = (entryIndex: number) => {
    const index = visibleEntryIndices?.indexOf(entryIndex) ?? -1;
    return index >= 0 ? index + 1 : entryIndex + 1;
  };
  const seconds = (ms: number) => (ms / 1000).toFixed(2) + "s";
  let lastEnd = -1;
  let lastEntry = -1;
  for (const [index, row] of sorted) {
    const entryIndex = Number(index);
    const label = `Line ${visibleNumber(entryIndex)}:`;
    const {startMs, endMs} = row;
    if (startMs === undefined && endMs === undefined) continue;
    if (startMs === undefined || endMs === undefined) {
      errors.push(`${label} set both start and end (start: ${startMs === undefined ? "unset" : seconds(startMs)}, end: ${endMs === undefined ? "unset" : seconds(endMs)}).`);
      continue;
    }
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) ||
        !Number.isInteger(startMs) || !Number.isInteger(endMs) ||
        startMs < 0 || endMs <= startMs) {
      errors.push(`${label} end must be after start (start: ${seconds(startMs)}, end: ${seconds(endMs)}).`);
      continue;
    }
    if (startMs < lastEnd) {
      errors.push(`${label} starts at ${seconds(startMs)} but Line ${visibleNumber(lastEntry)} ends at ${seconds(lastEnd)} (overlap: ${seconds(lastEnd - startMs)}).`);
    }
    if (endMs > lastEnd) {
      lastEnd = endMs;
      lastEntry = entryIndex;
    }
  }
  return errors;
}
