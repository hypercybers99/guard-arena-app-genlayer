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
    expect(GUARD_ARENA_ADDRESS).toBe('0xFcEAb957e1412e063760A534C294B897071E144B');
    expect(GUARD_GATE_ADDRESS).toBe('0xCc9086C43D4152A5f5b5eb7fCfDfcd03a1f67AB6');
    expect(CHAIN_ID).toBe(61999);
    expect(RPC_URL).toBe('https://studio.genlayer.com/api');
  });

  it('has exact pinned contract SHA-256 hashes', () => {
    expect(GUARD_ARENA_SHA256).toBe('a93010bb5a3371b8a2fddcc1b8c12d7a459c9572abe033ef8e265ed6c9872b41');
    expect(GUARD_GATE_SHA256).toBe('6ebf7eb0606c00a95ece12123035e99bcecd9015c311a76a0ab3d3da7c90c4d2');
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
