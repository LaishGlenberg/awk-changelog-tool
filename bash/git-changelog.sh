#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# git-changelog.sh — Build a markdown changelog from git history
# Usage: ./git-changelog.sh [<since-ref>]
#   <since-ref>  Commit-ish to start from (default: 3c06d42)
#
# Output:  prints markdown to stdout
# Example: ./git-changelog.sh 3c06d42
#          ./git-changelog.sh HEAD~50
# ──────────────────────────────────────────────────────────────

SINCE="${1:-3c06d42}"
OUTPUT_FILE="${2:-CHANGELOG.md}"

git log --numstat --format="%H|%h|%s|%ai|%an <%ae>|%b|%D" "${SINCE}..HEAD" 2>/dev/null | \
awk -F'|' '
  BEGIN { 
    in_commit = 0
    added = 0
    removed = 0
    files = ""
  }
  
  /^[a-f0-9]{40}/ {
    if (in_commit) print_commit()
    
    in_commit = 1
    added = 0
    removed = 0
    files = ""
    
    hash = $1
    short = $2
    title = $3
    date = $4
    author = $5
    body = $6
    refs = $7
    next
  }
  
  /^[0-9]+/ {
    if (in_commit) {
      split($0, parts, "\t")
      added += parts[1] + 0
      removed += parts[2] + 0
      if (files != "") files = files ","
      files = files parts[3]
    }
    next
  }
  
  END {
    if (in_commit) print_commit()
  }
  
  function print_commit() {
    # Clean up refs (remove parentheses that git adds)
    gsub(/^\(|\)$/, "", refs)
    
    print "## " short " — " title
    print ""
    print "| Field | Value |"
    print "|-------|-------|"
    print "| **Hash** | `" hash "` |"
    print "| **Date** | " date " |"
    print "| **Author** | " author " |"
    print "| **Lines** | +" added " / −" removed " |"
    print "| **Files** | " files " |"
    
    # Only show refs if there are any
    if (refs != "") {
      print "| **Refs** | " refs " |"
    }
    
    print ""
    if (body != "") print body "\n"
  }
' > "$OUTPUT_FILE"

echo "✅ Changelog written to ${OUTPUT_FILE}" >&2