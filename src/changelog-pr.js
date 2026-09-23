import { execSafe, ensureGitRepo } from './utils.js';
import { parseGitLog, formatCommit, getFirstCommit } from './changelog.js';

/**
 * @typedef {object} PRData
 * @property {number} number
 * @property {string} body
 * @property {{ oid?: string }} [mergeCommit]
 * @property {string} [state]
 * @property {string} [mergedAt]
 */

/**
 * Fetch PR data from GitHub via `gh` CLI.
 * Only non-connection fields are requested: adding `commits` makes gh blow
 * GitHub's GraphQL node limit ("up to 1,000,000 possible nodes") even at
 * `--limit 100`, so commit association is done per PR instead.
 * @returns {PRData[]}
 */
function fetchPRs() {
  const raw = execSafe(
    'gh pr list --state all --limit 1000 --json number,body,mergeCommit,state,mergedAt',
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
 * Fetch the commit messages of a PR. Used for PRs that have no commit on the
 * current branch (rebase-merged, still open, or a feature branch viewed before
 * its merge commit lands). Rebase rewrites SHAs but preserves messages, so
 * messages are what we join on.
 * @param {number} prNumber
 * @returns {{ messageHeadline?: string, messageBody?: string }[]}
 */
function fetchPRCommitMessages(prNumber) {
  const raw = execSafe(`gh pr view ${prNumber} --json commits`, '{}');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.commits) ? parsed.commits : [];
  } catch {
    return [];
  }
}

/**
 * Normalize a commit message into a join key. git's `%s` / `%b` map to gh's
 * `messageHeadline` / `messageBody`.
 * @param {string} headline
 * @param {string} [body]
 * @returns {string}
 */
export function messageKey(headline, body = '') {
  return `${String(headline).trim()}\n${String(body).trim()}`;
}

/**
 * Map normalized commit message -> PR number. Every commit in a PR is mapped;
 * because the changelog walks newest-first, the first hit is the top of the
 * rebased group, which is where the description is attached.
 * @param {Record<string, { messageHeadline?: string, messageBody?: string }[]>} messagesByPR
 * @returns {Record<string, string>}
 */
export function buildMessageToPR(messagesByPR) {
  const map = {};
  for (const [num, messages] of Object.entries(messagesByPR)) {
    for (const m of messages) {
      if (!m || !m.messageHeadline) continue;
      map[messageKey(m.messageHeadline, m.messageBody)] = num;
    }
  }
  return map;
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

  // For every PR that has no commit in this branch's history (rebase merges,
  // open PRs, or a feature branch viewed before its merge commit landed),
  // fetch its commit messages and join on those. One `gh pr view` per such PR
  // instead of a `gh api` call per commit.
  const commitHashes = new Set(commits.map((c) => c.hash));
  const messagesByPR = {};
  for (const pr of prs) {
    if (!pr.number) continue;
    const mergedOid = pr.mergeCommit && pr.mergeCommit.oid;
    if (mergedOid && commitHashes.has(mergedOid)) continue;
    const messages = fetchPRCommitMessages(pr.number);
    if (messages.length) messagesByPR[String(pr.number)] = messages;
  }
  const messageToPR = buildMessageToPR(messagesByPR);

  const prsUsed = new Set();
  const sinceDate = getCommitDate(since);
  const body = [];

  for (const c of commits) {
    // Associate a PR with this commit. Squash/merge PRs match by merge commit
    // SHA or the "(#N)" title marker; rebase/open PRs match by message.
    const prNum =
      commitToPR[c.hash] ||
      extractPRNumber(c.title, c.body) ||
      messageToPR[messageKey(c.title, c.body)] ||
      null;

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
