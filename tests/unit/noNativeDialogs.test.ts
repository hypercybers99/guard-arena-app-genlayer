import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('No Native Dialogs Scanner', () => {
  const srcDir = path.join(process.cwd(), 'src');

  function scanDirectory(dir: string): string[] {
    let files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(scanDirectory(full));
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        files.push(full);
      }
    }
    return files;
  }

  it('proves zero usage of window.alert, window.confirm, window.prompt or alert/confirm/prompt in src/', () => {
    const files = scanDirectory(srcDir);
    expect(files.length).toBeGreaterThan(0);

    const violations: Array<{ file: string; line: number; text: string }> = [];

    const nativeDialogPattern = /\b(window\.)?(alert|confirm|prompt)\s*\(/;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude comments
        const cleanLine = line.trim();
        if (cleanLine.startsWith('//') || cleanLine.startsWith('/*')) return;
        if (nativeDialogPattern.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), file),
            line: idx + 1,
            text: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Native dialog calls detected in codebase: ${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });
});
