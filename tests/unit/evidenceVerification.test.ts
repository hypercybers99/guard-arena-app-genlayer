import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Evidence Verification Data Integrity', () => {
  const filePath = path.join(process.cwd(), 'docs', 'evidence_verification.json');

  it('reads docs/evidence_verification.json and verifies every hash', () => {
    expect(fs.existsSync(filePath)).toBe(true);

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(data.network).toBe('GenLayer Studionet (Preview)');
    expect(data.chainId).toBe(61999);
    expect(data.totalHashesVerified).toBeGreaterThan(0);
    expect(data.allValid66Chars).toBe(true);

    data.entries.forEach((entry: any) => {
      expect(entry.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(entry.length).toBe(66);
      expect(entry.validFormat).toBe(true);
      expect(entry.honestLabel).toMatch(
        /Accepted by validators|Validators did not agree|Reverted/
      );
    });
  });
});
