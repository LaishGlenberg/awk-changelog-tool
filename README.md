# awk-changelog-tool

Lightning-fast changelog generator from git history. Supports PR descriptions via GitHub CLI.

## Features

- **Blazing fast** — Uses `git log --numstat` in a single pass (inspired by awk pattern scanning)
- **Markdown output** — Clean, readable changelogs with commit stats (files changed, lines added/removed)
- **PR descriptions** — Optional integration with GitHub CLI to include pull request descriptions on merge commits
- **CLI + API** — Use as a command-line tool or import as a library
- **Bash scripts included** — Original awk-based scripts preserved in `bash/` for advanced users

## Installation

### As a project dependency (recommended for build pipelines)

```bash
npm install --save-dev awk-changelog-tool
```

Then add it to your `package.json` scripts:

```json
{
  "scripts": {
    "changelog": "awkch --default",
    "changelog:pr": "awkch --all",
  }
}
```

Now `npm run changelog` and `npm run changelog:pr` work immediately — npm auto-resolves `awkch` from `node_modules/.bin`.

### Globally

```bash
npm install -g awk-changelog-tool
```

Then `awkch` is available anywhere on your PATH.

### On the fly (no install)

```bash
npx awkch
```

npx fetches and caches the package automatically. Great for one-off usage.

## CLI Usage

### Basic changelog

Generate a changelog from the first commit to HEAD:

```bash
awkch
```

From a specific ref:

```bash
awkch 3c06d42
```

Write to a file:

```bash
awkch -o CHANGELOG.md
```

### With PR descriptions

Requires the [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated.

```bash
awkch --pr
```

### Subcommands

```bash
awkch pr               # Changelog with PR descriptions
awkch bash-path        # Show path to original bash scripts
```

### Options

| Option | Description |
|--------|-------------|
| `-V, --version` | Show version |
| `-h, --help` | Show help |
| `-o, --output <file>` | Write to file (default: stdout) |
| `-p, --pr` | Include PR descriptions (requires `gh` CLI) |
| `-d, --default` | Set output file to `CHANGELOG.md` |
| `-a, --all` | Shorthand for `--pr --default` |
| `-n, --no-email` | Strip email addresses from author names |

## Programmatic API

```js
import { generateChangelog, generateChangelogWithPRs } from 'awk-changelog-tool';

// Basic changelog as a string
const md = generateChangelog({ since: 'HEAD~10' });
console.log(md);

// Changelog with PR descriptions
const result = generateChangelogWithPRs({ since: '3c06d42' });
console.log(result.changelog);
// result.prCount → number of PR descriptions included
```

## Original Bash Scripts

The original awk-based scripts are preserved in `bash/` for users who prefer them:

- `bash/git-changelog.sh` — Basic changelog using awk
- `bash/git-changelog-pr.sh` — Changelog with PR descriptions using awk + jq + gh

To use them directly:

```bash
./node_modules/awk-changelog-tool/bash/git-changelog.sh
```

Or find the path:

```bash
awkch bash-path
```

## Requirements

- **Node.js** >= 18
- **git** (for reading history)
- **gh** CLI (optional, for PR descriptions)

## License

MIT

## Example Changelog

-
-
-

From commit `c406c3935f8429db809edd1262230be3e132303d` (2026-07-23 06:07:52 -0700)

**6 commit(s), 1 PR(s) fetched**

## cd69d7d — Merge pull request #1 from LaishGlenberg:lg/feat/add-changelog

| Field | Value |
|-------|-------|
| **Hash** | `cd69d7d06216baab6caf8ec417f7a9b69b0845b4` |
| **Date** | Thu, 23 Jul 2026 14:20:20 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +0 / −0 |
| **Files** |  |
| **Refs** | HEAD -> main, origin/main, origin/HEAD |
| **Pull Request** | #1 |

### Commit Message

chore: generate changelog

---

### Pull Request Description

```
## What & Why

- Generate a changelog for the repo using the awkch tool to demo the tool

## Changes

- Add changelog.md, update gitignore

## Notes

- Adding as a pr to demo the pr tool next
```

---

## 3da00e5 — chore: generate changelog

| Field | Value |
|-------|-------|
| **Hash** | `3da00e5ee2a0e815c0b45ffc02c88c92166ce081` |
| **Date** | Thu, 23 Jul 2026 14:14:20 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +54 / −1 |
| **Files** | `.gitignore`, `CHANGELOG.md` |
| **Refs** | origin/lg/feat/add-changelog, lg/feat/add-changelog |

---

---

## 2c2081c — refactor: shorten name to awkch

| Field | Value |
|-------|-------|
| **Hash** | `2c2081caaf43f3811c0dd4bfcf9dcd40c715439d` |
| **Date** | Thu, 23 Jul 2026 13:43:30 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +17 / −17 |
| **Files** | `README.md`, `bin/awk-changelog.js`, `package.json` |

---

---

## bb7f007 — feat: update readme

| Field | Value |
|-------|-------|
| **Hash** | `bb7f007aee4718bcfade34ca5cfbff3990e54555` |
| **Date** | Thu, 23 Jul 2026 13:37:49 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +26 / −1 |
| **Files** | `README.md` |

---

---

## 9935259 — chore: Scaffold npm package repository, add apis, docs, tests

| Field | Value |
|-------|-------|
| **Hash** | `9935259f689b498e6a5eec3818038868eaa49241` |
| **Date** | Thu, 23 Jul 2026 13:27:15 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +841 / −8 |
| **Files** | `.gitignore`, `LICENSE`, `README.md`, `git-changelog-pr.sh => bash/git-changelog-pr.sh`, `git-changelog.sh => bash/git-changelog.sh`, `bin/awk-changelog.js`, `package-lock.json`, `package.json`, `src/changelog-pr.js`, `src/changelog.js`, `src/index.js`, `src/utils.js`, `test/basic.test.js` |

---

---

## c406c39 — chore: initial commit with both bash scripts (regular and regular + pr descriptions)

| Field | Value |
|-------|-------|
| **Hash** | `c406c3935f8429db809edd1262230be3e132303d` |
| **Date** | Thu, 23 Jul 2026 13:07:52 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +284 / −0 |
| **Files** | `git-changelog-pr.sh`, `git-changelog.sh`, `package.json` |

---

---

