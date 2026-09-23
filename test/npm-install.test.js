import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Pack and install the distributable tarball, then exercise both its CLI and API.
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  return result;
}

const npmCheck = run(npmCommand, ['--version']);
const npmAvailable = npmCheck.status === 0;

test(
  'packs, installs, and runs the published package contents',
  { skip: npmAvailable ? false : 'npm is not available', timeout: 180_000 },
  async () => {
    const workDir = await mkdtemp(join(tmpdir(), 'awkch-npm-install-'));
    const installDir = join(workDir, 'install');
    const fixtureDir = join(installDir, 'fixture');

    try {
      // Pack the exact file set that would be published to npm.
      const pack = run(
        npmCommand,
        ['pack', '--json', '--pack-destination', workDir, '--loglevel=error'],
        { cwd: projectRoot },
      );
      assert.equal(pack.status, 0, pack.stderr);

      const [packageInfo] = JSON.parse(pack.stdout);
      const tarball = join(workDir, packageInfo.filename);
      assert.ok(existsSync(tarball), `npm pack did not create ${tarball}`);

      const packedPaths = packageInfo.files.map((file) => file.path);
      assert.ok(packedPaths.includes('bin/awk-changelog.js'), 'CLI is missing from tarball');
      assert.ok(packedPaths.includes('src/index.js'), 'API entry point is missing from tarball');
      assert.ok(packedPaths.includes('src/pr-progress.js'), 'PR progress module is missing from tarball');

      // Install the local tarball into an isolated project. Ignore dependency
      // lifecycle scripts: this package's CLI/API paths do not require node-jq's
      // optional binary, and the test should not depend on that external download.
      const install = run(npmCommand, [
        'install',
        '--prefix', installDir,
        '--no-audit',
        '--no-fund',
        '--ignore-scripts',
        '--loglevel=error',
        tarball,
      ]);
      assert.equal(install.status, 0, install.stderr);

      const binName = process.platform === 'win32' ? 'awkch.cmd' : 'awkch';
      const bin = join(installDir, 'node_modules', '.bin', binName);
      assert.ok(existsSync(bin), `installed awkch bin is missing: ${bin}`);

      const help = run(bin, ['--help'], {
        cwd: installDir,
        shell: process.platform === 'win32',
      });
      assert.equal(help.status, 0, help.stderr);
      assert.match(help.stdout, /Usage: awkch/);
      assert.match(help.stdout, /Examples:/);

      // Run the installed CLI from a clean git repository, not the source tree.
      await mkdir(fixtureDir, { recursive: true });
      const git = (args) => {
        const result = run('git', args, { cwd: fixtureDir });
        assert.equal(result.status, 0, result.stderr);
      };
      git(['init', '-q']);
      git(['config', 'user.name', 'Package Test']);
      git(['config', 'user.email', 'package-test@example.invalid']);
      await writeFile(join(fixtureDir, 'README.md'), 'Installed package smoke test\n');
      git(['add', 'README.md']);
      git(['commit', '-m', 'test: installed package works']);

      const changelog = run(bin, ['--no-email'], {
        cwd: fixtureDir,
        shell: process.platform === 'win32',
      });
      assert.equal(changelog.status, 0, changelog.stderr);
      assert.match(changelog.stdout, /# Changelog/);
      assert.match(changelog.stdout, /test: installed package works/);

      // Check the package's programmatic entry point resolves after install too.
      const api = run(process.execPath, [
        '--input-type=module',
        '-e',
        "import { generateChangelog } from '@lglen/awk-changelog-tool'; if (typeof generateChangelog !== 'function') process.exit(1)",
      ], { cwd: fixtureDir });
      assert.equal(api.status, 0, api.stderr);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  },
);
