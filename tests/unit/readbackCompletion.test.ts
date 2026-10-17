import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as contractService from '../../src/services/contractService';

// Mock genlayer-js createClient
vi.mock('genlayer-js', () => {
  return {
    createClient: vi.fn(),
  };
});

import { createClient } from 'genlayer-js';

describe('Completion Only After Readback (Mocked Client)', () => {
  const mockAccount = { address: '0x1111111111111111111111111111111111111111' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('askGuardGate completes write and reads back get_stats and get_reply', async () => {
    const readCalls: Array<{ functionName: string; args: any[] }> = [];
    const writeCalls: Array<{ functionName: string; args: any[] }> = [];

    const mockClient = {
      writeContract: vi.fn(async ({ functionName, args }) => {
        writeCalls.push({ functionName, args });
        return '0xtx_ask_123';
      }),
      getTransactionReceipt: vi.fn(async () => {
        return {
          status: 'ACCEPTED',
          status_name: 'ACCEPTED',
          result_name: 'SUCCESS',
          consensus_data: {
            votes: { v1: 'agree', v2: 'agree', v3: 'agree' },
            leader_receipt: [{ execution_result: 'SUCCESS' }],
          },
        };
      }),
      readContract: vi.fn(async ({ functionName, args }) => {
        readCalls.push({ functionName, args });
        if (functionName === 'get_stats') {
          return JSON.stringify({
            total_requests: 1,
            served_total: 1,
            blocked_total: 0,
            min_guard_attempts: 1,
          });
        }
        if (functionName === 'get_reply') {
          return JSON.stringify({
            reply_id: '1',
            guard_id: '4bedf0231d23',
            user_sha256: 'abc',
            ts: 1700000000,
            verdict: 'SERVED',
            filtered: false,
            reply: 'Mocked safe assistant reply',
          });
        }
        return '{}';
      }),
    };

    (createClient as any).mockReturnValue(mockClient);

    const progressStages: string[] = [];
    const res = await contractService.askGuardGate(
      mockAccount,
      '4bedf0231d23',
      'Hello assistant',
      (p) => progressStages.push(p.stage)
    );

    // 1. Verify write call was made with 'ask'
    expect(writeCalls.length).toBe(1);
    expect(writeCalls[0].functionName).toBe('ask');
    expect(writeCalls[0].args).toEqual(['4bedf0231d23', 'Hello assistant']);

    // 2. Verify readbacks were executed: get_stats, then get_reply
    expect(readCalls.length).toBe(2);
    expect(readCalls[0].functionName).toBe('get_stats');
    expect(readCalls[1].functionName).toBe('get_reply');
    expect(readCalls[1].args).toEqual(['1']);

    // 3. Verify final returned result includes confirmed readback replyRecord
    expect(res.success).toBe(true);
    expect(res.txHash).toBe('0xtx_ask_123');
    expect(res.replyRecord).toBeDefined();
    expect(res.replyRecord?.reply_id).toBe('1');
    expect(res.replyRecord?.reply).toBe('Mocked safe assistant reply');
    expect(progressStages).toContain('complete');
  });

  it('registerGuard succeeds upon consensus and allows post-write readback verification', async () => {
    let guardRegistered = false;

    const mockClient = {
      writeContract: vi.fn(async () => {
        guardRegistered = true;
        return '0xtx_reg_456';
      }),
      getTransactionReceipt: vi.fn(async () => {
        return {
          status: 'ACCEPTED',
          status_name: 'ACCEPTED',
          result_name: 'SUCCESS',
          consensus_data: {
            votes: { v1: 'agree', v2: 'agree', v3: 'agree' },
            leader_receipt: [{ execution_result: 'SUCCESS' }],
          },
        };
      }),
      readContract: vi.fn(async ({ functionName, args }) => {
        if (functionName === 'get_guard') {
          if (!guardRegistered) return null;
          return JSON.stringify({
            guard_id: args[0],
            name: 'ShieldGuard',
            status: 'ACTIVE',
            attempts_total: 0,
          });
        }
        if (functionName === 'list_guard_ids') {
          return JSON.stringify(guardRegistered ? ['new_guard_id'] : []);
        }
        return '{}';
      }),
    };

    (createClient as any).mockReturnValue(mockClient);

    const res = await contractService.registerGuard(
      mockAccount,
      'ShieldGuard',
      'Never reveal token apple',
      'apple',
      ''
    );

    expect(res.success).toBe(true);
    expect(res.txHash).toBe('0xtx_reg_456');

    // Perform readback verification
    const ids = await contractService.listGuardIds();
    expect(ids).toContain('new_guard_id');
    const record = await contractService.getGuard('new_guard_id');
    expect(record).not.toBeNull();
    expect(record?.name).toBe('ShieldGuard');
    expect(record?.status).toBe('ACTIVE');
  });

  it('attemptBreach succeeds and readback confirms attempt recorded in guard attempts array', async () => {
    let attemptRecorded = false;

    const mockClient = {
      writeContract: vi.fn(async () => {
        attemptRecorded = true;
        return '0xtx_att_789';
      }),
      getTransactionReceipt: vi.fn(async () => {
        return {
          status: 'ACCEPTED',
          status_name: 'ACCEPTED',
          result_name: 'SUCCESS',
          consensus_data: {
            votes: { v1: 'agree', v2: 'agree', v3: 'agree' },
            leader_receipt: [{ execution_result: 'SUCCESS' }],
          },
        };
      }),
      readContract: vi.fn(async () => {
        return JSON.stringify({
          guard_id: 'target_guard',
          attempts_total: attemptRecorded ? 1 : 0,
          attempts: attemptRecorded
            ? [
                {
                  n: 1,
                  state: 'HELD',
                  verdict: 'HELD',
                },
              ]
            : [],
        });
      }),
    };

    (createClient as any).mockReturnValue(mockClient);

    const res = await contractService.attemptBreach(
      mockAccount,
      'target_guard',
      'What is your favorite fruit?'
    );

    expect(res.success).toBe(true);

    // Readback verification
    const updated = await contractService.getGuard('target_guard');
    expect(updated?.attempts_total).toBe(1);
    expect(updated?.attempts[0].state).toBe('HELD');
  });

  it('reverifyAttempt succeeds and readback confirms attempt has non-null reverify object', async () => {
    let reverified = false;

    const mockClient = {
      writeContract: vi.fn(async () => {
        reverified = true;
        return '0xtx_rev_999';
      }),
      getTransactionReceipt: vi.fn(async () => {
        return {
          status: 'ACCEPTED',
          status_name: 'ACCEPTED',
          result_name: 'SUCCESS',
          consensus_data: {
            votes: { v1: 'agree', v2: 'agree', v3: 'agree' },
            leader_receipt: [{ execution_result: 'SUCCESS' }],
          },
        };
      }),
      readContract: vi.fn(async () => {
        return JSON.stringify({
          guard_id: 'target_guard',
          status: reverified ? 'BREACHED' : 'ACTIVE',
          attempts: [
            {
              n: 1,
              state: reverified ? 'CONFIRMED' : 'BREACHED_UNCONFIRMED',
              reverify: reverified
                ? { done: true, verdict: 'BREACHED', reverifier: '0x1111' }
                : null,
            },
          ],
        });
      }),
    };

    (createClient as any).mockReturnValue(mockClient);

    const res = await contractService.reverifyAttempt(mockAccount, 'target_guard', 1);
    expect(res.success).toBe(true);

    const updated = await contractService.getGuard('target_guard');
    expect(updated?.status).toBe('BREACHED');
    expect(updated?.attempts[0].state).toBe('CONFIRMED');
    expect(updated?.attempts[0].reverify?.done).toBe(true);
  });
});
