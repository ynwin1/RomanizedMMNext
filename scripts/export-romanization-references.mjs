import {mkdir, writeFile, access} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import mongoose from "mongoose";

const args = process.argv.slice(2);
const paths = args.filter(arg => arg !== "--overwrite");
if (paths.length > 1) throw new Error("Usage: node scripts/export-romanization-references.mjs [output.json] [--overwrite]");
const output = resolve(paths[0] ?? ".romanization-work/songs.json");
const overwrite = args.includes("--overwrite");
if (!overwrite) {
  try {await access(output); throw new Error(`File already exists: ${output}. Use --overwrite explicitly.`);} catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Set MONGODB_URI to a read-only MongoDB connection before exporting.");
try {
  await mongoose.connect(uri, {serverSelectionTimeoutMS: 10000});
  // Projection intentionally excludes requesters, user information and other song metadata.
  const songs = await mongoose.connection.db.collection("songs").find({}, {
    projection: {_id: 0, mmid: 1, lyricsV2: 1, updatedAt: 1},
  }).sort({mmid: 1}).toArray();
  const sanitized = songs.map(song => ({
    mmid: song.mmid,
    lyricsV2: song.lyricsV2 ? {
      version: song.lyricsV2.version,
      entries: Array.isArray(song.lyricsV2.entries) ? song.lyricsV2.entries.map(entry => ({
        kind: entry.kind,
        ...(entry.kind === "line" ? {burmese: entry.burmese, romanized: entry.romanized} : {}),
      })) : [],
    } : null,
    updatedAt: song.updatedAt?.toISOString?.() ?? null,
  }));
  await mkdir(dirname(output), {recursive: true});
  await writeFile(output, `${JSON.stringify({format: "romanizedmm-reference-export-v1", songs: sanitized}, null, 2)}\n`, {flag: overwrite ? "w" : "wx", mode: 0o600});
  console.log(`Exported ${sanitized.length} songs to ${output}. Treat this file as private lyric data.`);
} finally {
  await mongoose.disconnect();
}
