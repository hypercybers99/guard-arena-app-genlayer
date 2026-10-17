import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const dirsToScan = ['src', 'contracts-reference'];
const exts = ['.ts', '.tsx', '.py', '.js', '.mjs', '.css', '.html'];

let nonAsciiFiles = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath);
  for (let i = 0; i < content.length; i++) {
    if (content[i] > 127) {
      nonAsciiFiles.push({
        file: path.relative(rootDir, filePath),
        byte: content[i],
        offset: i,
      });
      break;
    }
  }
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
      if (exts.includes(path.extname(entry.name))) {
        checkFile(fullPath);
      }
    }
  }
}

for (const d of dirsToScan) {
  scanDir(path.join(rootDir, d));
}

if (nonAsciiFiles.length > 0) {
  console.error('FAILED: Non-ASCII characters detected in source files:');
  nonAsciiFiles.forEach((f) => console.error(`  ${f.file} at offset ${f.offset}`));
  process.exit(1);
}

console.log('PASS: All examined source files are pure ASCII.');
process.exit(0);
