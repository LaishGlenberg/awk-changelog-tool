import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateChangelog, getFirstCommit } from '../src/changelog.js';
import { generateChangelogWithPRs as generateChangelogWithPRsRaw } from '../src/changelog-pr.js';

/**
 * Wrap the real generator so tests never shell out to `gh`. Unmatched PRs would
 * otherwise trigger a live `gh pr view` per PR; default the message fetch to a
 * no-op and let individual tests override it.
 */
function generateChangelogWithPRs(options) {
  return generateChangelogWithPRsRaw({ fetchMessages: () => [], ...options });
}

const H1 = 'a'.repeat(40);
const H2 = 'b'.repeat(40);

/**
 * Build one `git log --numstat` entry in the exact on-the-wire format the
 * generator parses.
 */
function logEntry({
  hash,
  short,
  title,
  date = '2025-01-15 10:00:00 +0000',
  author = 'John <john@test.com>',
  body = '',
  parents = 'p1',
  refs = '',
  numstat = ['1\t1\tREADME.md'],
}) {
  return [
    `${hash}|${short}|${title}|${date}|${author}|${body}|${parents}|${refs}`,
    ...numstat,
  ].join('\n');
}

/**
 * Fake git runner. Routes each command the generators issue to canned output,
 * so the orchestrators can be tested without shelling out to git.
 */
function gitRunner({
  log = '',
  firstRoot = H1,
  parent = 'parent',
  date = '2025-01-01 00:00:00 +0000',
  seen = [],
} = {}) {
  return (cmd) => {
    seen.push(cmd);
    if (cmd.startsWith('git log --numstat')) return log;
    if (cmd.startsWith('git log -1')) return date;
    if (cmd.startsWith('git rev-list')) return firstRoot;
    if (cmd.startsWith('git rev-parse')) return parent;
    return '';
  };
}

describe('getFirstCommit', () => {
  it('returns the first line of the root-commit list', () => {
    assert.equal(getFirstCommit(() => 'first\nsecond'), 'first');
  });

  it('falls back to HEAD for an empty repository', () => {
    assert.equal(getFirstCommit(() => ''), 'HEAD');
  });
});

describe('generateChangelog', () => {
  it('reports no commits when git log is empty', () => {
    const out = generateChangelog({ since: 'abc1234', run: gitRunner({ log: '' }) });
    assert.match(out, /^# Changelog/);
    assert.match(out, /No commits found since `abc1234`/);
  });

  it('renders the header, count, and formatted commit', () => {
    const log = logEntry({ hash: H1, short: 'aaaaaaa', title: 'feat: first' });
    const out = generateChangelog({ since: 'abc1234', run: gitRunner({ log }) });

    assert.match(out, /From commit `abc1234`/);
    assert.match(out, /\*\*1 commit\(s\)\*\*/);
    assert.match(out, /## aaaaaaa — feat: first/);
    assert.match(out, /\+1 \/ −1/);
  });

  it('strips emails when noEmail is set', () => {
    const log = logEntry({ hash: H1, short: 'aaaaaaa', title: 'x' });
    const out = generateChangelog({ since: 'abc', noEmail: true, run: gitRunner({ log }) });

    assert.match(out, /\| \*\*Author\*\* \| John \|/);
    assert.doesNotMatch(out, /john@test\.com/);
  });

  it('uses --root HEAD and the first commit when no ref is given', () => {
    const seen = [];
    const log = logEntry({ hash: H1, short: 'aaaaaaa', title: 'root commit' });
    generateChangelog({ run: gitRunner({ log, parent: '', seen }) });

    assert.ok(seen.some((c) => c.includes('git rev-list --max-parents=0 HEAD')));
    assert.ok(seen.some((c) => c.includes('--root HEAD')));
  });

  it('anchors the range at the parent of an explicit ref', () => {
    const seen = [];
    const log = logEntry({ hash: H1, short: 'aaaaaaa', title: 'x' });
    generateChangelog({ since: 'HEAD~3', run: gitRunner({ log, parent: 'parentsha', seen }) });

    assert.ok(seen.some((c) => c.includes('"HEAD~3^..HEAD"')));
  });
});

describe('generateChangelogWithPRs', () => {
  it('reports no commits and zero PRs for empty history', () => {
    const res = generateChangelogWithPRs({ since: 'abc', run: gitRunner({ log: '' }), prs: [] });
    assert.equal(res.prCount, 0);
    assert.match(res.changelog, /No commits found since `abc`/);
  });

  it('matches a merge PR via the merge-commit SHA', () => {
    const log = logEntry({
      hash: H1,
      short: 'aaaaaaa',
      title: 'Merge pull request #5 from x/y',
      parents: 'p1 p2',
    });
    const prs = [{ number: 5, body: 'merged body', mergeCommit: { oid: H1 } }];
    const res = generateChangelogWithPRs({ since: 'abc', run: gitRunner({ log }), prs });

    assert.equal(res.prCount, 1);
    assert.match(res.changelog, /\*\*1 commit\(s\), 1 PR\(s\) matched\*\*/);
    assert.match(res.changelog, /\| \*\*Pull Request\*\* \| #5 \|/);
    assert.match(res.changelog, /### Pull Request Description/);
    assert.match(res.changelog, /merged body/);
  });

  it('matches a squash PR via the (#N) title marker', () => {
    const log = logEntry({ hash: H1, short: 'aaaaaaa', title: 'feat: squashed (#7)' });
    const prs = [{ number: 7, body: 'squash body', mergeCommit: { oid: 'unrelated' } }];
    const res = generateChangelogWithPRs({ since: 'abc', run: gitRunner({ log }), prs });

    assert.equal(res.prCount, 1);
    assert.match(res.changelog, /squash body/);
  });

  it('matches a rebase PR by joining on the normalized commit message', () => {
    const log = logEntry({
      hash: H1,
      short: 'aaaaaaa',
      title: 'feat: rebased',
      body: 'details',
    });
    const prs = [{ number: 9, body: 'rebase body', mergeCommit: { oid: 'unrelated' } }];
    const fetchMessages = () => [{ messageHeadline: 'feat: rebased', messageBody: 'details' }];
    const res = generateChangelogWithPRs({
      since: 'abc',
      run: gitRunner({ log }),
      prs,
      fetchMessages,
    });

    assert.equal(res.prCount, 1);
    assert.match(res.changelog, /rebase body/);
  });

  it('shows the PR description only once across a multi-commit PR', () => {
    const log = [
      logEntry({ hash: H1, short: 'aaaaaaa', title: 'feat: a (#5)' }),
      logEntry({ hash: H2, short: 'bbbbbbb', title: 'feat: b (#5)' }),
    ].join('\n');
    const prs = [{ number: 5, body: 'only once', mergeCommit: { oid: 'unrelated' } }];
    const res = generateChangelogWithPRs({ since: 'abc', run: gitRunner({ log }), prs });

    assert.equal(res.prCount, 1);
    assert.equal(res.changelog.split('### Pull Request Description').length - 1, 1);
    assert.match(res.changelog, /\*\*2 commit\(s\), 1 PR\(s\) matched\*\*/);
  });

  it('ignores PRs whose body is empty and counts nothing', () => {
    const log = logEntry({ hash: H1, short: 'aaaaaaa', title: 'chore: no pr (#3)' });
    const prs = [{ number: 3, body: '', mergeCommit: { oid: 'unrelated' } }];
    const res = generateChangelogWithPRs({ since: 'abc', run: gitRunner({ log }), prs });

    assert.equal(res.prCount, 0);
    assert.doesNotMatch(res.changelog, /### Pull Request Description/);
  });

  it('does not match a commit when no PR corresponds', () => {
    const log = logEntry({ hash: H1, short: 'aaaaaaa', title: 'chore: plain commit' });
    const res = generateChangelogWithPRs({ since: 'abc', run: gitRunner({ log }), prs: [] });

    assert.equal(res.prCount, 0);
    assert.match(res.changelog, /\*\*1 commit\(s\), 0 PR\(s\) matched\*\*/);
  });
});
