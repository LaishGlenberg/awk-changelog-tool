import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  commandExists,
  ensureGitRepo,
  escMd,
  exec,
  execSafe,
  formatDate,
} from '../src/utils.js';

describe('exec', () => {
  it('returns trimmed stdout on success', () => {
    assert.equal(exec('echo hi'), 'hi');
  });

  it('throws when the command fails', () => {
    assert.throws(() => exec('node -e "process.exit(3)"'));
  });
});

describe('execSafe', () => {
  it('returns trimmed stdout on success', () => {
    assert.equal(execSafe('echo ok'), 'ok');
  });

  it('returns the fallback when the command fails', () => {
    assert.equal(execSafe('node -e "process.exit(3)"', 'fallback'), 'fallback');
  });

  it('defaults the fallback to an empty string', () => {
    assert.equal(execSafe('node -e "process.exit(3)"'), '');
  });
});

describe('commandExists', () => {
  it('detects an available command', () => {
    assert.equal(commandExists('node --version'), true);
  });

  it('returns false for a missing command', () => {
    assert.equal(commandExists('definitely-not-a-real-binary-xyz --version'), false);
  });
});

describe('escMd', () => {
  it('escapes markdown metacharacters', () => {
    assert.equal(escMd('a_b|c*d[e]'), 'a\\_b\\|c\\*d\\[e\\]');
  });

  it('coerces non-strings', () => {
    assert.equal(escMd(42), '42');
  });
});

describe('formatDate', () => {
  it('returns unknown for empty input', () => {
    assert.equal(formatDate(''), 'unknown');
  });

  it('formats a date in UTC without the GMT suffix', () => {
    assert.equal(formatDate('2025-01-15T10:00:00Z'), 'Wed, 15 Jan 2025 10:00:00');
  });
});

describe('ensureGitRepo', () => {
  it('does not throw inside a git repository', () => {
    assert.doesNotThrow(() => ensureGitRepo());
  });

  it('throws outside a git repository', () => {
    const dir = mkdtempSync(join(tmpdir(), 'awkch-nogit-'));
    const cwd = process.cwd();
    const ceiling = process.env.GIT_CEILING_DIRECTORIES;
    try {
      // Stop git from walking up past the temp dir into any enclosing repo.
      process.env.GIT_CEILING_DIRECTORIES = tmpdir();
      process.chdir(dir);
      assert.throws(() => ensureGitRepo(), /Not inside a git repository/);
    } finally {
      process.chdir(cwd);
      if (ceiling === undefined) delete process.env.GIT_CEILING_DIRECTORIES;
      else process.env.GIT_CEILING_DIRECTORIES = ceiling;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
