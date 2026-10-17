import { describe, it, expect } from 'vitest';
import {
  isTerminalReceiptStatus,
  isAcceptedReceiptStatus,
  countVotes,
  parseContractError,
  explainRevertReason,
} from '../../src/lib/txLifecycle';

describe('Transaction Lifecycle & Error Parsing Tests', () => {
  it('correctly classifies terminal receipt statuses', () => {
    expect(isTerminalReceiptStatus('ACCEPTED')).toBe(true);
    expect(isTerminalReceiptStatus('FINALIZED')).toBe(true);
    expect(isTerminalReceiptStatus('UNDETERMINED')).toBe(true);
    expect(isTerminalReceiptStatus('VALIDATORS_TIMEOUT')).toBe(true);
    expect(isTerminalReceiptStatus('5')).toBe(true);
    expect(isTerminalReceiptStatus('PENDING')).toBe(false);
    expect(isTerminalReceiptStatus(null)).toBe(false);
  });

  it('correctly counts consensus votes', () => {
    const votesObject = {
      v1: 'agree',
      v2: 'agree',
      v3: 'agree',
      v4: 'idle',
      v5: 'idle',
    };
    const tally = countVotes(votesObject);
    expect(tally.agree).toBe(3);
    expect(tally.total).toBe(5);
  });

  it('decodes UserError from RPC payloads', () => {
    const rawError = 'execution failed: UserError: guard failed registration probes: FAIL_BASELINE';
    const parsed = parseContractError(rawError);
    expect(parsed).toContain('FAIL_BASELINE');

    const explained = explainRevertReason(parsed);
    expect(explained).toContain('Probe Failure');
  });

  it('explains parent breach constraint revert reason', () => {
    const reason = 'parent guard is not breached';
    const explained = explainRevertReason(reason);
    expect(explained).toContain('Lineage Rule');
  });
});
