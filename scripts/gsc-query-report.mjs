#!/usr/bin/env node
// Offline analysis of Google Search Console's Queries CSV export.
// No credentials, tracking, or network requests.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function parseCsv(csv) {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (quoted && csv[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(value); value = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && csv[i + 1] === "\n") i++;
      row.push(value); value = "";
      if (row.some(cell => cell.trim())) rows.push(row);
      row = [];
    } else {
      value += ch;
    }
  }
  if (quoted) throw new Error("Unclosed quoted field in CSV");
  if (value.length || row.length) {
    row.push(value);
    if (row.some(cell => cell.trim())) rows.push(row);
  }
  return rows;
}

const MM = /[\u1000-\u109F\uAA60-\uAA7F]/u;
export function summarizeQueries(csv) {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ""));
  const header = rows.shift()?.map(v => v.trim().toLowerCase()) ?? [];
  const index = Object.fromEntries(["query", "clicks", "impressions", "position"].map(key => [key, header.indexOf(key)]));
  if (Object.values(index).some(n => n < 0)) {
    throw new Error("Expected Google Search Console Queries CSV columns: Query, Clicks, Impressions, Position");
  }
  const groups = {
    burmeseScript: { queries: 0, clicks: 0, impressions: 0, positionWeightedSum: 0 },
    otherScript: { queries: 0, clicks: 0, impressions: 0, positionWeightedSum: 0 },
  };
  for (const row of rows) {
    const query = row[index.query]?.trim() ?? "";
    if (!query) continue;
    const clicks = Number((row[index.clicks] ?? "").replace(/,/g, ""));
    const impressions = Number((row[index.impressions] ?? "").replace(/,/g, ""));
    const position = Number(row[index.position]);
    if (![clicks, impressions, position].every(Number.isFinite) || clicks < 0 || impressions < 0 || position < 0) {
      throw new Error("Invalid metrics for query: " + query);
    }
    const group = groups[MM.test(query) ? "burmeseScript" : "otherScript"];
    group.queries++;
    group.clicks += clicks;
    group.impressions += impressions;
    group.positionWeightedSum += position * impressions;
  }
  return Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, {
    queries: value.queries,
    clicks: value.clicks,
    impressions: value.impressions,
    ctrPercent: value.impressions ? Number((100 * value.clicks / value.impressions).toFixed(2)) : 0,
    averagePosition: value.impressions ? Number((value.positionWeightedSum / value.impressions).toFixed(2)) : null,
  }]));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error("Usage: node scripts/gsc-query-report.mjs path/to/Queries.csv");
    const report = summarizeQueries(readFileSync(process.argv[2], "utf8"));
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } catch (error) {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  }
}
