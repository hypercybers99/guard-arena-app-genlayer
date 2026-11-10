import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error('FAILED: dist directory does not exist. Run npm run build first.');
  process.exit(1);
}

const indexHtml = path.join(distDir, 'index.html');
if (!fs.existsSync(indexHtml)) {
  console.error('FAILED: dist/index.html is missing.');
  process.exit(1);
}

// Check bundle size & ensure no superseded addresses in dist/
const SUPERSEDED_ADDRESSES = [
  '0x05628E36D65281bfa7EA64DBcCd9Ac9c2e1a6474'.toLowerCase(),
  '0xE699C8828F4F054fEe73B251837CE8B373Ba3D02'.toLowerCase(),
  '0xEb692Bbe9CDdE00a22A799A8650843882e25DF79'.toLowerCase(),
  '0x6ebabD1360f65C4F08DaDfe57ae9af2f7C49dEdD'.toLowerCase(),
];

function checkDistFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
  for (const s of SUPERSEDED_ADDRESSES) {
    if (content.includes(s)) {
      console.error(`FAILED: dist file ${filePath} contains superseded address ${s}!`);
      process.exit(1);
    }
  }
}

function scanDist(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scanDist(full);
    else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.html'))) {
      checkDistFile(full);
    }
  }
}

scanDist(distDir);
console.log('PASS: Bundle verified successfully. No superseded addresses leaked into build output.');
process.exit(0);
