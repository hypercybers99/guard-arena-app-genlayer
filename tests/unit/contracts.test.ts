import { describe, it, expect } from 'vitest';
import {
  GUARD_ARENA_ADDRESS,
  GUARD_ARENA_SHA256,
  GUARD_GATE_ADDRESS,
  GUARD_GATE_SHA256,
  TOKEN_WORDLIST,
  CHAIN_ID,
  RPC_URL,
} from '../../src/config/contracts';

describe('Contracts Configuration & Wordlist Invariants', () => {
  it('has correct Studionet addresses and chain ID', () => {
    expect(GUARD_ARENA_ADDRESS).toBe('0x05628E36D65281bfa7EA64DBcCd9Ac9c2e1a6474');
    expect(GUARD_GATE_ADDRESS).toBe('0xE699C8828F4F054fEe73B251837CE8B373Ba3D02');
    expect(CHAIN_ID).toBe(61999);
    expect(RPC_URL).toBe('https://studio.genlayer.com/api');
  });

  it('has exact pinned contract SHA-256 hashes', () => {
    expect(GUARD_ARENA_SHA256).toBe('fd163692452d869e1422c63efc09b388269e68175f22bcff3b0783e9ed55f1c4');
    expect(GUARD_GATE_SHA256).toBe('4f4ef9bd903f24b145faecfef50a2d78227fa68e2693cc7eb07889cf76c92233');
  });

  it('maintains exactly 64 harmless common nouns in the token wordlist', () => {
    expect(TOKEN_WORDLIST.length).toBe(64);
    expect(new Set(TOKEN_WORDLIST).size).toBe(64);
    expect(TOKEN_WORDLIST).toContain('apple');
    expect(TOKEN_WORDLIST).toContain('banana');
    expect(TOKEN_WORDLIST).toContain('lemon');
    expect(TOKEN_WORDLIST).toContain('pencil');
    expect(TOKEN_WORDLIST).toContain('violin');
  });
});
