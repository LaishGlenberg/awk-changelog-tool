import { execSafe, formatDate, escMd, ensureGitRepo } from './utils.js';

/**
 * `git log` format: NUL-separated records, a `\x1f`-delimited header, and the body in
 * its own record so a multi-line body cannot swallow the fields after it.
 */
export const LOG_FORMAT = '%x00%H%x1f%h%x1f%s%x1f%ai%x1f%an <%ae>%x1f%P%x1f%D%x00%b';

const NUMSTAT_LINE = /^(\d+)\t(\d+)\t/;
const HEADER_HASH = /^[0-9a-f]{40}$/;

// git's record (NUL) and field (unit) separators, matching LOG_FORMAT.
const RECORD_SEP = String.fromCharCode(0);
const FIELD_SEP = String.fromCharCode(31);

/**
 * Parse a single git log --numstat entry into a structured commit object.
 * @typedef {object} Commit
 * @property {string} hash
 * @property {string} shortHash
 * @property {string} title
 * @property {string} date
 * @property {string} author
 * @property {string} body
 * @property {string} refs
 * @property {string} parents
 * @property {number} added
 * @property {number} removed
 * @property {string[]} files
 * @property {boolean} isMerge
 */

/**
 * Parse raw git log output into commit objects.
 * @param {string} raw - raw output from `git log --numstat --format="..." ...`
 * @returns {Commit[]}
 */
export function parseGitLog(raw) {
  const commits = [];
  const chunks = raw.split(RECORD_SEP);

  for (let index = 0; index < chunks.length; index += 1) {
    const header = chunks[index];
    if (header[40] !== FIELD_SEP || !HEADER_HASH.test(header.slice(0, 40))) continue;

    // The record after a header holds the body, followed by the numstat block.
    const parts = header.split(FIELD_SEP);
    const tail = (chunks[index + 1] ?? '').split('\n');
    index += 1;

    const numstatStart = tail.findIndex((line) => NUMSTAT_LINE.test(line));
    const bodyLines = numstatStart === -1 ? tail : tail.slice(0, numstatStart);

    const commit = {
      hash: parts[0] || '',
      shortHash: parts[1] || '',
      title: parts[2] || '',
      date: parts[3] || '',
      author: parts[4] || '',
      parents: parts[5] || '',
      refs: (parts[6] || '').replace(/^\(|\)$/g, ''),
      body: bodyLines.join('\n').replace(/^\n+/, '').trimEnd(),
      added: 0,
      removed: 0,
      files: [],
      isMerge: false,
    };

    for (const line of numstatStart === -1 ? [] : tail.slice(numstatStart)) {
      if (!NUMSTAT_LINE.test(line)) continue;
      const [added, removed, ...rest] = line.split('\t');
      commit.added += parseInt(added || '0', 10);
      commit.removed += parseInt(removed || '0', 10);
      const file = rest.join('\t');
      if (file) commit.files.push(file);
    }

    // Detect merge commit (2+ parents)
    commit.isMerge = commit.parents.split(' ').filter(Boolean).length >= 2;

    commits.push(commit);
  }

  return commits;
}

/**
 * Format a commit as a markdown section.
 * @param {Commit} c
 * @returns {string}
 */
export function formatCommit(c) {
  const lines = [];

  lines.push(`## ${c.shortHash} — ${c.title}`);
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('|-------|-------|');
  lines.push(`| **Hash** | \`${c.hash}\` |`);
  lines.push(`| **Date** | ${formatDate(c.date)} |`);
  lines.push(`| **Author** | ${escMd(c.author)} |`);
  lines.push(`| **Lines** | +${c.added} / −${c.removed} |`);

  const fileList = c.files.map(f => `\`${escMd(f)}\``).join(', ');
  lines.push(`| **Files** | ${fileList} |`);

  if (c.refs) {
    lines.push(`| **Refs** | ${escMd(c.refs)} |`);
  }

  const prNum = c.prNumber || extractPRNumber(c.title, c.body);
  if (prNum) {
    lines.push(`| **Pull Request** | #${prNum} |`);
  }

  lines.push('');

  if (c.body) {
    lines.push('### Commit Message');
    lines.push('');
    lines.push(c.body);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

/**
 * Extract a PR number from a squash-merged or merge commit.
 * @param {string} title
 * @param {string} [body]
 * @returns {string|null}
 */
export function extractPRNumber(title, body = '') {
  // Squash merges append the PR number to the subject: "fix: thing (#42)".
  const squash = title.match(/\(#(\d+)\)\s*$/);
  if (squash) return squash[1];

  // Merge commits look like "Merge pull request #42 from owner/branch".
  const merge = title.match(/^Merge pull request #(\d+)\b/);
  if (merge) return merge[1];

  const bodyMerge = body.match(/Merge pull request #(\d+)\b/);
  if (bodyMerge) return bodyMerge[1];

  return null;
}

/**
 * Get the date of a commit ref.
 * @param {string} ref
 * @returns {string}
 */
function getCommitDate(ref, run = execSafe) {
  return run(`git log -1 --format="%ai" "${ref}"`, '?');
}

/**
 * Build a git log range string that includes `since`.
 * If `since` is the root commit (no parent), use `--root` to include everything.
 * @param {string} since
 * @param {(cmd: string, fallback?: string) => string} [run]
 * @returns {string}
 */
function buildRange(since, run = execSafe) {
  const parent = run(`git rev-parse --verify "${since}^"`);
  if (parent) {
    return `"${since}^..HEAD"`;
  }
  return `--root HEAD`;
}

/**
 * Generate a markdown changelog from git history.
 *
 * @param {object} [options]
 * @param {string} [options.since] - Starting ref (commit-ish)
 * @param {boolean} [options.noEmail] - Strip email addresses from author names
 * @param {(cmd: string, fallback?: string) => string} [options.run] - Git command runner (injectable for tests)
 * @returns {string} The generated changelog markdown
 */
export function generateChangelog(options = {}) {
  ensureGitRepo();

  const run = options.run || execSafe;
  const since = options.since || getFirstCommit(run);

  // Use a range that includes `since` itself
  const range = buildRange(since, run);

  const raw = run(
    `git log --numstat --format="${LOG_FORMAT}" ${range}`,
    ''
  );

  if (!raw) {
    return `# Changelog\n\nNo commits found since \`${since}\`.\n`;
  }

  const commits = parseGitLog(raw);

  if (options.noEmail) {
    for (const c of commits) {
      c.author = c.author.replace(/ <[^>]+>$/, '');
    }
  }

  const sinceDate = getCommitDate(since, run);

  const lines = [];
  lines.push('# Changelog');
  lines.push('');
  lines.push(`From commit \`${since}\` (${sinceDate})`);
  lines.push('');
  lines.push(`**${commits.length} commit(s)**`);
  lines.push('');

  for (const c of commits) {
    lines.push(formatCommit(c));
  }

  return lines.join('\n');
}

/**
 * Get the first commit hash of the repository.
 * @param {(cmd: string, fallback?: string) => string} [run]
 * @returns {string}
 */
export function getFirstCommit(run = execSafe) {
  const root = run('git rev-list --max-parents=0 HEAD');
  return root.split('\n')[0] || 'HEAD';
}
