import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGitLog, formatCommit } from '../src/changelog.js';

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
});
