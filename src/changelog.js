import { exec, execSafe, formatDate, escMd, ensureGitRepo } from './utils.js';

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
  let current = null;
  const lines = raw.split('\n');

  for (const line of lines) {
    // Commit header (40 hex chars)
    if (/^[a-f0-9]{40}/.test(line)) {
      if (current) commits.push(current);

      const parts = line.split('|');
      current = {
        hash: parts[0] || '',
        shortHash: parts[1] || '',
        title: parts[2] || '',
        date: parts[3] || '',
        author: parts[4] || '',
        body: parts[5] || '',
        parents: parts[6] || '',
        refs: parts[7] || '',
        added: 0,
        removed: 0,
        files: [],
        isMerge: false,
      };

      // Clean refs (remove parens)
      current.refs = current.refs.replace(/^\(|\)$/g, '');

      // Detect merge commit (2+ parents)
      const parentList = current.parents.split(' ').filter(Boolean);
      current.isMerge = parentList.length >= 2;

      continue;
    }

    // Numstat line
    if (current && /^\d+/.test(line)) {
      const parts = line.split('\t');
      current.added += parseInt(parts[0] || '0', 10);
      current.removed += parseInt(parts[1] || '0', 10);
      const file = parts[2] || '';
      if (file) current.files.push(file);
      continue;
    }
  }

  if (current) commits.push(current);
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

  if (c.isMerge) {
    const prNum = extractPRNumber(c.title, c.body);
    if (prNum) {
      lines.push(`| **Pull Request** | #${prNum} |`);
    }
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
 * Build a git log range string that includes `since`.
 * If `since` is the root commit (no parent), use `--root` to include everything.
 * @param {string} since
 * @returns {string}
 */
function buildRange(since) {
  const parent = execSafe(`git rev-parse --verify "${since}^"`);
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
 * @returns {string} The generated changelog markdown
 */
export function generateChangelog(options = {}) {
  ensureGitRepo();

  const since = options.since || getFirstCommit();
  const fmt = '%H|%h|%s|%ai|%an <%ae>|%b|%P|%D';

  // Use a range that includes `since` itself
  const range = buildRange(since);

  const raw = execSafe(
    `git log --numstat --format="${fmt}" ${range}`,
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

  const sinceDate = getCommitDate(since);

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
 * @returns {string}
 */
export function getFirstCommit() {
  const root = execSafe('git rev-list --max-parents=0 HEAD');
  return root.split('\n')[0] || 'HEAD';
}
