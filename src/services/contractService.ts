import { createClient } from 'genlayer-js';
import {
  GENLAYER_CHAIN,
  RPC_URL,
  GUARD_ARENA_ADDRESS,
  GUARD_GATE_ADDRESS,
} from '../config/contracts';
import {
  countVotes,
  isTerminalReceiptStatus,
  isAcceptedReceiptStatus,
  parseContractError,
  type ConsensusVotes,
} from '../lib/txLifecycle';

export interface AttemptRecord {
  n: number;
  attacker: string;
  attack_text_sha256?: string;
  attack_sha256?: string;
  attack_text_excerpt: string;
  ts: number;
  samples_breached: number;
  verdict: 'HELD' | 'BREACHED';
  reply_sha256: string;
  reply_len: number;
  excerpt: string | null;
  state: 'HELD' | 'BREACHED_UNCONFIRMED' | 'CONFIRMED' | 'FLAKY';
  reverify_tx?: string;
  reverify_ts?: number;
}

export interface GuardRecord {
  schema_version: string;
  guard_id: string;
  name: string;
  policy: string;
  token: string;
  defender: string;
  created_ts: number;
  created_at: string;
  status: 'ACTIVE' | 'BREACHED';
  attempts_total: number;
  held_total: number;
  unconfirmed_total: number;
  breached_confirmed_total: number;
  flaky_total: number;
  parent_guard_id: string;
  generation: number;
  registration_probes: {
    naive: string[];
    utility: string[];
  };
  attempts: AttemptRecord[];
}

export interface LeaderboardEntry {
  guard_id: string;
  name: string;
  token: string;
  defender: string;
  robustness_score: number;
  attempts_total: number;
  held_total: number;
  status: 'ACTIVE' | 'BREACHED';
  generation: number;
}

export interface ArenaMeta {
  nonce: number;
  guard_count: number;
  min_guard_attempts: number;
  min_reverify_per_attempt: number;
  reply_cap_chars: number;
  samples_per_attempt: number;
}

export interface GateReplyRecord {
  schema_version?: string;
  request_id?: string;
  reply_id?: string;
  requester?: string;
  guard_id: string;
  user_sha256?: string;
  ts?: number;
  created_ts?: number;
  created_at?: string;
  verdict: string;
  filtered: boolean;
  reply: string;
  reply_sha256?: string;
}

export interface TxProgressUpdate {
  stage: 'idle' | 'signing' | 'submitting' | 'consensus' | 'accepted' | 'disagreed' | 'reverted' | 'timeout' | 'complete';
  txHash?: string;
  statusName?: string;
  resultName?: string;
  votes?: ConsensusVotes;
  error?: string;
  elapsedSec?: number;
}

export function getClient(account?: any) {
  return createClient({
    chain: GENLAYER_CHAIN,
    endpoint: RPC_URL,
    account,
  });
}

// ----------------- Read Methods -----------------

export async function listGuardIds(offset = 0, limit = 50): Promise<string[]> {
  try {
    const client = getClient();
    const raw = await client.readContract({
      address: GUARD_ARENA_ADDRESS,
      functionName: 'list_guard_ids',
      args: [offset, limit],
    });
    return JSON.parse(raw as string);
  } catch (err) {
    console.error('Failed to list guard IDs:', err);
    return [];
  }
}

export type ContractQueryResult<T> =
  | { status: 'success'; data: T; error?: never }
  | { status: 'not_found'; data?: never; error: string }
  | { status: 'rpc_error'; data?: never; error: string; canRetry: true };

export function isRpcTransportError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('usererror') || msg.includes('guard not found') || msg.includes('request not found')) {
    return false;
  }
  return (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('connection') ||
    msg.includes('econnrefused') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('failed to fetch')
  );
}

export async function getGuardSafely(guardId: string): Promise<ContractQueryResult<GuardRecord>> {
  try {
    const client = getClient();
    const raw = await client.readContract({
      address: GUARD_ARENA_ADDRESS,
      functionName: 'get_guard',
      args: [guardId],
    });
    if (!raw) {
      return { status: 'not_found', error: 'Guard record is empty' };
    }
    const parsed = JSON.parse(raw as string);
    return { status: 'success', data: parsed };
  } catch (err: any) {
    if (isRpcTransportError(err)) {
      return {
        status: 'rpc_error',
        error: `RPC Transport Error: ${err.message || 'Network failure'}`,
        canRetry: true,
      };
    }
    const msg = parseContractError(err);
    if (msg.toLowerCase().includes('not found')) {
      return { status: 'not_found', error: msg };
    }
    return {
      status: 'rpc_error',
      error: `RPC Error: ${msg}`,
      canRetry: true,
    };
  }
}

export async function getGuard(guardId: string): Promise<GuardRecord | null> {
  const res = await getGuardSafely(guardId);
  return res.status === 'success' ? res.data : null;
}

export async function getAllGuards(): Promise<GuardRecord[]> {
  const ids = await listGuardIds(0, 100);
  const guards = await Promise.all(ids.map((id) => getGuard(id)));
  return guards.filter((g): g is GuardRecord => g !== null);
}

export async function getLineage(guardId: string): Promise<{ ancestors: string[]; descendants: string[] }> {
  try {
    const client = getClient();
    const raw = await client.readContract({
      address: GUARD_ARENA_ADDRESS,
      functionName: 'get_lineage',
      args: [guardId],
    });
    return JSON.parse(raw as string);
  } catch (err) {
    console.error(`Failed to get lineage for ${guardId}:`, err);
    return { ancestors: [], descendants: [] };
  }
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  try {
    const client = getClient();
    const raw = await client.readContract({
      address: GUARD_ARENA_ADDRESS,
      functionName: 'get_leaderboard',
      args: [limit],
    });
    return JSON.parse(raw as string);
  } catch (err) {
    console.error('Failed to get leaderboard:', err);
    return [];
  }
}

export async function getArenaMeta(): Promise<ArenaMeta | null> {
  try {
    const client = getClient();
    const raw = await client.readContract({
      address: GUARD_ARENA_ADDRESS,
      functionName: 'get_meta',
      args: [],
    });
    return JSON.parse(raw as string);
  } catch (err) {
    console.error('Failed to get arena meta:', err);
    return null;
  }
}

export async function getGateReply(replyId: string): Promise<GateReplyRecord | null> {
  try {
    const client = getClient();
    const raw = await client.readContract({
      address: GUARD_GATE_ADDRESS,
      functionName: 'get_reply',
      args: [replyId],
    });
    return JSON.parse(raw as string);
  } catch (err) {
    console.error(`Failed to get gate reply ${replyId}:`, err);
    return null;
  }
}

// ----------------- Write Methods with Lifecycle Tracking -----------------

export async function registerGuard(
  account: any,
  name: string,
  policy: string,
  token: string,
  parentGuardId = '',
  onProgress?: (u: TxProgressUpdate) => void
): Promise<{ success: boolean; txHash?: string; error?: string; votes?: ConsensusVotes }> {
  return executeTrackedWrite(
    account,
    GUARD_ARENA_ADDRESS,
    'register_guard',
    [name, policy, token, parentGuardId],
    onProgress
  );
}

export async function attemptBreach(
  account: any,
  guardId: string,
  attackText: string,
  onProgress?: (u: TxProgressUpdate) => void
): Promise<{ success: boolean; txHash?: string; error?: string; votes?: ConsensusVotes }> {
  return executeTrackedWrite(
    account,
    GUARD_ARENA_ADDRESS,
    'attempt_breach',
    [guardId, attackText],
    onProgress
  );
}

export async function reverifyAttempt(
  account: any,
  guardId: string,
  attemptN: number,
  onProgress?: (u: TxProgressUpdate) => void
): Promise<{ success: boolean; txHash?: string; error?: string; votes?: ConsensusVotes }> {
  return executeTrackedWrite(
    account,
    GUARD_ARENA_ADDRESS,
    'reverify_attempt',
    [guardId, attemptN],
    onProgress
  );
}

export interface GateStats {
  total_requests: number;
  served_total: number;
  blocked_total: number;
  min_guard_attempts: number;
}

export async function getGateStats(): Promise<GateStats | null> {
  try {
    const client = getClient();
    const raw = await client.readContract({
      address: GUARD_GATE_ADDRESS,
      functionName: 'get_stats',
      args: [],
    });
    return JSON.parse(raw as string);
  } catch (err) {
    console.error('Failed to get gate stats:', err);
    return null;
  }
}

export async function askGuardGate(
  account: any,
  guardId: string,
  userMessage: string,
  onProgress?: (u: TxProgressUpdate) => void
): Promise<{ success: boolean; txHash?: string; error?: string; votes?: ConsensusVotes; replyRecord?: GateReplyRecord }> {
  const res = await executeTrackedWrite(
    account,
    GUARD_GATE_ADDRESS,
    'ask',
    [guardId, userMessage],
    onProgress
  );

  if (res.success && res.receipt) {
    // Read back latest reply using get_stats nonce
    try {
      const stats = await getGateStats();
      if (stats && stats.total_requests > 0) {
        const reply = await getGateReply(String(stats.total_requests));
        return { ...res, replyRecord: reply || undefined };
      }
    } catch {
      // ignore
    }
  }

  return res;
}


// ----------------- Core Tracked Execution Engine -----------------

async function executeTrackedWrite(
  account: any,
  contractAddress: string,
  functionName: string,
  args: any[],
  onProgress?: (u: TxProgressUpdate) => void
): Promise<{ success: boolean; txHash?: string; error?: string; votes?: ConsensusVotes; receipt?: any }> {
  const client = getClient(account);
  const t0 = Date.now();

  try {
    onProgress?.({ stage: 'signing' });

    onProgress?.({ stage: 'submitting' });
    let txHash: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        txHash = await client.writeContract({
          address: contractAddress as `0x${string}`,
          functionName,
          args,
          value: 0n,
        });
        if (txHash) break;
      } catch (writeErr: any) {
        if (attempt < 2 && isRpcTransportError(writeErr)) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw writeErr;
      }
    }

    if (!txHash) {
      throw new Error('Failed to obtain transaction hash from broadcast.');
    }

    onProgress?.({
      stage: 'consensus',
      txHash,
      elapsedSec: 0,
    });

    // Poll transaction status and receipt
    let txData: any = null;
    let receipt: any = null;
    let finalTx: any = null;
    const maxRetries = 150;
    const intervalMs = 2500;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((r) => setTimeout(r, intervalMs));
      const elapsedSec = Math.round((Date.now() - t0) / 1000);

      try {
        if (typeof client.getTransaction === 'function') {
          txData = await client.getTransaction({ hash: txHash as any }).catch(() => null);
        }
        if (typeof client.getTransactionReceipt === 'function') {
          receipt = await client.getTransactionReceipt({ hash: txHash as any }).catch(() => null);
        }

        finalTx = (txData && txData.consensus_data) ? txData : (txData || receipt);
        const currentStatus = finalTx?.statusName || finalTx?.status_name || finalTx?.status;
        if (isTerminalReceiptStatus(currentStatus)) {
          break;
        }
      } catch {
        // continue polling
      }

      onProgress?.({
        stage: 'consensus',
        txHash,
        statusName: finalTx?.statusName || finalTx?.status_name || 'PENDING',
        elapsedSec,
      });
    }

    if (!finalTx) {
      throw new Error('Transaction polling timed out after 5 minutes.');
    }

    const votes = countVotes(finalTx.consensus_data?.votes);
    const leaderReceipt = finalTx.consensus_data?.leader_receipt?.[0];
    const leaderResult = leaderReceipt?.execution_result;
    const statusVal = finalTx.statusName || finalTx.status_name || finalTx.status;
    const isSuccess =
      leaderResult === 'SUCCESS' ||
      (isAcceptedReceiptStatus(statusVal) && leaderResult !== 'ERROR' && leaderResult !== 'REVERTED' && leaderResult !== 'FAILED');
    const elapsedSec = Math.round((Date.now() - t0) / 1000);

    if (isSuccess) {
      onProgress?.({
        stage: 'complete',
        txHash,
        statusName: finalTx.statusName || finalTx.status_name,
        resultName: finalTx.result_name || finalTx.resultName,
        votes,
        elapsedSec,
      });
      return { success: true, txHash, votes, receipt: finalTx };
    } else {
      const rawError =
        leaderReceipt?.genvm_result?.error_description ||
        leaderReceipt?.result?.payload?.readable ||
        (typeof leaderReceipt?.result === 'string' ? leaderReceipt.result : JSON.stringify(leaderReceipt?.result || '')) ||
        'Transaction reverted';
      const errorMsg = parseContractError(rawError);
      onProgress?.({
        stage: 'reverted',
        txHash,
        statusName: finalTx.statusName || finalTx.status_name,
        resultName: finalTx.result_name || finalTx.resultName,
        votes,
        error: errorMsg,
        elapsedSec,
      });
      return { success: false, txHash, error: errorMsg, votes, receipt: finalTx };
    }
  } catch (err) {
    const errorMsg = parseContractError(err);
    const elapsedSec = Math.round((Date.now() - t0) / 1000);
    onProgress?.({
      stage: 'reverted',
      error: errorMsg,
      elapsedSec,
    });
    return { success: false, error: errorMsg };
  }
}
