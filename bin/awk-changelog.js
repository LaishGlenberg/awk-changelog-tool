#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { generateChangelog } from '../src/changelog.js';
import { generateChangelogWithPRs } from '../src/changelog-pr.js';
import { writePRProgress } from '../src/pr-progress.js';
import { readFile } from 'node:fs/promises';
import { execSafe } from '../src/utils.js';
import { mergeIncrementalChangelog } from '../src/incremental.js';

const pkg = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf-8')
);

const program = new Command();

function getLastRecordedCommit(changelog) {
  const match = changelog.match(/^## ([0-9a-f]{7,40}) —/m);
  if (!match) return null;
  return execSafe(`git rev-parse --verify "${match[1]}^{commit}"`);
}

program
  .name('awkch')
  .description('Lightning-fast changelog generator from git history')
  .version(pkg.version, '-v, -V, --version');

// ── Default run ──
program
  .argument('[since]', 'Starting ref (default: first commit)')
  .option('-o, --output <file>', 'Output file')
  .option('-p, --pr', 'Include PR descriptions (requires gh CLI)')
  .option('-n, --no-email', 'Strip email addresses from author names')
  .option('-d, --default', 'Set output to CHANGELOG.md')
  .option('-a, --all', 'Shorthand for --pr --default')
  .addHelpText('after', `
Examples:
  $ awkch                          Generate a changelog from the first commit
  $ awkch HEAD~49                  Include the last 50 commits
  $ awkch HEAD~49 --pr             Include PR descriptions for the last 50 commits
  $ awkch --pr -o CHANGELOG.md     Write a changelog with PR descriptions
  $ awkch --all                    Include PR descriptions and write CHANGELOG.md
`)
  .allowExcessArguments(false)
  .action((since, options) => {
    // --all is shorthand for --pr --default
    if (options.all) {
      options.pr = true;
      options.default = true;
    }

    // --default sets output to CHANGELOG.md (unless -o was explicitly given)
    if (options.default && !options.output) {
      options.output = 'CHANGELOG.md';
    }

    // Delegate based on --pr flag
    if (options.pr) {
      try {
        const onProgress = process.stderr.isTTY
          ? writePRProgress
          : undefined;
        const outputPath = options.output && resolve(options.output);
        let existing = '';
        let incrementalOptions = {};
        if (!since && outputPath && existsSync(outputPath)) {
          existing = readFileSync(outputPath, 'utf-8');
          const lastCommit = getLastRecordedCommit(existing);
          if (lastCommit) {
            incrementalOptions = {
              since: lastCommit,
              excludeSince: true,
              afterDate: execSafe(`git show -s --format=%cI "${lastCommit}"`),
            };
          }
        }
        const result = generateChangelogWithPRs({
          ...incrementalOptions,
          noEmail: options.email === false,
          onProgress,
        });
        if (outputPath) {
          const output = existing && incrementalOptions.since
            ? mergeIncrementalChangelog(existing, result.changelog)
            : result.changelog;
          writeFileSync(outputPath, output, 'utf-8');
          console.error(`✅ Changelog written to ${options.output}`);
        } else {
          process.stdout.write(result.changelog);
        }
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
    } else {
      try {
        const changelog = generateChangelog({ since, noEmail: options.email === false });
        if (options.output) {
          writeFileSync(resolve(options.output), changelog, 'utf-8');
          console.error(`✅ Changelog written to ${options.output}`);
        } else {
          process.stdout.write(changelog);
        }
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
    }
  });

program.parse(process.argv);
