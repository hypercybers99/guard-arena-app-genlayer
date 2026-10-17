import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { explainRevertReason } from '../../src/lib/revertMap';

function parseContractUserErrors(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const errorPatterns: string[] = [];
  const searchStr = 'gl.vm.UserError(';

  let pos = 0;
  while ((pos = content.indexOf(searchStr, pos)) !== -1) {
    const start = pos + searchStr.length;
    let depth = 1;
    let end = start;
    while (end < content.length && depth > 0) {
      if (content[end] === '(') depth++;
      else if (content[end] === ')') depth--;
      end++;
    }
    const rawArg = content.slice(start, end - 1).trim();
    if (rawArg.startsWith('f"') || rawArg.startsWith("f'")) {
      const body = rawArg.slice(2, -1);
      const instantiated = body.replace(/\{[^}]+\}/g, '42');
      errorPatterns.push(instantiated);
    } else if (rawArg.startsWith('"') || rawArg.startsWith("'")) {
      const body = rawArg.slice(1, -1);
      errorPatterns.push(body);
    }
    pos = end;
  }

  return [...new Set(errorPatterns)];
}

describe('Revert Reason Completeness against Reference Contracts', () => {
  const arenaPath = path.join(process.cwd(), 'contracts-reference', 'GuardArena.py');
  const gatePath = path.join(process.cwd(), 'contracts-reference', 'GuardGate.py');

  const arenaErrors = parseContractUserErrors(arenaPath);
  const gateErrors = parseContractUserErrors(gatePath);
  const allContractErrors = [...new Set([...arenaErrors, ...gateErrors])];

  it('extracts all contract UserError strings from both contracts', () => {
    expect(arenaErrors.length).toBeGreaterThan(15);
    expect(gateErrors.length).toBeGreaterThan(5);
    expect(allContractErrors).toContain('attack already attempted');
    expect(allContractErrors).toContain('forbidden token must be from approved wordlist');
    expect(allContractErrors).toContain('parent guard is not breached');
  });

  it('provides a friendly mapped explanation for EVERY contract UserError', () => {
    for (const rawError of allContractErrors) {
      const explanation = explainRevertReason(rawError);

      // Must not equal the raw error string
      expect(
        explanation !== rawError,
        `Contract UserError '${rawError}' has no friendly mapping in revertMap.ts!`
      ).toBe(true);

      // Must be a helpful message
      expect(explanation.length).toBeGreaterThan(15);
    }
  });

  it('maps specific known negative flow errors to friendly text', () => {
    expect(explainRevertReason('attack already attempted')).toBe(
      'Duplicate Attack: This exact attack prompt has already been attempted on this guard.'
    );
    expect(explainRevertReason('forbidden token must be from approved wordlist')).toBe(
      'Forbidden token must be one of the approved 64 words from the TOKEN_WORDLIST.'
    );
    expect(explainRevertReason('parent guard is not breached')).toBe(
      'Lineage Rule: Only guards with a CONFIRMED breach may be chosen as parent; this guard is active/unbreached.'
    );
    expect(explainRevertReason('guard fails baseline probes')).toContain('Probe Failure');
    expect(explainRevertReason('guard fails utility probe')).toContain('Utility Failure');
  });
});
