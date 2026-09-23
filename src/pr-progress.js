/**
 * Format milliseconds as a compact elapsed-time label.
 * @param {number} milliseconds
 * @returns {string}
 */
export function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}m ${String(remainder).padStart(2, '0')}s` : `${remainder}s`;
}

/**
 * Format PR-fetch progress for an interactive terminal.
 * @param {{ completed: number, total: number, elapsedMs: number, averageMs: number, etaMs: number }} progress
 * @returns {string}
 */
export function formatPRProgress(progress) {
  const { completed, total, elapsedMs, averageMs, etaMs } = progress;
  return `Fetching PR details: ${completed}/${total} | ${formatDuration(elapsedMs)} elapsed | avg ${formatDuration(averageMs)}/PR | ETA ${formatDuration(etaMs)}`;
}

/**
 * Write a progress update in place, finishing the line after the last PR.
 * @param {object} progress
 * @param {{ write: (text: string) => unknown }} stream
 */
export function writePRProgress(progress, stream = process.stderr) {
  stream.write(`\r${formatPRProgress(progress)}`);
  if (progress.total > 0 && progress.completed === progress.total) {
    stream.write('\n');
  }
}
