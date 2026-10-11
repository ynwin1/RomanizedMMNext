import test from "node:test";
import assert from "node:assert/strict";
import CountryStat from "@/modules/analytics/infrastructure/country-stat.model";
import {MongoCountryStatRepository} from "@/modules/analytics/infrastructure/country-stat.repository";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");

test("country counters upsert by unique country name, not varying geolocation codes", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown, update: unknown, options: unknown;
  t.mock.method(CountryStat, "findOneAndUpdate", (f: unknown, u: unknown, o: unknown) => {
    filter = f; update = u; options = o;
    return {lean: async () => ({_id: "stat-1", country: "United Kingdom", code: "GB", count: 4})};
  });
  const result = await new MongoCountryStatRepository().increment("United Kingdom", "GB");
  assert.deepEqual(filter, {country: "United Kingdom"});
  assert.deepEqual(update, {$inc: {count: 1}, $set: {code: "GB"}});
  assert.deepEqual(options, {upsert: true, new: true});
  assert.equal(result?.count, 4);
});

test("country counter retries a unique-country insertion race without upserting again", async t => {
  t.mock.method(database, "default", async () => {});
  const calls: unknown[] = [];
  t.mock.method(CountryStat, "findOneAndUpdate", (filter: unknown, update: unknown, options: unknown) => {
    calls.push({filter, update, options});
    if (calls.length === 1) return {lean: async () => {throw {code: 11000, keyPattern: {country: 1}};}};
    return {lean: async () => ({country: "United Kingdom", code: "UK", count: 2})};
  });
  const stat = await new MongoCountryStatRepository().increment("United Kingdom", "UK");
  assert.equal(stat?.count, 2);
  assert.equal(calls.length, 2);
  assert.deepEqual((calls[1] as {options: unknown}).options, {new: true});
});

test("country counter does not swallow unrelated database failures", async t => {
  t.mock.method(database, "default", async () => {});
  const failure = {code: 11000, keyPattern: {code: 1}};
  t.mock.method(CountryStat, "findOneAndUpdate", () => ({lean: async () => {throw failure;}}));
  await assert.rejects(() => new MongoCountryStatRepository().increment("Canada", "CA"), error => error === failure);
});
