/** Offline analysis. No database access and no generated romanization changes. */
export function normalizeBurmese(value) {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

export function normalizeRomanized(value) {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

const validSongId = value => Number.isSafeInteger(value) && value >= 0;

/** Convert a sanitized song export into independently reviewable line pairs. */
export function extractReferences(songs, trustedKeys = new Set(), trustAll = false) {
  if (!Array.isArray(songs)) throw new Error("Expected an array of songs");
  const records = [];
  const problems = [];
  for (const song of songs) {
    if (!song || !validSongId(song.mmid)) {
      problems.push({mmid: null, reason: "Invalid song ID"});
      continue;
    }
    const entries = song.lyricsV2?.entries;
    if (song.lyricsV2?.version !== 2 || !Array.isArray(entries)) {
      problems.push({mmid: song.mmid, reason: "Missing or unsupported lyricsV2"});
      continue;
    }
    for (const [index, entry] of entries.entries()) {
      if (entry?.kind === "break") continue;
      if (entry?.kind !== "line" || typeof entry.burmese !== "string" || typeof entry.romanized !== "string") {
        problems.push({mmid: song.mmid, index, reason: "Invalid line entry"});
        continue;
      }
      const burmese = normalizeBurmese(entry.burmese);
      const romanized = normalizeRomanized(entry.romanized);
      if (!burmese || !romanized) {
        problems.push({mmid: song.mmid, index, reason: "Empty source or romanization"});
        continue;
      }
      const key = `${song.mmid}:${index}`;
      records.push({
        key, mmid: song.mmid, index, burmese, romanized,
        trust: trustAll || trustedKeys.has(key) ? "reviewed" : "provisional",
        updatedAt: typeof song.updatedAt === "string" ? song.updatedAt : null,
      });
    }
  }
  const knownKeys = new Set(records.map(record => record.key));
  for (const key of trustedKeys) {
    if (!knownKeys.has(key)) problems.push({mmid: null, reason: `Trusted key not found: ${key}`});
  }
  return {records, problems};
}

export function auditReferences(records, problems = []) {
  const groups = new Map();
  for (const record of records) {
    const group = groups.get(record.burmese) ?? [];
    group.push(record);
    groups.set(record.burmese, group);
  }
  const repeated = [];
  const conflicts = [];
  for (const [burmese, examples] of groups) {
    if (examples.length < 2) continue;
    const variants = new Map();
    for (const example of examples) {
      const occurrences = variants.get(example.romanized) ?? [];
      occurrences.push(example.key);
      variants.set(example.romanized, occurrences);
    }
    const item = {
      burmese, count: examples.length,
      variants: [...variants].map(([romanized, keys]) => ({romanized, keys})),
    };
    if (variants.size > 1) conflicts.push(item);
    else repeated.push(item);
  }
  repeated.sort((a, b) => b.count - a.count || a.burmese.localeCompare(b.burmese));
  conflicts.sort((a, b) => b.count - a.count || a.burmese.localeCompare(b.burmese));
  const reviewed = records.filter(record => record.trust === "reviewed");
  return {
    summary: {
      songs: new Set(records.map(record => record.mmid)).size,
      linePairs: records.length,
      reviewedPairs: reviewed.length,
      provisionalPairs: records.length - reviewed.length,
      uniqueBurmeseLines: groups.size,
      repeatedLines: repeated.length,
      conflictingLines: conflicts.length,
      invalidEntries: problems.length,
      // A leave-one-out estimate of exact line reuse; this is not model accuracy.
      repeatCoveragePercent: records.length ? Number((100 * records.filter(record => groups.get(record.burmese).length > 1).length / records.length).toFixed(1)) : 0,
    },
    repeated, conflicts, problems,
  };
}
