import React from 'react';
import type { TxProgressUpdate } from '../services/contractService';
import { getExplorerTxUrl } from '../config/contracts';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Clock } from 'lucide-react';
import { explainRevertReason } from '../lib/txLifecycle';

interface ConsensusProgressProps {
  progress: TxProgressUpdate;
  onDismiss?: () => void;
}

export const ConsensusProgress: React.FC<ConsensusProgressProps> = ({ progress, onDismiss }) => {
  if (progress.stage === 'idle') return null;

  const isPending = progress.stage === 'signing' || progress.stage === 'submitting' || progress.stage === 'consensus';
  const isSuccess = progress.stage === 'complete' || progress.stage === 'accepted';
  const isError = progress.stage === 'reverted' || progress.stage === 'disagreed' || progress.stage === 'timeout';

  const friendlyError = progress.error ? explainRevertReason(progress.error) : '';

  return (
    <div
      className={`rounded-xl border p-4 my-4 transition-all shadow-lg ${
        isSuccess
          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          : isError
          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          : 'bg-arena-card border-arena-primary/50 text-arena-text'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {isPending && <Loader2 className="w-5 h-5 text-arena-accent animate-spin shrink-0 mt-0.5" />}
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {isError && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}

          <div className="space-y-1">
            <div className="font-semibold text-sm flex items-center gap-2">
              {progress.stage === 'signing' && 'Signing with Throwaway Key...'}
              {progress.stage === 'submitting' && 'Broadcasting Transaction to Studionet...'}
              {progress.stage === 'consensus' && 'Validator Nodes Running Consensus...'}
              {isSuccess && 'Accepted by Validators (Consensus Reached)'}
              {progress.stage === 'disagreed' && 'Validator Majority Disagreement'}
              {progress.stage === 'timeout' && 'Validator Consensus Timed Out'}
              {progress.stage === 'reverted' && 'Execution Reverted by Contract Rules'}

              {progress.elapsedSec !== undefined && progress.elapsedSec > 0 && (
                <span className="text-xs font-mono font-normal opacity-75 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {progress.elapsedSec}s
                </span>
              )}
            </div>

            <p className="text-xs opacity-90 leading-relaxed">
              {progress.stage === 'signing' && 'Preparing cryptographic payload for GenLayer execution environment.'}
              {progress.stage === 'submitting' && 'Sending RPC write call to studio.genlayer.com/api.'}
              {progress.stage === 'consensus' &&
                'Validators independently sample model responses and execute the deterministic predicate to establish quorum.'}
              {isSuccess && 'Consensus completed successfully. State updated on GenLayer Studionet (Preview).'}
              {progress.stage === 'reverted' && friendlyError}
            </p>

            {/* Voting Details */}
            {progress.votes && progress.votes.total > 0 && (
              <div className="mt-2 text-xs font-mono flex items-center gap-2 bg-black/30 px-2.5 py-1 rounded w-fit">
                <span>Validator Votes:</span>
                <span className="font-bold text-white">
                  {progress.votes.agree}/{progress.votes.total} Agree
                </span>
                {progress.statusName && (
                  <span className="text-arena-muted">[{progress.statusName}]</span>
                )}
              </div>
            )}

            {/* Tx Explorer Link */}
            {progress.txHash && (
              <div className="pt-1">
                <a
                  href={getExplorerTxUrl(progress.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-arena-accent hover:underline inline-flex items-center gap-1"
                >
                  Tx: {progress.txHash.slice(0, 10)}...{progress.txHash.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs opacity-60 hover:opacity-100 p-1 rounded"
            aria-label="Dismiss progress notification"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
};
