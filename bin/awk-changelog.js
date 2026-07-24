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

// ── Default run ──
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
