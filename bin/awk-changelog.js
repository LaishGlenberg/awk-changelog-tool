#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { generateChangelog } from '../src/changelog.js';
import { generateChangelogWithPRs } from '../src/changelog-pr.js';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf-8')
);

const program = new Command();

program
  .name('awkch')
  .description('Lightning-fast changelog generator from git history')
  .version(pkg.version, '-v, -V, --version');

// ── `pr` command — Changelog with PR descriptions ──
program
  .command('pr')
  .description('Generate a changelog with PR descriptions (requires gh CLI)')
  .argument('[since]', 'Starting ref (commit-ish, default: first commit)')
  .option('-o, --output <file>', 'Write to file instead of stdout')
  .option('-n, --no-email', 'Strip email addresses from author names')
  .action((since, options) => {
    try {
      const result = generateChangelogWithPRs({ since, noEmail: options.email === false });

      if (result.prCount === 0) {
        console.error('⚠️  No PR descriptions found. Ensure gh CLI is installed and authenticated.');
      } else {
        console.error(`🔍 Included ${result.prCount} PR description(s)`);
      }

      if (options.output) {
        writeFileSync(resolve(options.output), result.changelog, 'utf-8');
        console.error(`✅ Changelog written to ${options.output}`);
      } else {
        process.stdout.write(result.changelog);
      }
    } catch (err) {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    }
  });

// ── `bash` command — Print path to original bash scripts ──
program
  .command('bash-path')
  .description('Show the path to the original bash scripts')
  .action(() => {
    const bashDir = new URL('../bash/', import.meta.url);
    console.log(bashDir.pathname);
  });

// ── Default: if no subcommand, run log ──
program
  .argument('[since]', 'Starting ref (default: first commit)')
  .option('-o, --output <file>', 'Output file')
  .option('-p, --pr', 'Include PR descriptions (requires gh CLI)')
  .option('-n, --no-email', 'Strip email addresses from author names')
  .option('-d, --default', 'Set output to CHANGELOG.md')
  .option('-a, --all', 'Shorthand for --pr --default')
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
        const result = generateChangelogWithPRs({ since, noEmail: options.email === false });
        if (options.output) {
          writeFileSync(resolve(options.output), result.changelog, 'utf-8');
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
