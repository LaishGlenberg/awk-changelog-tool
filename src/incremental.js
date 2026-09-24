/**
 * Merge newly generated commit entries into an existing awkch changelog.
 * Existing entries are preserved; only the summary counts and new entries change.
 * @param {string} existing
 * @param {string} generated
 * @returns {string}
 */
export function mergeIncrementalChangelog(existing, generated) {
  const entryStart = generated.search(/^## /m);
  if (entryStart < 0) return existing;
  const generatedSummary = generated.match(/^\*\*(\d+) commit\(s\)(?:, (\d+) PR\(s\) matched)?\*\*$/m);
  const existingSummary = existing.match(/^\*\*(\d+) commit\(s\)(?:, (\d+) PR\(s\) matched)?\*\*$/m);
  if (!generatedSummary || !existingSummary) return existing;

  const commits = Number(existingSummary[1]) + Number(generatedSummary[1]);
  const prs = Number(existingSummary[2] || 0) + Number(generatedSummary[2] || 0);
  const updated = existing.replace(existingSummary[0], `**${commits} commit(s), ${prs} PR(s) matched**`);
  const summary = `**${commits} commit(s), ${prs} PR(s) matched**`;
  const summaryEnd = updated.indexOf('\n', updated.indexOf(summary));
  return `${updated.slice(0, summaryEnd + 1)}\n${generated.slice(entryStart).trim()}\n\n${updated.slice(summaryEnd + 1).replace(/^\s+/, '')}`;
}
