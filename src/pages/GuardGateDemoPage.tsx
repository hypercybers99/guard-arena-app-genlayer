import React, { useState, useEffect } from 'react';
import {
  getAllGuards,
  askGuardGate,
  type GuardRecord,
  type GateReplyRecord,
  type TxProgressUpdate,
} from '../services/contractService';
import { useWallet } from '../context/WalletContext';
import { ConsensusProgress } from '../components/ConsensusProgress';
import { GUARD_GATE_ADDRESS } from '../config/contracts';
import { Cpu, ShieldCheck, Filter, Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export const GuardGateDemoPage: React.FC = () => {
  const { account } = useWallet();

  const [activeGuards, setActiveGuards] = useState<GuardRecord[]>([]);
  const [selectedGuardId, setSelectedGuardId] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [loadingGuards, setLoadingGuards] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [txProgress, setTxProgress] = useState<TxProgressUpdate>({ stage: 'idle' });
  const [lastReply, setLastReply] = useState<GateReplyRecord | null>(null);
  const [computedSha256, setComputedSha256] = useState<string | null>(null);

  useEffect(() => {
    if (lastReply?.reply !== undefined) {
      const enc = new TextEncoder();
      const data = enc.encode(lastReply.reply);
      window.crypto.subtle.digest('SHA-256', data).then((buf) => {
        const hash = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        setComputedSha256(hash);
      });
    } else {
      setComputedSha256(null);
    }
  }, [lastReply]);

  useEffect(() => {
    async function loadGuards() {
      try {
        const all = await getAllGuards();
        const active = all.filter((g) => g.status === 'ACTIVE');
        setActiveGuards(active);
        if (active.length > 0) {
          setSelectedGuardId(active[0].guard_id);
        }
      } catch (err) {
        console.error('Failed to load active guards:', err);
      } finally {
        setLoadingGuards(false);
      }
    }
    loadGuards();
  }, []);

  const selectedGuard = activeGuards.find((g) => g.guard_id === selectedGuardId);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedGuardId || !userMessage.trim() || submitting) return;

    setSubmitting(true);
    setTxProgress({ stage: 'signing' });
    setLastReply(null);

    try {
      const res = await askGuardGate(
        account,
        selectedGuardId,
        userMessage.trim(),
        (update) => {
          setTxProgress(update);
        }
      );

      if (res.success && res.replyRecord) {
        setLastReply(res.replyRecord);
      }
    } catch (err) {
      console.error('GuardGate call failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-arena-border pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Cpu className="w-8 h-8 text-arena-accent" />
          <span>GuardGate Consumer Demo</span>
        </h1>
        <p className="text-sm text-arena-muted mt-1">
          Interactive demo showing cross-contract reuse of active arena policies with deterministic output filtering.
        </p>
      </div>

      {/* Explanation Banner */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-5 space-y-2 text-xs text-slate-300 leading-relaxed shadow-sm">
        <div className="font-semibold text-white flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-arena-accent" />
          <span>Cross-Contract Guard Protection</span>
        </div>
        <p>
          <span className="font-mono text-arena-accent">GuardGate ({GUARD_GATE_ADDRESS.slice(0, 8)}...)</span> acts as a consumer application. When you call <span className="font-mono text-white">ask(guard_id, message)</span>, it queries the active policy from <span className="font-mono text-white">GuardArena</span>, executes the assistant under consensus, and applies a deterministic output filter that automatically blocks the forbidden token with <span className="font-mono text-rose-300">[blocked by output filter]</span> if leaked.
        </p>
      </div>

      <form onSubmit={handleAsk} className="bg-arena-card border border-arena-border rounded-xl p-6 space-y-6 shadow-md">
        {/* Guard Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-arena-muted">
            Select Active Guard to Consult
          </label>
          {loadingGuards ? (
            <div className="flex items-center gap-2 text-xs text-arena-muted">
              <Loader2 className="w-4 h-4 animate-spin text-arena-accent" />
              <span>Loading active guards...</span>
            </div>
          ) : activeGuards.length === 0 ? (
            <div className="text-xs text-rose-400 bg-rose-950/20 p-3 rounded-lg border border-rose-900/40">
              No active guards available. Register a guard first.
            </div>
          ) : (
            <select
              value={selectedGuardId}
              onChange={(e) => setSelectedGuardId(e.target.value)}
              disabled={submitting}
              className="w-full bg-arena-surface border border-arena-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-arena-primary font-mono cursor-pointer"
            >
              {activeGuards.map((g) => (
                <option key={g.guard_id} value={g.guard_id} className="bg-arena-card">
                  {g.name} ({g.guard_id}) - Token: {g.token}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Guard Details */}
        {selectedGuard && (
          <div className="bg-arena-surface/80 rounded-lg p-3.5 border border-arena-border text-xs space-y-1 font-mono">
            <div className="text-arena-muted uppercase text-[10px]">Active Policy:</div>
            <p className="text-slate-200">{selectedGuard.policy}</p>
          </div>
        )}

        {/* Query Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-arena-muted">
            Your Question / Prompt
          </label>
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value.slice(0, 300))}
            placeholder="Ask anything, or attempt to trick the guard..."
            rows={3}
            disabled={submitting}
            className="w-full bg-arena-surface border border-arena-border rounded-lg p-3 text-sm text-white placeholder-arena-muted focus:outline-none focus:border-arena-primary font-mono resize-none"
            required
          />
        </div>

        {/* Real-time Consensus Progress */}
        {txProgress.stage !== 'idle' && (
          <ConsensusProgress
            progress={txProgress}
            onDismiss={() => setTxProgress({ stage: 'idle' })}
          />
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !userMessage.trim() || activeGuards.length === 0}
          className="w-full bg-arena-primary hover:bg-arena-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Querying Guard Through GuardGate...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Ask Guard (via GuardGate)</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-arena-muted">
          Studionet-only throwaway key. Preview network, no real value.
        </p>
      </form>

      {/* Response Card */}
      {lastReply && (
        <div className="bg-arena-card border border-arena-border rounded-xl p-6 space-y-4 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-arena-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-arena-accent" />
              <span className="font-bold text-white text-sm">GuardGate Filter Response</span>
            </div>
            {/* Filter Status Badge */}
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full ${
                lastReply.filtered
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
              }`}
            >
              {lastReply.filtered ? 'Output Filter: REDACTED' : 'Output Filter: CLEAN'}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs uppercase font-mono text-arena-muted">Assistant Reply:</span>
            <div className="bg-arena-surface p-4 rounded-lg border border-arena-border font-mono text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
              {lastReply.reply}
            </div>
          </div>

          {/* Consensus Derived Integrity Fields */}
          <div className="bg-arena-surface/80 rounded-lg p-3.5 border border-arena-border/60 text-xs font-mono space-y-2">
            <div className="text-arena-muted uppercase text-[10px] font-semibold tracking-wider">Consensus Derived Integrity</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-arena-muted">Filtered flag: </span>
                <span className={lastReply.filtered ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {lastReply.filtered ? 'true' : 'false'}
                </span>
              </div>
              <div>
                <span className="text-arena-muted">Stored verdict: </span>
                <span className="text-white font-bold">{lastReply.verdict}</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] pt-1 border-t border-arena-border/40">
              <div className="text-arena-muted truncate">
                <span>Stored SHA-256: </span>
                <span className="text-slate-300 select-all">{lastReply.reply_sha256 || 'N/A'}</span>
              </div>
              <div className="text-arena-muted truncate">
                <span>Local SHA-256: </span>
                <span className="text-slate-300 select-all">{computedSha256 || 'computing...'}</span>
              </div>
              <div className="pt-1">
                <span>Hash matches stored reply: </span>
                {lastReply.reply_sha256 && computedSha256 ? (
                  lastReply.reply_sha256 === computedSha256 ? (
                    <span className="text-emerald-400 font-bold">yes</span>
                  ) : (
                    <span className="text-rose-400 font-bold">no</span>
                  )
                ) : (
                  <span className="text-arena-muted">checking...</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-arena-muted flex items-center justify-between pt-1">
            <span>Verdict: <span className="text-white font-bold">{lastReply.verdict}</span></span>
            <span>Request ID: {lastReply.request_id || lastReply.reply_id || 'N/A'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
