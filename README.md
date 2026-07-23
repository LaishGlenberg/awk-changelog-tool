# awk-changelog-tool

Lightning-fast changelog generator from git history. Supports PR descriptions via GitHub CLI.

## Features

- ⚡ **Blazing fast** — Uses `git log --numstat` in a single pass (inspired by awk pattern scanning)
- 📝 **Markdown output** — Clean, readable changelogs with commit stats (files changed, lines added/removed)
- 🔗 **PR descriptions** — Optional integration with GitHub CLI to include pull request descriptions on merge commits
- 🧩 **CLI + API** — Use as a command-line tool or import as a library
- 🐚 **Bash scripts included** — Original awk-based scripts preserved in `bash/` for advanced users

## Installation

### As a project dependency (recommended for build pipelines)

```bash
npm install --save-dev awk-changelog-tool
```

Then add it to your `package.json` scripts:

```json
{
  "scripts": {
    "changelog": "awkch",
    "changelog:pr": "awkch --pr"
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
awkch log              # Basic changelog (same as default)
awkch log -o CHANGES.md

awkch pr               # Changelog with PR descriptions
awkch pr --no-prs      # Skip PR fetch, just git log

awkch bash-path        # Show path to original bash scripts
```

### Options

| Option | Description |
|--------|-------------|
| `-V, --version` | Show version |
| `-h, --help` | Show help |
| `-o, --output <file>` | Write to file (default: stdout) |
| `-p, --pr` | Include PR descriptions (requires `gh` CLI) |

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
