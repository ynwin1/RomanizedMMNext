# Dependency security baseline

Updated during P2.10.

## Changes applied

- Next.js: `15.1.2` → `15.5.27`
- Mongoose: `8.9.2` → `8.24.4`
- next-intl: `3.26.3` → `4.14.9`
- PostCSS: `8.4.x` → `8.5.28`
- Removed the unused direct `mongodb` dependency; Mongoose owns the MongoDB driver dependency.
- Ran `npm audit fix --package-lock-only` without `--force` to apply compatible transitive fixes.

## Audit result

Before P2.10:

- 18 total vulnerabilities
- 2 critical
- 12 high
- 3 moderate
- 1 low

After P2.10 dependency updates and non-breaking lockfile fixes:

- 7 total vulnerabilities
- 0 critical
- 6 high
- 1 moderate
- 0 low

## Remaining findings

The remaining findings are tied to major-version migrations:

- Tailwind CSS 3 and its build-time glob/watch dependency chain (`chokidar`, `braces`, `micromatch`, `fast-glob`). npm proposes Tailwind CSS 4 as the remediation.
- Next.js 15.5.27 still pins an older internal PostCSS version. npm proposes Next.js 16 as the remediation for that remaining audit path.

These major migrations are intentionally not forced in P2.10 because they can change build/runtime behavior. They should be handled as dedicated upgrades with migration-specific regression testing.

Do not use `npm audit fix --force` as a blanket remediation.
