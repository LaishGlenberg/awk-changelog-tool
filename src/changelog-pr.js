import { execSafe, ensureGitRepo } from './utils.js';
import { parseGitLog, formatCommit, getFirstCommit } from './changelog.js';

/**
 * @typedef {object} PRData
 * @property {number} number
 * @property {string} body
 */

/**
 * Fetch PR data from GitHub via `gh` CLI.
 * @returns {PRData[]}
 */
function fetchPRs() {
  const raw = execSafe(
    'gh pr list --state all --limit 1000 --json number,body',
    '[]'
  );

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Build a lookup map: PR number -> decoded body.
 * @param {PRData[]} prs
 * @returns {Record<string, string>}
 */
function buildPRLookup(prs) {
  const lookup = {};
  for (const pr of prs) {
    if (pr.number && pr.body) {
      lookup[String(pr.number)] = pr.body;
    }
  }
  return lookup;
}

/**
 * Extract PR number from merge commit title or body.
 * @param {string} title
 * @param {string} body
 * @returns {string|null}
 */
function extractPRNumber(title, body) {
  const m = title.match(/#(\d+)/);
  if (m) return m[1];
  const m2 = body.match(/Merge pull request #(\d+)/);
  if (m2) return m2[1];
  return null;
}

/**
 * Get the date of a commit ref.
 * @param {string} ref
 * @returns {string}
 */
function getCommitDate(ref) {
  return execSafe(`git log -1 --format="%ai" "${ref}"`, '?');
}

/**
 * Generate a markdown changelog from git history, enriched with
 * PR descriptions fetched from GitHub via the `gh` CLI.
 *
 * @param {object} [options]
 * @param {string} [options.since] - Starting ref (commit-ish)
 * @returns {{ changelog: string, prCount: number }}
 */
export function generateChangelogWithPRs(options = {}) {
  ensureGitRepo();

  const since = options.since || getFirstCommit();
  const fmt = '%H|%h|%s|%ai|%an <%ae>|%b|%P|%D';

  // Use a range that includes `since` itself
  const parent = execSafe(`git rev-parse --verify "${since}^"`);
  const range = parent ? `"${since}^..HEAD"` : `--root HEAD`;

  const raw = execSafe(
    `git log --numstat --format="${fmt}" ${range}`,
    ''
  );

  if (!raw) {
    return { changelog: `# Changelog\n\nNo commits found since \`${since}\`.\n`, prCount: 0 };
  }

  const commits = parseGitLog(raw);

  if (options.noEmail) {
    for (const c of commits) {
      c.author = c.author.replace(/ <[^>]+>$/, '');
    }
  }

  const prs = fetchPRs();
  const prLookup = buildPRLookup(prs);

  const prsUsed = new Set();
  const sinceDate = getCommitDate(since);

  const lines = [];
  lines.push('# Changelog');
  lines.push('');
  lines.push(`From commit \`${since}\` (${sinceDate})`);
  lines.push('');
  lines.push(`**${commits.length} commit(s), ${prs.length} PR(s) fetched**`);
  lines.push('');

  for (const c of commits) {
    lines.push(formatCommit(c));

    // For merge commits: include PR description
    if (c.isMerge) {
      const prNum = extractPRNumber(c.title, c.body);
      if (prNum && prLookup[prNum]) {
        prsUsed.add(prNum);
        lines.push('### Pull Request Description');
        lines.push('');
        lines.push('```');
        lines.push(prLookup[prNum]);
        lines.push('```');
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
  }

  return { changelog: lines.join('\n'), prCount: prsUsed.size };
}
