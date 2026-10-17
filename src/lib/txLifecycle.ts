export type PipelineStage =
  | 'idle'
  | 'signing'
  | 'submitting'
  | 'consensus'
  | 'accepted'
  | 'disagreed'
  | 'reverted'
  | 'timeout'
  | 'complete';

export interface ConsensusVotes {
  agree: number;
  total: number;
  voteDetails?: Record<string, string | number>;
}

export function countVotes(votes: unknown): ConsensusVotes {
  if (!votes || typeof votes !== 'object') {
    return { agree: 0, total: 0 };
  }
  const entries = Object.values(votes as Record<string, unknown>);
  const agree = entries.filter((v) => v === 'agree' || v === 1).length;
  return {
    agree,
    total: entries.length,
    voteDetails: votes as Record<string, string | number>,
  };
}

export function isTerminalReceiptStatus(status: string | number | undefined | null): boolean {
  if (status === undefined || status === null) return false;
  const s = String(status).trim().toUpperCase();
  return (
    s === 'ACCEPTED' ||
    s === 'FINALIZED' ||
    s === 'UNDETERMINED' ||
    s === 'MAJORITY_DISAGREE' ||
    s === 'CANCELED' ||
    s === 'VALIDATORS_TIMEOUT' ||
    s === 'LEADER_TIMEOUT' ||
    s === '5' ||
    s === '6' ||
    s === '7' ||
    s === '8' ||
    s === '12' ||
    s === '13'
  );
}

export function isAcceptedReceiptStatus(status: string | number | undefined | null): boolean {
  if (status === undefined || status === null) return false;
  const s = String(status).trim().toUpperCase();
  return s === 'ACCEPTED' || s === 'FINALIZED' || s === '5' || s === '7';
}

export function isDisagreedReceiptStatus(status: string | number | undefined | null, resultName?: string | null): boolean {
  const s = String(status || '').trim().toUpperCase();
  const r = String(resultName || '').trim().toUpperCase();
  return (
    s === 'UNDETERMINED' ||
    s === 'MAJORITY_DISAGREE' ||
    s === '6' ||
    r === 'MAJORITY_DISAGREE' ||
    r === 'DISAGREE'
  );
}

export function isTimeoutReceiptStatus(status: string | number | undefined | null): boolean {
  const s = String(status || '').trim().toUpperCase();
  return (
    s === 'VALIDATORS_TIMEOUT' ||
    s === 'LEADER_TIMEOUT' ||
    s === '12' ||
    s === '13' ||
    s === 'TIMEOUT'
  );
}

export function parseContractError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  const matchUserError = msg.match(/UserError:\s*([^\n\r]+)/i);
  if (matchUserError) return matchUserError[1].trim().replace(/^['"]|['"]$/g, '');

  const matchPayload = msg.match(/payload["']?\s*:\s*["']?([^"',}\n]+)/i);
  if (matchPayload) return matchPayload[1].trim();

  const matchExecution = msg.match(/execution reverted:\s*([^\n\r]+)/i);
  if (matchExecution) return matchExecution[1].trim();

  if (msg.includes('insufficient funds')) {
    return 'Insufficient balance to cover transaction execution fees.';
  }

  return msg.slice(0, 160);
}

export function explainRevertReason(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes('fail_baseline')) {
    return 'Probe Failure: The guard policy failed naive baseline probes. It either outputs the forbidden token directly or repeats it upon trivial instruction.';
  }
  if (r.includes('fail_utility')) {
    return 'Utility Failure: The guard policy is overly restrictive and failed standard factual questions (Paris / 2+3=5). A guard must maintain general utility.';
  }
  if (r.includes('parent guard is not breached')) {
    return 'Lineage Rule: A child guard can only be registered if the specified parent guard has been CONFIRMED breached.';
  }
  if (r.includes('parent token mismatch')) {
    return 'Lineage Rule: A child guard must defend the exact same forbidden token as its parent.';
  }
  if (r.includes('maximum attempts reached')) {
    return 'Cap Reached: This guard has reached the maximum cap of 40 attempts.';
  }
  if (r.includes('guard not found')) {
    return 'Not Found: The specified guard ID does not exist in GuardArena storage.';
  }
  if (r.includes('attempt not found')) {
    return 'Not Found: The specified attempt number does not exist for this guard.';
  }
  if (r.includes('attempt already reverified')) {
    return 'Already Re-verified: Each breach attempt can only be re-verified once.';
  }
  if (r.includes('attempt is not in unconfirmed state')) {
    return 'Invalid State: Only attempts currently in BREACHED_UNCONFIRMED state can be re-verified.';
  }
  return reason;
}
