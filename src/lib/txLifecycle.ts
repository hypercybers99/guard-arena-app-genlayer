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
    s === 'SUCCESS' ||
    s === 'REVERTED' ||
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
  return s === 'SUCCESS' || s === 'ACCEPTED' || s === 'FINALIZED' || s === '5' || s === '7';
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

export { explainRevertReason, REVERT_RULES } from './revertMap';

