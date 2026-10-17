import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as contractService from '../../src/services/contractService';

vi.mock('genlayer-js', () => {
  return {
    createClient: vi.fn(),
  };
});

import { createClient } from 'genlayer-js';

describe('RPC Failure vs Empty Result / Not Found Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly classifies transport/network errors as isRpcTransportError', () => {
    expect(contractService.isRpcTransportError(new Error('Failed to fetch'))).toBe(true);
    expect(contractService.isRpcTransportError(new Error('fetch failed'))).toBe(true);
    expect(contractService.isRpcTransportError(new Error('Network error: connection timeout'))).toBe(true);
    expect(contractService.isRpcTransportError(new Error('HTTP 502 Bad Gateway'))).toBe(true);
    expect(contractService.isRpcTransportError(new Error('ECONNREFUSED 127.0.0.1:443'))).toBe(true);
  });

  it('does NOT classify contract UserError reverts as transport errors', () => {
    expect(contractService.isRpcTransportError(new Error('UserError: guard not found'))).toBe(false);
    expect(contractService.isRpcTransportError(new Error('UserError: attack already attempted'))).toBe(false);
  });

  it('getGuardSafely returns rpc_error with canRetry=true on network failure, NEVER false not_found', async () => {
    const mockClient = {
      readContract: vi.fn(async () => {
        throw new Error('TypeError: Failed to fetch (504 Gateway Timeout)');
      }),
    };
    (createClient as any).mockReturnValue(mockClient);

    const result = await contractService.getGuardSafely('any_guard_id');

    expect(result.status).toBe('rpc_error');
    if (result.status === 'rpc_error') {
      expect(result.canRetry).toBe(true);
      expect(result.error).toContain('RPC Transport Error');
    }
  });

  it('getGuardSafely returns not_found when contract reports guard not found', async () => {
    const mockClient = {
      readContract: vi.fn(async () => {
        throw new Error('execution reverted: UserError: guard not found');
      }),
    };
    (createClient as any).mockReturnValue(mockClient);

    const result = await contractService.getGuardSafely('non_existent_id');

    expect(result.status).toBe('not_found');
    if (result.status === 'not_found') {
      expect(result.error).toContain('guard not found');
    }
  });

  it('getGuardSafely returns success with parsed data when contract returns valid record', async () => {
    const mockRecord = {
      guard_id: 'guard_123',
      name: 'SafeGuard',
      token: 'apple',
      status: 'ACTIVE',
    };

    const mockClient = {
      readContract: vi.fn(async () => {
        return JSON.stringify(mockRecord);
      }),
    };
    (createClient as any).mockReturnValue(mockClient);

    const result = await contractService.getGuardSafely('guard_123');

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.name).toBe('SafeGuard');
      expect(result.data.guard_id).toBe('guard_123');
    }
  });
});
