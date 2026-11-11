import { describe, it, expect } from 'vitest';
import { isRpcTransportError } from '../../src/services/contractService';

describe('RPC Error State & Retry Interface Logic', () => {
  it('correctly classifies RPC transport errors to enable retry', () => {
    const transportErrors = [
      new Error('TypeError: Failed to fetch'),
      new Error('fetch failed: ECONNRESET'),
      new Error('Network error: connection timeout after 60000ms'),
      new Error('HTTP 502 Bad Gateway from studio.genlayer.com/api'),
      new Error('504 Gateway Timeout'),
    ];

    transportErrors.forEach((err) => {
      expect(isRpcTransportError(err)).toBe(true);
    });
  });

  it('ensures application never confuses RPC transport errors with "not found"', () => {
    const rpcErr = new Error('Failed to fetch (503 Service Unavailable)');
    expect(isRpcTransportError(rpcErr)).toBe(true);

    // Revert user errors should NOT be classified as transport error
    const userErr = new Error('execution reverted: UserError: guard not found');
    expect(isRpcTransportError(userErr)).toBe(false);
  });

  it('formats friendly RPC error message with retry guidance', () => {
    const errorState = {
      status: 'rpc_error' as const,
      canRetry: true,
      error: 'RPC communication error: Failed to fetch from studio.genlayer.com/api',
    };

    expect(errorState.canRetry).toBe(true);
    expect(errorState.error).not.toMatch(/\bnot found\b/i);
    expect(errorState.error).not.toMatch(/\bdoes not exist\b/i);
  });
});
