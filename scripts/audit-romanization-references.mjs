import {readFile, mkdir, writeFile, access} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {extractReferences, auditReferences} from "./romanization-reference-core.mjs";

const [inputArg, outputArg, ...options] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  console.error("Usage: node scripts/audit-romanization-references.mjs <songs.json> <audit.json> [--trust-all | --trusted-keys path] [--overwrite]");
  process.exitCode = 1;
} else {
  const input = resolve(inputArg);
  const output = resolve(outputArg);
  if (input === output) throw new Error("Input and output paths must be different.");
  const overwrite = options.includes("--overwrite");
  const trustAll = options.includes("--trust-all");
  const trustedIndex = options.indexOf("--trusted-keys");
  if (trustAll && trustedIndex >= 0) throw new Error("Choose --trust-all or --trusted-keys, not both");
  if (trustedIndex >= 0 && !options[trustedIndex + 1]) throw new Error("--trusted-keys requires a file path");
  const trustedKeys = trustedIndex >= 0
    ? new Set((await readFile(resolve(options[trustedIndex + 1]), "utf8")).split(/\r?\n/u).map(line => line.trim()).filter(line => line && !line.startsWith("#")))
    : new Set();
  const parsed = JSON.parse(await readFile(input, "utf8"));
  if (parsed.format !== "romanizedmm-reference-export-v1") throw new Error("Unsupported reference export format");
  const {records, problems} = extractReferences(parsed.songs, trustedKeys, trustAll);
  const report = auditReferences(records, problems);
  if (!overwrite) {
    try {await access(output); throw new Error(`File already exists: ${output}. Use --overwrite explicitly.`);} catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  await mkdir(dirname(output), {recursive: true});
  await writeFile(output, `${JSON.stringify({format: "romanizedmm-reference-audit-v1", ...report, references: records}, null, 2)}\n`, {flag: overwrite ? "w" : "wx", mode: 0o600});
  console.log(`Audited ${report.summary.linePairs} line pairs: ${report.summary.conflictingLines} conflicts, ${report.summary.reviewedPairs} explicitly reviewed. Saved ${output}`);
}
