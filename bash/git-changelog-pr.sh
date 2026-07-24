#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────
# git-changelog-pr.sh — Build a markdown changelog from git history
#                      with PR descriptions for merge commits.
#
# Combines git-changelog.sh (commit log) with test-gh.sh (bulk PR
# body fetch) so merge commits show their PR description inline.
#
# Usage: ./git-changelog-pr.sh [<since-ref>] [<output-file>]
#
#   <since-ref>    Commit-ish to start from (default: 3c06d42)
#   <output-file>  Output file path       (default: CHANGELOG.md)
#
# Example:
#   ./git-changelog-pr.sh 3c06d42
#   ./git-changelog-pr.sh HEAD~50 CHANGELOG.md
# ─────────────────────────────────────────────────────────────────────

SINCE="${1:-3c06d42}"
OUTPUT_FILE="${2:-CHANGELOG.md}"
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

PR_JSON="$TMP_DIR/pr_data.json"
PR_LOOKUP="$TMP_DIR/pr_lookup.txt"

# ── Step 1: Fetch ALL PR bodies in a single API call ──
echo "🔍 Fetching PR data from GitHub..." >&2
if ! gh pr list --state all --limit 1000 --json number,body > "$PR_JSON" 2>/dev/null; then
  echo "⚠️  Warning: Could not fetch PR data from GitHub. Continuing without PR descriptions." >&2
  echo "[]" > "$PR_JSON"
fi

# ── Step 2: Pre-build an awk-readable lookup table ──
# Each line: pr_body[PR_NUMBER]="BASE64_ENCODED_BODY"
# Base64 avoids all escaping issues with multi-line bodies and special chars.
# Uses bundled node-jq (jq.mjs) from the npm package.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/jq.mjs" '.[] | "pr_body[" + (.number|tostring) + "]=\"" + (.body // "" | @base64) + "\""' \
  "$PR_JSON" > "$PR_LOOKUP"

echo "🔍 Generating changelog..." >&2

# ── Step 3: Build changelog in one pass ──
# Pipe git log through awk to format each commit.
# PR descriptions are pre-loaded from the lookup file in BEGIN.
{
  echo "# Changelog"
  echo ""
  since_date=$(git log -1 --format="%ai" "${SINCE}" 2>/dev/null || echo "?")
  echo "From commit \`${SINCE}\` (${since_date})"
  echo ""

  git log --numstat \
    --format="%H|%h|%s|%ai|%an <%ae>|%b|%P|%D" \
    "${SINCE}..HEAD" 2>/dev/null
} | awk -F'|' -v lookup_file="$PR_LOOKUP" '
  BEGIN {
    in_commit = 0
    added = 0
    removed = 0
    files = ""

    # Pre-load PR descriptions from the base64 lookup file
    while ((getline < lookup_file) > 0) {
      # line: pr_body[17]="BASE64=="
      if (match($0, /pr_body\[([0-9]+)\]="(.*)"/, m)) {
        num = m[1]
        b64 = m[2]
        # Decode base64 — getline reads the decoded output
        cmd = "printf \"%s\" \"" b64 "\" | base64 -d 2>/dev/null"
        decoded = ""
        while ((cmd | getline line) > 0) {
          if (decoded == "") decoded = line
          else decoded = decoded "\n" line
        }
        close(cmd)
        if (decoded != "") pr_desc[num] = decoded
      }
    }
    close(lookup_file)
  }

  # ── Commit header line (40-hex-char hash) ──
  /^[a-f0-9]{40}/ {
    if (in_commit) print_commit()

    in_commit = 1
    added = 0
    removed = 0
    files = ""
    pr_number = ""

    hash    = $1
    short   = $2
    title   = $3
    date    = $4
    author  = $5
    body    = $6
    parents = $7
    refs    = $8

    gsub(/^\(|\)$/, "", refs)

    # Detect merge commits (2+ parents)
    split(parents, parent_array, " ")
    is_merge = (length(parent_array) >= 2)

    # Extract PR number from title ("Merge pull request #123")
    # or from body
    if (match(title, /#([0-9]+)/, arr)) {
      pr_number = arr[1]
    } else if (match(body, /Merge pull request #([0-9]+)/, arr)) {
      pr_number = arr[1]
    } else {
      pr_number = ""
    }

    next
  }

  # ── Numstat line (added<tab>removed<tab>file) ──
  /^[0-9]+/ {
    if (in_commit) {
      split($0, parts, "\t")
      added  += parts[1] + 0
      removed += parts[2] + 0
      if (files != "") files = files ","
      files = files parts[3]
    }
    next
  }

  # ── Last commit ──
  END {
    if (in_commit) print_commit()
  }

  # ── Print one formatted commit ──
  function print_commit() {
    print "## " short " — " title
    print ""
    print "| Field | Value |"
    print "|-------|-------|"
    print "| **Hash** | `" hash "` |"
    print "| **Date** | " date " |"
    print "| **Author** | " author " |"
    print "| **Lines** | +" added " / −" removed " |"
    print "| **Files** | " files " |"
    if (refs != "")                  print "| **Refs** | " refs " |"
    if (is_merge && pr_number != "") print "| **Pull Request** | #" pr_number " |"
    print ""

    # Commit body (from git)
    if (body != "") {
      print "### Commit Message"
      print ""
      print body
      print ""
    }

    # For merge commits: show the PR description/body from GitHub
    if (is_merge && pr_number != "" && pr_number in pr_desc) {
      print "### Pull Request Description"
      print ""
      print "```"
      print pr_desc[pr_number]
      print "```"
      print ""
    }

    print "---"
    print ""
  }
' > "$OUTPUT_FILE"

echo "✅ Changelog written to ${OUTPUT_FILE}" >&2