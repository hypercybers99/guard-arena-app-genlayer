import fs from 'fs';
import path from 'path';

const SECRET_PATTERNS = [
  { pattern: /0x[a-fA-F0-9]{64}/, name: 'raw private key / 32-byte secret (outside allowlist)' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub Personal Access Token' },
  { pattern: /sk-[a-zA-Z0-9]{32,}/, name: 'OpenAI Secret Key' },
  { pattern: /BEGIN PRIVATE KEY/, name: 'PEM Private Key' },
];

const ALLOWED_HASHES = new Set([
  '0x515d7e498651de97538d9e41821b3da7fbb724156f6b1b924d37ccb28410aad9'.toLowerCase(), // Arena v1.1.0 deploy
  '0x0b2275177af47611e47d057c77c5c971e8e41cff1fd76ba6ac700d68586a0147'.toLowerCase(), // Gate v1.1.0 deploy
  '0x8c7cf7754804996df19d8e355df3f01b28ac5f64a22655f96a9857afdf25fba0'.toLowerCase(), // Arena deploy
  '0xbabc4708a844890d1b25ddc9c263ed956c6e08753772682dcec38c110c206f21'.toLowerCase(), // Gate deploy
  '0xee2fcce3cb68115d0774f785ef1a33d808d10cb781d82fe0420c3b4793086c10'.toLowerCase(), // Superseded deploy
  '0x4194687a8edff116798eac748ec0ab50eaaa42180c876419a1e6b1a127220b3f'.toLowerCase(), // Step 0c register_guard tx
  '0x6d9bc8690a634218b5bd0dd2cdc8221408f12a00a3cc56a6bf4dc60dd148a090'.toLowerCase(), // Step 0c attempt_breach tx
  '0x42fa431930e6eb8554efcc1b9d9cdecc2eaee19741d05566edec705a0f1bdaa3'.toLowerCase(), // Step 0c guard_gate_ask tx
]);

const rootDir = process.cwd();
const dirsToScan = ['src'];
const filesToScan = ['README.md'];

let violations = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comments explaining format
    if (line.includes('generatePrivateKey') || line.includes('formattedKey')) return;

    for (const rule of SECRET_PATTERNS) {
      const match = line.match(rule.pattern);
      if (match) {
        const found = match[0].toLowerCase();
        if (ALLOWED_HASHES.has(found)) continue;
        // Check if it's in a test file or evidence file
        if (filePath.includes('live_evidence.json') || filePath.includes('verification_result.json')) continue;
        violations.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          name: rule.name,
          match: found.slice(0, 10) + '...',
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
      if (['.ts', '.tsx', '.mjs', '.js', '.md'].includes(path.extname(entry.name))) {
        checkFile(fullPath);
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
    checkFile(full);
  }
}

if (violations.length > 0) {
  console.error('FAILED: Potential secrets detected:');
  violations.forEach((v) => console.error(`  ${v.file}:${v.line} -> ${v.name} (${v.match})`));
  process.exit(1);
}

console.log('PASS: Zero secrets detected across source files.');
process.exit(0);
