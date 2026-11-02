/** Only backfill never-analyzed songs; preserve drafts and published history. */
export function selectMissingMoodCandidates<T extends {mmid:number}>(songs:T[],existing:Set<number>,limit=20):T[] {
 return songs.filter(song=>!existing.has(song.mmid)).slice(0,Math.max(0,Math.min(20,limit)));
}
