import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const {evaluateRomanization} = require("../.test-dist/modules/romanization-references/application/romanization-evaluation.js");

const args = process.argv.slice(2);
if (args.length > 2 || args.includes("--help")) {
  console.log("Usage: npm run evaluate:romanization -- [.romanization-work/songs.json] [maxSongs (1–1000)]");
  process.exit(args.includes("--help") ? 0 : 1);
}
const file = args[0] ?? ".romanization-work/songs.json";
const maxSongs = args[1] === undefined ? 100 : Number(args[1]);
const input = JSON.parse(await readFile(file, "utf8"));
if (input.format !== "romanizedmm-reference-export-v1" || !Array.isArray(input.songs)) {
  throw new Error("Expected a romanizedmm-reference-export-v1 file from the R1 exporter");
}
const report = evaluateRomanization(input.songs, maxSongs);
console.log(JSON.stringify({
  benchmark: "leave-one-song-out; original reviewed lyrics plus artificial single-token typo",
  caveat: "Not a measure of AI-generated accuracy or actual AI-error recovery. No live AI calls are made.",
  ...report,
}, null, 2));
