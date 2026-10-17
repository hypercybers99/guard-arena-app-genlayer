import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PINNED = [
  {
    name: 'GuardArena.py',
    expected: 'fd163692452d869e1422c63efc09b388269e68175f22bcff3b0783e9ed55f1c4',
  },
  {
    name: 'GuardGate.py',
    expected: '4f4ef9bd903f24b145faecfef50a2d78227fa68e2693cc7eb07889cf76c92233',
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
