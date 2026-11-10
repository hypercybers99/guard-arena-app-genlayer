import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PINNED = [
  {
    name: 'GuardArena.py',
    expected: 'a93010bb5a3371b8a2fddcc1b8c12d7a459c9572abe033ef8e265ed6c9872b41',
  },
  {
    name: 'GuardGate.py',
    expected: '6ebf7eb0606c00a95ece12123035e99bcecd9015c311a76a0ab3d3da7c90c4d2',
  },
];

const refDir = path.join(process.cwd(), 'contracts-reference');
let anyFailed = false;

for (const { name, expected } of PINNED) {
  const filePath = path.join(refDir, name);
  if (!fs.existsSync(filePath)) {
    console.error(`FAILED: Missing reference file ${filePath}`);
    anyFailed = true;
    continue;
  }
  const content = fs.readFileSync(filePath);
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    console.error(`FAILED: ${name} sha256 mismatch!`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual:   ${actual}`);
    anyFailed = true;
  } else {
    console.log(`PASS: ${name} byte-identical with pinned sha256 (${actual})`);
  }
}

if (anyFailed) {
  process.exit(1);
}
console.log('All reference contracts verified byte-identical.');
process.exit(0);
