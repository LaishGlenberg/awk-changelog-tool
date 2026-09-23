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
 * @param {{ completed: number, total: number, elapsedMs: number, etaMs: number }} progress
 * @returns {string}
 */
export function formatPRProgress(progress) {
  const { completed, total, elapsedMs, etaMs } = progress;
  const rate = elapsedMs > 0 ? completed / (elapsedMs / 1000) : 0;
  const rateLabel = rate >= 0.01
    ? `${Number(rate.toFixed(2))} pr/s`
    : rate > 0 ? '<0.01 pr/s' : 'calculating...';
  const etaLabel = completed > 0 ? formatDuration(etaMs) : 'calculating...';
  const valueColumn = 21;
  const row = (label, value) => `${label.padEnd(valueColumn)}${value}`;

  return [
    `Fetching PR details: ${completed}/${total}`,
    row('Time Remaining:', etaLabel),
    row('Elapsed:', formatDuration(elapsedMs)),
    row('Avg:', rateLabel),
  ].join('\n');
}

/**
 * Write a multi-line progress update in place, finishing after the last PR.
 * @param {object} progress
 * @param {{ write: (text: string) => unknown }} stream
 */
export function writePRProgress(progress, stream = process.stderr) {
  const moveToStart = progress.completed > 0 ? '\u001b[4A' : '';
  const lines = formatPRProgress(progress).split('\n');
  const updatedLines = lines.map((line) => `\r\u001b[2K${line}\n`).join('');
  stream.write(moveToStart + updatedLines);
}
