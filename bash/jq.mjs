#!/usr/bin/env node
/**
 * jq.mjs — jq filter wrapper using node-jq
 *
 * Usage: node jq.mjs <filter> <json-file>
 *
 * Thin wrapper around the node-jq package so the bash script
 * doesn't need jq installed on the system.
 */
import jq from 'node-jq';

const filter = process.argv[2];
const jsonPath = process.argv[3];

if (!filter || !jsonPath) {
  process.stderr.write('Usage: node jq.mjs <filter> <json-file>\n');
  process.exit(1);
}

try {
  const result = await jq.run(filter, jsonPath, { raw: true });
  process.stdout.write(result);
} catch (err) {
  process.stderr.write(`jq error: ${err.message}\n`);
  process.exit(1);
}
