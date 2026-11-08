import test from "node:test";
import assert from "node:assert/strict";
import { coverRateIdentity, coverRateWindow, COVER_WINDOW_MS } from "@/modules/songs/infrastructure/song-cover.rate-limit";
import { readCoverSubmissionBody } from "@/modules/songs/application/song-cover.body";

test("rate window resets at hour boundaries, with a positive retry delay", () => {
  const one = coverRateWindow(12_000);
  assert.equal(one.start,0);
  assert.equal(one.retryAfterSeconds,3588);
  const two=coverRateWindow(COVER_WINDOW_MS);
  assert.equal(two.start,COVER_WINDOW_MS);
  assert.equal(two.retryAfterSeconds,3600);
});

test("client-controlled forwarding headers do not become actor identities", () => {
  const trusted = new Request("https://romanizedmm.com", {headers:{"x-vercel-forwarded-for":"203.0.113.11","x-forwarded-for":"1.2.3.4"}});
  const spoofed = new Request("https://romanizedmm.com", {headers:{"x-forwarded-for":"99.88.77.66"}});
  const anonymous = new Request("https://romanizedmm.com");
  assert.equal(coverRateIdentity(spoofed,"secret"),coverRateIdentity(anonymous,"secret"));
  assert.notEqual(coverRateIdentity(trusted,"secret"),coverRateIdentity(anonymous,"secret"));
  assert.notEqual(coverRateIdentity(trusted,"secret"),coverRateIdentity(trusted,"other"));
  assert.doesNotMatch(coverRateIdentity(trusted,"secret"),/203\.0\.113/);
});

test("bounded request parsing permits valid content and rejects oversized chunked bodies", async () => {
  const req = (body:string) => new Request("https://romanizedmm.com", {method:"POST",body});
  assert.equal(await readCoverSubmissionBody(req('{"x":1}')), '{"x":1}');
  assert.equal(await readCoverSubmissionBody(req("x".repeat(4097))),null);
  assert.equal(await readCoverSubmissionBody(req("x".repeat(4096))),"x".repeat(4096));
  assert.equal(await readCoverSubmissionBody(req("é".repeat(2049))),null);
});
