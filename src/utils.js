import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * Run a command and return stdout, or throw on failure.
 * @param {string} cmd
 * @param {object} [options]
 * @returns {string}
 */
export function exec(cmd, options = {}) {
  return execSync(cmd, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  }).trimEnd();
}

/**
 * Run a command and return stdout, or return a default on failure.
 * @param {string} cmd
 * @param {string} fallback
 * @returns {string}
 */
export function execSafe(cmd, fallback = '') {
  try {
    return exec(cmd);
  } catch {
    return fallback;
  }
}

/**
 * Check if a command is available on PATH.
 * @param {string} cmd
 * @returns {boolean}
 */
export function commandExists(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Escapes special markdown characters in a string.
 * @param {string} str
 * @returns {string}
 */
export function escMd(str) {
  return String(str).replace(/([_*[\]`|])/g, '\\$1');
}

/**
 * Format a date string into a friendlier format.
 * @param {string} isoDate - ISO 8601 date string
 * @returns {string}
 */
export function formatDate(isoDate) {
  if (!isoDate) return 'unknown';
  const d = new Date(isoDate);
  return d.toUTCString().replace(' GMT', '');
}

/**
 * Ensure we're inside a git repository.
 * @throws {Error}
 */
export function ensureGitRepo() {
  if (!existsSync('.git') && execSafe('git rev-parse --git-dir') === '') {
    throw new Error('Not inside a git repository');
  }
}
