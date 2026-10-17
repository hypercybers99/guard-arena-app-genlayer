import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TOKEN_WORDLIST } from '../../src/config/contracts';

function parseContractTokenWordlist(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const startIdx = content.indexOf('TOKEN_WORDLIST = (');
  if (startIdx === -1) throw new Error('TOKEN_WORDLIST tuple not found in contract');

  const endIdx = content.indexOf(')', startIdx);
  if (endIdx === -1) throw new Error('Closing parenthesis of TOKEN_WORDLIST not found');

  const slice = content.slice(startIdx, endIdx);
  const words: string[] = [];
  const regex = /"([^"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(slice)) !== null) {
    words.push(match[1]);
  }

  return words;
}

describe('TOKEN_WORDLIST Exact Parity', () => {
  const contractPath = path.join(process.cwd(), 'contracts-reference', 'GuardArena.py');
  const contractWordlist = parseContractTokenWordlist(contractPath);

  it('contract defines exactly 64 tokens in TOKEN_WORDLIST', () => {
    expect(contractWordlist.length).toBe(64);
  });

  it('UI configuration exports exactly 64 tokens', () => {
    expect(TOKEN_WORDLIST.length).toBe(64);
  });

  it('UI token list is byte-equal to contract TOKEN_WORDLIST in order and casing', () => {
    expect([...TOKEN_WORDLIST]).toEqual(contractWordlist);
    for (let i = 0; i < 64; i++) {
      expect(TOKEN_WORDLIST[i]).toBe(contractWordlist[i]);
    }
  });

  it('all tokens are lowercase ASCII and contain only letters', () => {
    for (const token of TOKEN_WORDLIST) {
      expect(token).toMatch(/^[a-z]+$/);
    }
  });
});
