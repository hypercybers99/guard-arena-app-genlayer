import fs from 'fs';
import path from 'path';

const BANNED_PATTERNS = [
  { pattern: /\bcryptographic\s+proof\b/i, name: 'cryptographic proof' },
  { pattern: /\btamper-?proof\b/i, name: 'tamper-proof' },
  { pattern: /\bbytecode\b/i, name: 'bytecode' },
  { pattern: /\btestnet\b/i, name: 'testnet' },
  { pattern: /\blive\s+network\b/i, name: 'live network' },
  { pattern: /\bmainnet\b/i, name: 'mainnet' },
  { pattern: /\bunanimous(ly)?\b/i, name: 'unanimous' },
  { pattern: /\brevolutionary\b/i, name: 'revolutionary' },
  {
    pattern: /\bfinalized\b/i,
    name: 'finalized',
    allowPredicate: (line) =>
      line.includes('latest-final') ||
      line.includes('FINALIZED') ||
      line.includes('isTerminalReceiptStatus') ||
      line.includes('receipt.status'),
  },
  {
    pattern: /\blive\b/i,
    name: 'live',
    allowPredicate: (line) =>
      line.includes('live_evidence') ||
      line.includes('run_live') ||
      line.includes('aria-live') ||
      line.includes('LiveEvidence') ||
      line.includes('live-'),
  },
];

const rootDir = process.cwd();
const dirsToScan = ['src', 'docs'];
const filesToScan = ['index.html', 'README.md'];

let violations = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const rule of BANNED_PATTERNS) {
      if (rule.pattern.test(line)) {
        if (rule.allowPredicate && rule.allowPredicate(line)) {
          continue;
        }
        violations.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          word: rule.name,
          text: line.trim(),
        });
      }
    }
  });
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      if (['.ts', '.tsx', '.md', '.html'].includes(path.extname(entry.name))) {
        scanFile(fullPath);
      }
    }
  }
}

for (const d of dirsToScan) {
  scanDir(path.join(rootDir, d));
}

for (const f of filesToScan) {
  const full = path.join(rootDir, f);
  if (fs.existsSync(full)) {
    scanFile(full);
  }
}

if (violations.length > 0) {
  console.error('FAILED: Banned words detected:');
  violations.forEach((v) =>
    console.error(`  ${v.file}:${v.line} [${v.word}] -> "${v.text}"`)
  );
  process.exit(1);
}

console.log('PASS: Zero banned words detected across application code and docs.');
process.exit(0);
