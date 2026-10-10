import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("Search Console Queries report separates Burmese-script searches and weights position by impressions", () => {
  const dir = mkdtempSync(join(tmpdir(), "romanizedmm-gsc-"));
  try {
    const file = join(dir, "Queries.csv");
    writeFileSync(file, "\uFEFFQuery,Clicks,Impressions,CTR,Position\r\n\"မင်း, သီချင်းစာသား\",2,100,2%,5\r\nအချစ်,1,50,2%,3\r\n\"song, lyrics\",3,200,1.5%,10\r\n", "utf8");
    const output = execFileSync(process.execPath, [resolve("scripts/gsc-query-report.mjs"), file], { encoding: "utf8" });
    const result = JSON.parse(output);
    assert.deepEqual(result.burmeseScript, { queries: 2, clicks: 3, impressions: 150, ctrPercent: 2, averagePosition: 4.33 });
    assert.deepEqual(result.otherScript, { queries: 1, clicks: 3, impressions: 200, ctrPercent: 1.5, averagePosition: 10 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Search Console report rejects invalid exports rather than showing misleading figures", () => {
  const dir = mkdtempSync(join(tmpdir(), "romanizedmm-gsc-"));
  try {
    const file = join(dir, "bad.csv");
    writeFileSync(file, "Keyword,Views\nsample,2\n");
    assert.throws(
      () => execFileSync(process.execPath, [resolve("scripts/gsc-query-report.mjs"), file], { stdio: "pipe" }),
      /Command failed/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
