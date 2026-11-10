import fs from 'fs';
import path from 'path';

// Active contract addresses (v1.1.0)
const ACTIVE_ARENA = '0xFcEAb957e1412e063760A534C294B897071E144B'.toLowerCase();
const ACTIVE_GATE = '0xCc9086C43D4152A5f5b5eb7fCfDfcd03a1f67AB6'.toLowerCase();

// Superseded addresses: MUST NOT appear anywhere in src/, scripts/, tests/, docs/
// They may appear ONLY in README.md under the superseded table.
const SUPERSEDED_ADDRESSES = [
  '0x05628E36D65281bfa7EA64DBcCd9Ac9c2e1a6474'.toLowerCase(), // Superseded v1.0.0 Arena
  '0xE699C8828F4F054fEe73B251837CE8B373Ba3D02'.toLowerCase(), // Superseded v1.0.0 Gate
  '0xEb692Bbe9CDdE00a22A799A8650843882e25DF79'.toLowerCase(), // Probe diagnostic
  '0x6ebabD1360f65C4F08DaDfe57ae9af2f7C49dEdD'.toLowerCase(), // Initial Arena deployment
];

const rootDir = process.cwd();
const dirsToCheck = ['src', 'scripts', 'tests', 'docs'];

let leaks = [];

function checkFile(filePath) {
  if (filePath.endsWith('check_address_consistency.mjs')) return;
  if (filePath.endsWith('verify_bundle.mjs')) return;
  const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
  for (const superseded of SUPERSEDED_ADDRESSES) {
    if (content.includes(superseded)) {
      leaks.push({ file: path.relative(rootDir, filePath), superseded });
    }
  }
}

function checkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        checkDir(fullPath);
      }
    } else if (entry.isFile()) {
      checkFile(fullPath);
    }
  }
}

for (const d of dirsToCheck) {
  checkDir(path.join(rootDir, d));
}

if (fs.existsSync(path.join(rootDir, 'index.html'))) {
  checkFile(path.join(rootDir, 'index.html'));
}

if (leaks.length > 0) {
  console.error('FAILED: Superseded contract addresses found outside README.md:');
  leaks.forEach((l) => console.error(`  ${l.file} contains superseded address ${l.superseded}`));
  process.exit(1);
}

console.log('PASS: Zero superseded addresses leaked into application code or docs.');
process.exit(0);
