import test from "node:test";
import assert from "node:assert/strict";
import { ArtistType } from "@/modules/artists/domain/artist.types";
import { CreateArtistSchema, ArtistContentSchema } from "@/modules/artists/application/artist.validation";
import { ArtistService } from "@/modules/artists/application/artist.service";
import type { IArtistRepository } from "@/modules/artists/application/artist.repository";
import { ArtistConflictError, DuplicateArtistError } from "@/modules/artists/application/artist-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { artistFormInput } from "@/app/admin/artists/artist-form.data";
import { createArtistActionHandler } from "@/app/admin/artists/artist-action-handler";

const content = {
  name: "Artist",
  imageLink: "https://example.com/artist.jpg",
  type: ArtistType.Singer,
  musicGenre: ["Pop"],
  songs: [17, 22],
};
const artist = { id: "a1", slug: "artist", likes: 0, ...content };

function repository(overrides: Partial<IArtistRepository> = {}): IArtistRepository {
  return {
    listAdmin: async () => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    countAdmin: async () => 0,
    findBySlug: async () => artist,
    findForEdit: async () => ({ ...artist, revision: 0 }),
    findFirstBySlugs: async () => artist,
    listCatalogue: async () => ({ artists: [], totalPages: 0 }),
    create: async input => ({ id: "a1", likes: input.likes ?? 0, ...input }),
    update: async (_slug, _revision, input) => ({ id: "a1", slug: "artist", likes: 0, ...input }),
    ...overrides,
  };
}

function form() {
  const value = new FormData();
  value.set("name", content.name);
  value.set("slug", "artist");
  value.set("imageLink", content.imageLink);
  value.set("type", content.type);
  value.set("musicGenre", "Pop");
  value.set("songs", "17\n22");
  return value;
}

test("artist validation normalizes identity and validates nested profile data", () => {
  const parsed = CreateArtistSchema.parse({
    ...content,
    name: "  Artist  ",
    slug: "artist",
    members: [{ name: " Member ", slug: "member", imageLink: "https://example.com/member.jpg" }],
    socials: { spotify: "https://open.spotify.com/artist/example" },
  });
  assert.equal(parsed.name, "Artist");
  assert.equal(parsed.members?.[0].name, "Member");
});

test("artist validation rejects unsafe URLs, unsupported types, duplicate songs, unknown fields and mutable slug on edits", () => {
  for (const change of [
    { imageLink: "javascript:alert(1)" },
    { type: "" },
    { musicGenre: [] },
    { songs: [17, 17] },
    { songs: [0] },
    { members: [{ name: "", slug: "Bad Slug" }] },
    { socials: { spotify: "ftp://example.com" } },
    { id: "injected" },
  ]) assert.equal(CreateArtistSchema.safeParse({ ...content, slug: "artist", ...change }).success, false);
  assert.equal(ArtistContentSchema.safeParse({ ...content, slug: "changed" }).success, false);
});

test("artist form decoding clears optional values and parses lists, members and socials", () => {
  const value = form();
  value.set("bannerLink", "");
  value.set("origin", "Yangon\n\n Myanmar ");
  value.set("labels", "Label A\nLabel B");
  value.set("members", JSON.stringify([{ name: "Member", slug: "member" }]));
  value.set("spotify", "https://open.spotify.com/artist/example");
  const parsed = artistFormInput(value, true);
  assert.equal(parsed.bannerLink, undefined);
  assert.deepEqual(parsed.origin, ["Yangon", "Myanmar"]);
  assert.deepEqual(parsed.songs, ["17", "22"]);
  assert.deepEqual(parsed.members, [{ name: "Member", slug: "member" }]);
  assert.deepEqual(parsed.socials, { spotify: "https://open.spotify.com/artist/example" });
  assert.equal(artistFormInput(value, false).slug, undefined);
  value.set("members", "{");
  assert.equal(artistFormInput(value, true).members, null);
});

test("artist service validates before create and delegates normalized input", async () => {
  let received: unknown;
  const service = new ArtistService(repository({
    create: async input => {
      received = input;
      return { id: "a1", likes: input.likes ?? 0, ...input };
    },
  }));
  await assert.rejects(() => service.createArtist({ ...content, slug: "Invalid Slug" }));
  assert.equal(received, undefined);
  const created = await service.createArtist({ ...content, slug: "artist", songs: ["17", "22"] });
  assert.equal(created.slug, "artist");
  assert.deepEqual(received, { ...content, slug: "artist" });
});

test("artist update distinguishes missing records from stale revisions", async () => {
  const stale = new ArtistService(repository({ update: async () => null }));
  await assert.rejects(() => stale.updateArtist("artist", 0, content), ArtistConflictError);
  const missing = new ArtistService(repository({
    update: async () => null,
    findBySlug: async () => null,
  }));
  await assert.rejects(() => missing.updateArtist("artist", 0, content), NotFoundError);
});

test("artist edit reads and updates validate slug, revision and immutable fields before persistence", async () => {
  let calls = 0;
  const service = new ArtistService(repository({
    update: async () => { calls++; return artist; },
    findForEdit: async () => { calls++; return null; },
  }));
  await assert.rejects(() => service.getArtistForEdit("Invalid Slug"));
  await assert.rejects(() => service.updateArtist("artist", -1, content));
  await assert.rejects(() => service.updateArtist("artist", 0, { ...content, slug: "other" }));
  assert.equal(calls, 0);
  await assert.rejects(() => service.getArtistForEdit("artist"), NotFoundError);
});

test("both artist actions authorize before writes", async () => {
  for (const mode of ["create", "update"] as const) {
    let writes = 0;
    const denied = new Error("auth redirect");
    const handler = createArtistActionHandler({
      authorize: async () => { throw denied; },
      artists: {
        createArtist: async () => { writes++; return artist; },
        updateArtist: async () => { writes++; return artist; },
      },
      saved: () => { throw new Error("unexpected redirect"); },
      logFailure: () => {},
    });
    await assert.rejects(
      () => mode === "create" ? handler.create({}, form()) : handler.update("artist", 0, {}, form()),
      error => error === denied,
    );
    assert.equal(writes, 0);
  }
});

test("successful artist actions redirect only after persistence", async () => {
  for (const mode of ["create", "update"] as const) {
    const calls: string[] = [];
    const handler = createArtistActionHandler({
      authorize: async () => { calls.push("auth"); },
      artists: {
        createArtist: async () => { calls.push("write"); return artist; },
        updateArtist: async (slug, revision, input) => {
          assert.equal(slug, "artist");
          assert.equal(revision, 2);
          assert.equal((input as Record<string, unknown>).slug, undefined);
          calls.push("write");
          return artist;
        },
      },
      saved: slug => { calls.push("saved:" + slug); throw new Error("success redirect"); },
      logFailure: () => {},
    });
    await assert.rejects(
      () => mode === "create" ? handler.create({}, form()) : handler.update("artist", 2, {}, form()),
      /success redirect/,
    );
    assert.deepEqual(calls, ["auth", "write", "saved:artist"]);
  }
});

test("artist action failures surface validation/conflicts without leaking internal errors", async () => {
  for (const error of [
    new DuplicateArtistError(),
    new ArtistConflictError(),
    new NotFoundError("Artist not found"),
    new Error("mongodb://secret"),
  ]) {
    let saved = false;
    const handler = createArtistActionHandler({
      authorize: async () => {},
      artists: {
        createArtist: async () => { throw error; },
        updateArtist: async () => { throw error; },
      },
      saved: () => { saved = true; throw new Error("redirect"); },
      logFailure: () => {},
    });
    const result = await handler.create({}, form());
    assert.equal(saved, false);
    assert.doesNotMatch(result.message ?? "", /secret/);
    if (!(error.constructor === Error)) assert.equal(result.message, error.message);
  }

  const handler = createArtistActionHandler({
    authorize: async () => {},
    artists: new ArtistService(repository()),
    saved: () => { throw new Error("unexpected redirect"); },
    logFailure: () => {},
  });
  const invalid = form();
  invalid.set("name", "");
  const result = await handler.create({}, invalid);
  assert.ok(result.errors?.name.length);
});
