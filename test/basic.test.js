import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGitLog, formatCommit } from '../src/changelog.js';
import {
  buildCommitToPR,
  buildMessageToPR,
  fetchPRMessagesForHistory,
  messageKey,
} from '../src/changelog-pr.js';
import { formatDuration, formatPRProgress, writePRProgress } from '../src/pr-progress.js';

describe('parseGitLog', () => {
  it('should parse a single commit with numstat', () => {
    const raw = [
      'abc123def4567890123456789012345678901234|abc1234|Initial commit|2025-01-15 10:00:00 +0000|John <john@test.com>|||HEAD -> main',
      '1\t1\tREADME.md',
    ].join('\n');

    const commits = parseGitLog(raw);
    assert.equal(commits.length, 1);
    assert.equal(commits[0].hash, 'abc123def4567890123456789012345678901234');
    assert.equal(commits[0].shortHash, 'abc1234');
    assert.equal(commits[0].title, 'Initial commit');
    assert.equal(commits[0].added, 1);
    assert.equal(commits[0].removed, 1);
    assert.deepEqual(commits[0].files, ['README.md']);
    assert.equal(commits[0].isMerge, false);
  });

  it('should detect merge commits from multiple parents', () => {
    const raw = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa|aaa|Merge pull request #42|2025-01-15 10:00:00 +0000|John <john@test.com>|PR body|abc def|',
      '',
    ].join('\n');

    const commits = parseGitLog(raw);
    assert.equal(commits.length, 1);
    assert.equal(commits[0].isMerge, true);
  });

  it('should parse multiple commits', () => {
    const raw = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa|aaa|First|2025-01-01|||parent1|',
      '1\t1\tfile1.txt',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb|bbb|Second|2025-01-02|||parent2|',
      '2\t1\tfile2.txt',
      '3\t2\tfile3.txt',
    ].join('\n');

    const commits = parseGitLog(raw);
    assert.equal(commits.length, 2);
    assert.equal(commits[0].shortHash, 'aaa');
    assert.equal(commits[0].added, 1);
    assert.equal(commits[1].shortHash, 'bbb');
    assert.equal(commits[1].added, 5);
    assert.equal(commits[1].removed, 3);
    assert.deepEqual(commits[1].files, ['file2.txt', 'file3.txt']);
  });

  it('should handle empty input', () => {
    const commits = parseGitLog('');
    assert.deepEqual(commits, []);
  });
});

describe('formatCommit', () => {
  it('should format a simple commit', () => {
    const commit = {
      hash: 'abc123',
      shortHash: 'abc',
      title: 'Fix bug',
      date: '2025-01-15 10:00:00 +0000',
      author: 'John <john@test.com>',
      body: '',
      refs: '',
      parents: 'parent1',
      added: 5,
      removed: 2,
      files: ['src/index.js'],
      isMerge: false,
    };

    const output = formatCommit(commit);
    assert.ok(output.includes('## abc — Fix bug'));
    assert.ok(output.includes('+5'));
    assert.ok(output.includes('−2'));
    assert.ok(output.includes('src/index.js'));
  });

  it('should include body when present', () => {
    const commit = {
      hash: 'abc',
      shortHash: 'abc',
      title: 'Fix',
      date: '2025-01-01',
      author: 'John',
      body: 'This is the commit body',
      refs: '',
      parents: 'p',
      added: 0,
      removed: 0,
      files: [],
      isMerge: false,
    };

    const output = formatCommit(commit);
    assert.ok(output.includes('### Commit Message'));
    assert.ok(output.includes('This is the commit body'));
  });

  it('should include the PR row for a squash commit with a known PR number', () => {
    const commit = {
      hash: 'abc',
      shortHash: 'abc',
      title: 'feat: thing (#7)',
      date: '2025-01-01',
      author: 'John',
      body: '',
      refs: '',
      parents: 'p',
      added: 0,
      removed: 0,
      files: [],
      isMerge: false,
      prNumber: '7',
    };

    const output = formatCommit(commit);
    assert.ok(output.includes('| **Pull Request** | #7 |'));
  });
});

describe('buildCommitToPR', () => {
  it('maps the mergeCommit oid to the PR number (merge + squash)', () => {
    const map = buildCommitToPR([
      { number: 1, body: 'a', mergeCommit: { oid: 'aaa' } },
      { number: 2, body: 'b', mergeCommit: null },
    ]);
    assert.equal(map.aaa, '1');
    assert.deepEqual(Object.keys(map), ['aaa']);
  });
});

describe('messageKey', () => {
  it('normalizes headline and body whitespace', () => {
    assert.equal(messageKey('  feat: thing  ', 'body  '), 'feat: thing\nbody');
    assert.equal(messageKey('fix', undefined), 'fix\n');
  });
});

describe('buildMessageToPR', () => {
  it('maps every commit message of a PR to its number', () => {
    const map = buildMessageToPR({
      7: [
        { messageHeadline: 'feat: first', messageBody: 'a' },
        { messageHeadline: 'fix: second', messageBody: '' },
      ],
    });
    assert.equal(map['feat: first\na'], '7');
    assert.equal(map['fix: second\n'], '7');
  });

  it('ignores entries without a headline and lets later PRs win on collision', () => {
    const map = buildMessageToPR({
      1: [{ messageHeadline: 'same', messageBody: '' }],
      2: [{ messageHeadline: 'same', messageBody: '' }, { messageBody: 'orphan' }],
    });
    assert.equal(map['same\n'], '2');
    assert.equal(Object.keys(map).length, 1);
  });
});

describe('fetchPRMessagesForHistory', () => {
  it('reports progress and estimates remaining time from completed PR fetches', () => {
    const times = [0, 0, 1000, 1000, 1000, 4000, 4000];
    const progress = [];
    const result = fetchPRMessagesForHistory(
      [
        { number: 1, mergeCommit: { oid: 'in-history' } },
        { number: 2 },
        { number: 3, mergeCommit: null },
      ],
      new Set(['in-history']),
      {
        fetchMessages: (number) => [{ messageHeadline: `commit ${number}` }],
        onProgress: (status) => progress.push(status),
        now: () => times.shift(),
      },
    );

    assert.deepEqual(Object.keys(result), ['2', '3']);
    assert.deepEqual(progress, [
      { completed: 0, total: 2, elapsedMs: 0, averageMs: 0, etaMs: 0, lastDurationMs: 0 },
      { completed: 1, total: 2, elapsedMs: 1000, averageMs: 1000, etaMs: 1000, lastDurationMs: 1000 },
      { completed: 2, total: 2, elapsedMs: 4000, averageMs: 2000, etaMs: 0, lastDurationMs: 3000 },
    ]);
  });

  it('does not report progress when there are no PRs to fetch', () => {
    const progress = [];
    const result = fetchPRMessagesForHistory(
      [{ number: 1, mergeCommit: { oid: 'in-history' } }],
      new Set(['in-history']),
      { onProgress: (status) => progress.push(status), fetchMessages: () => [] },
    );
    assert.deepEqual(result, {});
    assert.deepEqual(progress, []);
  });
});

describe('PR progress formatting', () => {
  it('formats the requested multi-line status and average PR rate', () => {
    assert.equal(formatDuration(0), '0s');
    assert.equal(formatDuration(65_000), '1m 05s');
    assert.equal(
      formatPRProgress({ completed: 20, total: 50, elapsedMs: 80_000, etaMs: 40_000 }),
      'Fetching PR details: 20/50\nTime Remaining:      40s\nElapsed:             1m 20s\nAvg:                 0.25 pr/s',
    );
  });

  it('rewrites the four-line terminal block in place', () => {
    const writes = [];
    const stream = { write: (text) => writes.push(text) };
    writePRProgress({ completed: 0, total: 2, elapsedMs: 0, etaMs: 0 }, stream);
    writePRProgress({ completed: 1, total: 2, elapsedMs: 1000, etaMs: 1000 }, stream);
    writePRProgress({ completed: 2, total: 2, elapsedMs: 2000, etaMs: 0 }, stream);
    const output = writes.join('');
    assert.equal(output.startsWith('\r\u001b[2KFetching PR details: 0/2\n'), true);
    assert.equal(output.includes('\u001b[4A\r\u001b[2KFetching PR details: 1/2\n'), true);
    assert.equal(output.includes('\u001b[4A\r\u001b[2KFetching PR details: 2/2\n'), true);
    assert.equal(output.endsWith('\n'), true);
  });
});
