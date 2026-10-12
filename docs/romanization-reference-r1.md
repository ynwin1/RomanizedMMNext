# Romanization Reference Engine — R1: Private export and audit

R1 is intentionally **offline and non-mutating**: it does not modify MongoDB songs,
call OpenAI, or change lyrics in the admin editor. It prepares and measures the data
needed for a later deterministic correction engine.

## 1. Export from your configured MongoDB

Use a **read-only MongoDB account** against the intended database. Run locally:

```bash
node --env-file=.env.local scripts/export-romanization-references.mjs
```

This creates `.romanization-work/songs.json` with only `mmid`, `updatedAt`, and
Burmese/romanized lyricsV2 line entries. It excludes meanings, user details and
other song metadata. No export is committed or uploaded; the directory is ignored
by Git. Treat lyric exports as private and do not put them in PRs or logs.

If your Node version does not support `--env-file`, supply `MONGODB_URI` through
your shell's normal environment configuration. By default, existing files are
not overwritten. Pass `--overwrite` only when intentionally replacing an export.

## 2. Audit the local export

```bash
node scripts/audit-romanization-references.mjs \
  .romanization-work/songs.json .romanization-work/audit.json
```

The report contains:

- Counts of valid and invalid aligned line pairs.
- Repeated identical Burmese lines and their established romanizations.
- Conflicts: the *same* Burmese line with differing romanizations.
- Exact-repeat coverage, an upper-bound reuse signal **not an accuracy score**.
- Per-line reference keys (`mmid:entryIndex`) for future review.

The audit deliberately does **not** infer word boundaries from spaces or decide
which conflicting romanization is correct.

## 3. Build a trusted reference subset

Existing songs only record lyricsV2, **not reliable manual-review provenance**.
Therefore **all imported lines are provisional by default**. To mark lines you
have actually corrected, create a plain-text file at
`.romanization-work/trusted-keys.txt` containing one `mmid:entryIndex` per line:

```text
# Only lines manually confirmed against the source lyrics
201:0
201:1
204:8
```

Then rerun the audit:

```bash
node scripts/audit-romanization-references.mjs \
  .romanization-work/songs.json .romanization-work/audit.json \
  --trusted-keys .romanization-work/trusted-keys.txt --overwrite
```

Only explicit trusted pairs will be eligible for high-confidence automatic
replacement in a future phase. Unreviewed AI output is never silently elevated
to a trusted rule.

## Next phases

- R2: Exact-line lookup using reviewed references and sentence-case validation.
- R3: Context-aware Burmese phrase matching, conflict policy and uncertainty flags.
- R4: Admin integration that shows suggestions before applying them.
- R5: Held-out evaluation against manually reviewed songs, measuring *new errors*
  as well as avoided corrections. Never benchmark on references used to refine
  the same song.
