import { execSafe, ensureGitRepo } from './utils.js';
import { parseGitLog, formatCommit, getFirstCommit } from './changelog.js';

/**
 * @typedef {object} PRData
 * @property {number} number
 * @property {string} body
 * @property {{ oid?: string }} [mergeCommit]
 */

/**
 * Fetch PR data from GitHub via `gh` CLI.
 * Only non-connection fields are requested: adding `commits` makes gh blow
 * GitHub's GraphQL node limit ("up to 1,000,000 possible nodes") even at
 * `--limit 100`, so per-commit association is done lazily instead.
 * @returns {PRData[]}
 */
function fetchPRs() {
  const raw = execSafe(
    'gh pr list --state all --limit 1000 --json number,body,mergeCommit',
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
 * Map commit SHA -> PR number for merge commits and squash merges: GitHub
 * records the commit it created on the base branch as the PR's `mergeCommit`.
 * @param {PRData[]} prs
 * @returns {Record<string, string>}
 */
export function buildCommitToPR(prs) {
  const map = {};
  for (const pr of prs) {
    if (!pr.number) continue;
    if (pr.mergeCommit && pr.mergeCommit.oid) {
      map[pr.mergeCommit.oid] = String(pr.number);
    }
  }
  return map;
}

/**
 * Look up the PR that contains a commit via the GitHub REST API. This is the
 * only reliable way to associate rebase-merged commits (their SHAs are
 * rewritten and their titles carry no "(#N)" marker). Results are cached for
 * the run. `{owner}`/`{repo}` are resolved by gh from the current repo.
 * @param {string} sha
 * @returns {string|null}
 */
const commitPRCache = new Map();
function lookupPRForCommit(sha) {
  if (commitPRCache.has(sha)) return commitPRCache.get(sha);
  const raw = execSafe(
    `gh api "repos/{owner}/{repo}/commits/${sha}/pulls" --jq '.[0].number'`,
    ''
  );
  const num = /^\d+$/.test(raw) ? raw : null;
  commitPRCache.set(sha, num);
  return num;
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
  const commitToPR = buildCommitToPR(prs);
  // Skip per-commit API lookups when gh returned nothing (offline / no PRs).
  const canLookup = prs.length > 0;

  const prsUsed = new Set();
  const sinceDate = getCommitDate(since);
  const body = [];

  for (const c of commits) {
    // Associate a PR with this commit. Squash/rebase merges leave no merge
    // commit behind, so fall back to the title marker, then the commit API.
    const prNum =
      commitToPR[c.hash] ||
      extractPRNumber(c.title, c.body) ||
      (canLookup ? lookupPRForCommit(c.hash) : null);

    let showPR = false;
    if (prNum && prLookup[prNum]) {
      c.prNumber = prNum;
      // Show the description once per PR, on the first (newest) commit seen.
      if (!prsUsed.has(prNum)) {
        prsUsed.add(prNum);
        showPR = true;
      }
    }

    body.push(formatCommit(c));

    if (showPR) {
      body.push('### Pull Request Description');
      body.push('');
      body.push('```');
      body.push(prLookup[prNum]);
      body.push('```');
      body.push('');
    }

    body.push('---');
    body.push('');
  }

  const lines = [];
  lines.push('# Changelog');
  lines.push('');
  lines.push(`From commit \`${since}\` (${sinceDate})`);
  lines.push('');
  lines.push(`**${commits.length} commit(s), ${prsUsed.size} PR(s) matched**`);
  lines.push('');
  lines.push(...body);

  return { changelog: lines.join('\n'), prCount: prsUsed.size };
}
