# AGENTS.md

Guidance for agents working in `@lglen/awk-changelog-tool` (CLI name: `awkch`).
This is the **project-level** guide; the user/global `AGENTS.md` adds
cross-project rules (tests + docs on every change, commit when done, ask before
opening a PR).

## What this project is

A changelog generator that reads git history and emits Markdown, optionally
enriched with PR descriptions from the GitHub CLI (`gh`). The whole point is
speed: history is read in a **single `git log --numstat` pass** rather than one
`git` invocation per commit. Plain ESM JavaScript with **no build step** — the
`src/` and `bin/` files are published exactly as written. Both a CLI (`awkch`)
and a small programmatic API are supported.

## Commands

```bash
npm test              # node --test test/*.test.js (unit + package integration)
npm run test:package  # only the pack/install integration test (needs npm + registry)
npm run test:coverage # unit suites with coverage + thresholds (no gh/network)
npm run testlog       # write TEST_CHANGELOG.md with PR descriptions
npm run lint          # oxlint --deny-warnings src test bin (config: .oxlintrc.json)
node ./bin/awk-changelog.js --help
```

Requires Node >= 18 (uses the built-in `node:test` runner). `gh` is only needed
for `--pr`; `jq` is bundled through `node-jq`, so no system install is required.

## Layout

| Path | Purpose |
|------|---------|
| `bin/awk-changelog.js` | CLI entry (`awkch`): commander setup, option semantics, incremental mode, file/stdout output |
| `src/index.js` | Public API surface — the only module consumers import |
| `src/changelog.js` | `parseGitLog`, `formatCommit`, `generateChangelog` (no PR data) |
| `src/changelog-pr.js` | PR fetching/matching + `generateChangelogWithPRs` |
| `src/incremental.js` | `mergeIncrementalChangelog` — merges new entries into an existing file |
| `src/pr-progress.js` | TTY progress display while PR details are fetched |
| `src/utils.js` | `exec`/`execSafe`, git-repo check, markdown escaping, date formatting |
| `bash/` | Original awk implementations, kept for users who prefer them |
| `test/basic.test.js` | Unit tests for parsing, formatting, PR matching, incremental merge, progress |
| `test/generate.test.js` | Unit tests for `generateChangelog`/`generateChangelogWithPRs` via injected git/PR runners |
| `test/utils.test.js` | Unit tests for `exec`/`execSafe`/`commandExists`/`escMd`/`formatDate`/`ensureGitRepo` |
| `test/npm-install.test.js` | Integration: pack tarball, install, smoke-test CLI + API |

## Core data flow

1. `ensureGitRepo()` guards every entry point.
2. The starting ref defaults to the root commit (`git rev-list --max-parents=0 HEAD`).
3. History is fetched once with format string
   `%H|%h|%s|%ai|%an <%ae>|%b|%P|%D`. **The `|` delimiter is load-bearing**: fields
   are split naively on `|`, so commit subjects/bodies containing a pipe can shift
   fields. Keep this constraint in mind before changing the format.
4. The range is **inclusive of the start commit**: `"<since>^..HEAD"`, falling
   back to `--root HEAD` when `since` is the root. The PR generator supports
   `excludeSince` (`"<since>..HEAD"`) for incremental runs.
5. `parseGitLog` turns the raw text into `Commit` objects, summing numstat
   `added`/`removed` and collecting `files`; merge commits are detected via 2+
   parents (`%P`). Binary numstat lines (`-`) don't match the digit check and are
   skipped.
6. `formatCommit` renders each commit as a Markdown section (see output contract).

Dates go through `formatDate`, which uses `toUTCString()` (drops the original
offset). Author strings pass through `escMd` when embedded in tables.

## CLI contract (`bin/awk-changelog.js`)

- **stdout is data, stderr is human status.** The changelog goes to stdout (or a
  file); `✅`/`❌` messages go to stderr via `console.error`. Errors exit `1`.
- `--all` is shorthand for `--pr --default`.
- `--default` sets output to `CHANGELOG.md` **unless** `-o/--output` was given.
- `--pr` shows the progress display only when `stderr` is a TTY.
- `-n, --no-email` strips the `<email>` suffix from author names.
- `-f, --fresh` disables incremental mode; an explicit ref or deleting the output
  file also forces a full rebuild.
- Commander is configured with `allowExcessArguments(false)`; the version flag is
  exposed as `-v, -V, --version`.

## Public API contract (`src/index.js`)

```js
generateChangelog(options)        // -> string
generateChangelogWithPRs(options) // -> { changelog: string, prCount: number }
```

Also exported: `parseGitLog`, `formatCommit`, `buildCommitToPR`,
`buildMessageToPR`, `messageKey`. Keep these names/shapes stable — they are the
package's public surface and the README documents them. The two generators also
accept test-only injection points (`run`, `prs`, `fetchMessages`, `noEmail`) that
default to the real git/gh implementations.

## Output contract

Markdown is the actual product, so structural changes are breaking changes:

- Header: `# Changelog`, a `From commit \`<ref>\` (<date>)` line, then a bold
  summary `**N commit(s), M PR(s) matched**` (or `**N commit(s)**` without PRs).
- Each commit: `## <shortHash> — <title>`, a `| Field | Value |` table
  (Hash, Date, Author, Lines, Files, optional Refs, optional Pull Request), an
  optional `### Commit Message`, then `---`.
- PR descriptions are fenced in ```` ``` ```` under `### Pull Request Description`,
  shown **once per PR** on the newest commit of its group.

The summary line format is shared by `src/changelog.js`, `src/changelog-pr.js`,
and `src/incremental.js` — change it in all three places or incremental merges
break.

## PR enrichment (`src/changelog-pr.js`)

PRs are associated with commits in priority order:

1. `commitToPR` — GitHub's `mergeCommit.oid`, covering merge + squash merges.
2. The `(#N)` title marker / `Merge pull request #N` body text.
3. `messageToPR` — joins on normalized commit message (`messageKey`), which
   handles **rebase merges** (SHAs change, messages survive).

Fetching strategy matters: `gh pr list` must **not** request `commits`, or it
exceeds GitHub's GraphQL node limit. Instead only PRs with no matching commit get
a per-PR `gh pr view --json commits`. `fetchPRMessagesForHistory` applies the
`afterDate` cutoff (used by incremental runs) and drives progress reporting.

## Incremental mode

When writing to an existing changelog, the CLI reads the newest recorded commit
from the file, adds only newer commits, and calls `mergeIncrementalChangelog` to
append entries and bump the summary counts. This is why an explicit ref or
`--fresh` is needed to rebuild from scratch, and why the summary regex
(`**N commit(s), M PR(s) matched**`) must stay consistent.

## Testing

- `node:test` + `node:assert/strict`; **no mocking library**. Prefer pure
  functions and inject anything external through options:
  - `generateChangelog({ run })` / `generateChangelogWithPRs({ run, prs, fetchMessages })`
  - `fetchPRMessagesForHistory({ fetchMessages, now, onProgress, afterDate })`
  - `writePRProgress(progress, stream)` (stream defaults to `process.stderr`)
- **Unit tests must be hermetic.** Never let a test reach `gh` or the network:
  inject `fetchMessages: () => []` (the `test/generate.test.js` wrapper does this
  by default) and a fake `run` for git. A test that takes ~1s is usually a live
  `gh` call slipping through.
- Unit suites: `test/basic.test.js`, `test/generate.test.js`,
  `test/utils.test.js`. Add cases for parsing, formatting, matching, incremental
  merges, and progress output.
- `npm run test:coverage` enforces line ≥ 90 / branch ≥ 80 / function ≥ 85 and
  is run in CI. The only intentionally uncovered code is the real `gh` I/O
  (`fetchPRs`, `fetchPRCommitMessages`) — leave that to integration.
- `test/npm-install.test.js` runs `npm pack`, asserts the tarball's `files` list
  (e.g. `bin/awk-changelog.js`, `src/index.js`, `src/pr-progress.js`), installs
  with `--ignore-scripts`, then smoke-tests the installed CLI and API. It handles
  the Windows `awkch.cmd` name. If you add a published file, update this test.

## Conventions

- **ESM everywhere.** `"type": "module"`, `node:`-prefixed built-ins, no
  TypeScript, bundler, or lint config — match surrounding style.
- **JSDoc on exported and non-trivial internal functions**; keep `Commit`/`PRData`
  typedefs current.
- **Never shell out unsafely.** Use `execSafe` where failure is tolerable and
  `exec` where it should throw (both in `src/utils.js`).
- **Conventional commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- **Branches**: `lg/<type>/<slug>` (e.g. `lg/fix/gh-cli-fix`).

## Publishing & release

- `package.json` `files` is a whitelist (`bin/`, `src/`, `bash/`, README, LICENSE).
  A new top-level directory must be added there to ship.
- CI (`.github/workflows/ci.yml`) runs `npm test`, `npm run test:coverage`, and
  `npm run lint` on pushes and PRs to `main`, on Node 24. Oxlint config lives in
  `.oxlintrc.json` — note oxlint only auto-discovers that exact filename.
- Releases are automated by `.github/workflows/release.yml` on every push to
  `main`: if tag `vX.Y.Z` for the current `package.json` version already exists,
  the workflow bumps the patch version, commits it back as
  `chore(release): vX.Y.Z [skip ci]`, tags it, and creates a GitHub release with
  generated notes; otherwise it releases the committed version as-is. The
  decision lives in `scripts/release-version.ts` (run directly by Node 24).
- `prepublishOnly` runs `npm test`.

## Before finishing

- Run `npm test`.
- Add/update tests for any behavior change.
- Update `README.md` for user-visible CLI/API changes; update this file for
  structural or workflow changes.
- Don't commit `TEST_CHANGELOG.md` (gitignored).
