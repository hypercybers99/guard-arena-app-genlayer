import { describe, it, expect } from 'vitest';
import {
  isTerminalReceiptStatus,
  isAcceptedReceiptStatus,
  isDisagreedReceiptStatus,
  isTimeoutReceiptStatus,
  countVotes,
  parseContractError,
  explainRevertReason,
} from '../../src/lib/txLifecycle';

describe('Transaction Lifecycle SDK Status Code Coverage', () => {
  const terminalStrings = [
    'ACCEPTED',
    'FINALIZED',
    'UNDETERMINED',
    'MAJORITY_DISAGREE',
    'CANCELED',
    'VALIDATORS_TIMEOUT',
    'LEADER_TIMEOUT',
  ];

  const terminalNumbers = [5, 6, 7, 8, 12, 13];
  const terminalNumberStrings = ['5', '6', '7', '8', '12', '13'];

  it('correctly identifies all terminal status strings and numbers', () => {
    for (const status of terminalStrings) {
      expect(isTerminalReceiptStatus(status), `Expected ${status} to be terminal`).toBe(true);
      expect(isTerminalReceiptStatus(status.toLowerCase()), `Expected ${status.toLowerCase()} to be terminal`).toBe(true);
    }

    for (const code of terminalNumbers) {
      expect(isTerminalReceiptStatus(code), `Expected numeric code ${code} to be terminal`).toBe(true);
    }

    for (const codeStr of terminalNumberStrings) {
      expect(isTerminalReceiptStatus(codeStr), `Expected code string ${codeStr} to be terminal`).toBe(true);
    }
  });

  it('correctly identifies non-terminal / in-progress statuses', () => {
    const nonTerminal = ['PENDING', 'SUBMITTED', 'PROPOSING', 'COMMITTING', 'REVEALING', '0', '1', '2', '3', '4', 0, 1, 2, null, undefined, ''];
    for (const s of nonTerminal) {
      expect(isTerminalReceiptStatus(s), `Expected ${String(s)} to be non-terminal`).toBe(false);
    }
  });

  it('correctly classifies accepted statuses', () => {
    const acceptedStatuses = ['ACCEPTED', 'FINALIZED', '5', '7', 5, 7];
    for (const s of acceptedStatuses) {
      expect(isAcceptedReceiptStatus(s), `Expected ${s} to be accepted`).toBe(true);
    }

    const notAccepted = ['UNDETERMINED', 'MAJORITY_DISAGREE', 'VALIDATORS_TIMEOUT', '6', '8', '12', 'PENDING'];
    for (const s of notAccepted) {
      expect(isAcceptedReceiptStatus(s), `Expected ${s} not to be accepted`).toBe(false);
    }
  });

  it('correctly classifies validator disagreement statuses', () => {
    expect(isDisagreedReceiptStatus('UNDETERMINED')).toBe(true);
    expect(isDisagreedReceiptStatus('MAJORITY_DISAGREE')).toBe(true);
    expect(isDisagreedReceiptStatus('6')).toBe(true);
    expect(isDisagreedReceiptStatus(6)).toBe(true);
    expect(isDisagreedReceiptStatus('ACCEPTED', 'MAJORITY_DISAGREE')).toBe(true);
    expect(isDisagreedReceiptStatus('ACCEPTED', 'DISAGREE')).toBe(true);
    expect(isDisagreedReceiptStatus('ACCEPTED', 'SUCCESS')).toBe(false);
    expect(isDisagreedReceiptStatus('FINALIZED')).toBe(false);
  });

  it('correctly classifies timeout statuses', () => {
    expect(isTimeoutReceiptStatus('VALIDATORS_TIMEOUT')).toBe(true);
    expect(isTimeoutReceiptStatus('LEADER_TIMEOUT')).toBe(true);
    expect(isTimeoutReceiptStatus('TIMEOUT')).toBe(true);
    expect(isTimeoutReceiptStatus('12')).toBe(true);
    expect(isTimeoutReceiptStatus('13')).toBe(true);
    expect(isTimeoutReceiptStatus(12)).toBe(true);
    expect(isTimeoutReceiptStatus(13)).toBe(true);
    expect(isTimeoutReceiptStatus('ACCEPTED')).toBe(false);
  });

  it('correctly counts consensus votes across various formats', () => {
    const stringVotes = {
      val1: 'agree',
      val2: 'agree',
      val3: 'idle',
      val4: 'disagree',
    };
    const tally1 = countVotes(stringVotes);
    expect(tally1.agree).toBe(2);
    expect(tally1.total).toBe(4);

    const intVotes = {
      v1: 1,
      v2: 1,
      v3: 1,
      v4: 0,
      v5: 0,
    };
    const tally2 = countVotes(intVotes);
    expect(tally2.agree).toBe(3);
    expect(tally2.total).toBe(5);

    const empty = countVotes(null);
    expect(empty.agree).toBe(0);
    expect(empty.total).toBe(0);
  });

  it('decodes UserError and execution reverts from raw RPC payloads', () => {
    const rawError = 'execution failed: UserError: attack already attempted';
    const parsed = parseContractError(rawError);
    expect(parsed).toBe('attack already attempted');
    expect(explainRevertReason(parsed)).toContain('Duplicate Attack');

    const executionRevert = 'Transaction failed: execution reverted: parent guard is not breached';
    const parsedRevert = parseContractError(executionRevert);
    expect(parsedRevert).toBe('parent guard is not breached');
    expect(explainRevertReason(parsedRevert)).toContain('Lineage Rule');

    const payloadError = '{"code": -32000, "message": "error", "data": {"payload": "forbidden token must be from approved wordlist"}}';
    const parsedPayload = parseContractError(payloadError);
    expect(parsedPayload).toBe('forbidden token must be from approved wordlist');
    expect(explainRevertReason(parsedPayload)).toContain('TOKEN_WORDLIST');
  });
});
