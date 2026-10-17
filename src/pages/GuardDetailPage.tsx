import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getGuard,
  getLineage,
  reverifyAttempt,
  type GuardRecord,
  type TxProgressUpdate,
} from '../services/contractService';
import { useWallet } from '../context/WalletContext';
import { ConsensusProgress } from '../components/ConsensusProgress';
import { getExplorerTxUrl } from '../config/contracts';
import {
  Shield,
  ShieldAlert,
  Swords,
  GitFork,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const GuardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { account } = useWallet();

  const [guard, setGuard] = useState<GuardRecord | null>(null);
  const [lineage, setLineage] = useState<{ ancestors: string[]; descendants: string[] }>({
    ancestors: [],
    descendants: [],
  });
  const [loading, setLoading] = useState(true);
  const [reverifyProgress, setReverifyProgress] = useState<TxProgressUpdate>({ stage: 'idle' });
  const [reverifyingAttemptN, setReverifyingAttemptN] = useState<number | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const g = await getGuard(id);
      setGuard(g);
      if (g) {
        const lin = await getLineage(id);
        setLineage(lin);
      }
    } catch (err) {
      console.error('Failed to load guard detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleReverify = async (attemptN: number) => {
    if (!guard || !account) return;
    setReverifyingAttemptN(attemptN);
    try {
      const res = await reverifyAttempt(account, guard.guard_id, attemptN, (u) => {
        setReverifyProgress(u);
      });
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Re-verify failed:', err);
    } finally {
      setReverifyingAttemptN(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-arena-accent animate-spin mx-auto" />
        <p className="text-sm text-arena-muted font-mono">Fetching guard state from contract...</p>
      </div>
    );
  }

  if (!guard) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Guard Not Found</h2>
        <p className="text-sm text-arena-muted">Guard ID "{id}" does not exist in GuardArena.</p>
        <Link to="/arena" className="text-arena-accent hover:underline text-sm inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          Back to Arena
        </Link>
      </div>
    );
  }

  const isBreached = guard.status === 'BREACHED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/arena"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-arena-muted hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Arena</span>
        </Link>
      </div>

      {/* Main Guard Header Card */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{guard.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  isBreached
                    ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                    : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                }`}
              >
                {isBreached ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                {guard.status}
              </span>
            </div>
            <div className="text-xs font-mono text-arena-muted mt-1 space-x-3">
              <span>ID: <span className="text-arena-text">{guard.guard_id}</span></span>
              <span>|</span>
              <span>Defender: <span className="text-arena-text">{guard.defender.slice(0, 8)}...{guard.defender.slice(-6)}</span></span>
              <span>|</span>
              <span>Created: <span className="text-arena-text">{guard.created_at || new Date(guard.created_ts * 1000).toISOString()}</span></span>
            </div>
          </div>

          <Link
            to={`/attack/${guard.guard_id}`}
            className="inline-flex items-center justify-center gap-2 bg-arena-primary hover:bg-arena-primaryHover text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md shrink-0"
          >
            <Swords className="w-4 h-4" />
            <span>Launch Attack</span>
          </Link>
        </div>

        {/* Policy Section */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-arena-muted">
            Defender Policy
          </div>
          <div className="bg-arena-surface rounded-lg p-4 border border-arena-border font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {guard.policy}
          </div>
        </div>

        {/* Secret Token & Probes Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-arena-surface/80 rounded-lg p-3 border border-arena-border">
            <span className="text-arena-muted block mb-1">Forbidden Token:</span>
            <span className="font-bold text-arena-accent text-sm bg-arena-primary/20 px-2 py-0.5 rounded border border-arena-primary/40 inline-block">
              {guard.token}
            </span>
          </div>
          <div className="bg-arena-surface/80 rounded-lg p-3 border border-arena-border">
            <span className="text-arena-muted block mb-1">Registration Probes Outcome:</span>
            <span className="text-emerald-400 font-semibold">
              Naive: [{guard.registration_probes?.naive?.join(', ') || 'HELD, HELD, HELD'}]
            </span>
            <span className="text-blue-300 ml-2">
              Utility: [{guard.registration_probes?.utility?.join(', ') || 'PASS, PASS'}]
            </span>
          </div>
        </div>

        {/* Counter Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-arena-surface p-3 rounded-lg border border-arena-border text-center">
            <div className="text-arena-muted text-[10px] uppercase">Total Attempts</div>
            <div className="text-lg font-bold text-white mt-1">{guard.attempts_total}</div>
          </div>
          <div className="bg-arena-surface p-3 rounded-lg border border-arena-border text-center">
            <div className="text-emerald-400 text-[10px] uppercase">Held</div>
            <div className="text-lg font-bold text-emerald-300 mt-1">{guard.held_total}</div>
          </div>
          <div className="bg-arena-surface p-3 rounded-lg border border-arena-border text-center">
            <div className="text-amber-400 text-[10px] uppercase">Unconfirmed</div>
            <div className="text-lg font-bold text-amber-300 mt-1">{guard.unconfirmed_total}</div>
          </div>
          <div className="bg-arena-surface p-3 rounded-lg border border-arena-border text-center">
            <div className="text-rose-400 text-[10px] uppercase">Confirmed</div>
            <div className="text-lg font-bold text-rose-300 mt-1">{guard.breached_confirmed_total}</div>
          </div>
          <div className="bg-arena-surface p-3 rounded-lg border border-arena-border text-center col-span-2 sm:col-span-1">
            <div className="text-purple-400 text-[10px] uppercase">Flaky</div>
            <div className="text-lg font-bold text-purple-300 mt-1">{guard.flaky_total}</div>
          </div>
        </div>
      </div>

      {/* Lineage Tree Section (parent -> this -> children) */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <GitFork className="w-5 h-5 text-arena-accent" />
          <span>Guard Lineage & Provenance</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-3 text-xs font-mono">
          {/* Parent */}
          {guard.parent_guard_id ? (
            <Link
              to={`/guard/${guard.parent_guard_id}`}
              className="bg-arena-surface hover:bg-arena-border border border-arena-border p-3 rounded-lg text-center w-full sm:w-auto min-w-[140px] text-arena-accent hover:underline"
            >
              <div className="text-arena-muted text-[10px] uppercase">Parent Guard</div>
              <div className="font-bold">{guard.parent_guard_id}</div>
            </Link>
          ) : (
            <div className="bg-arena-surface/40 border border-dashed border-arena-border p-3 rounded-lg text-center w-full sm:w-auto min-w-[140px] text-arena-muted">
              <div className="text-[10px] uppercase">Parent Guard</div>
              <div>Root (None)</div>
            </div>
          )}

          <ArrowRight className="w-4 h-4 text-arena-muted rotate-90 sm:rotate-0 shrink-0" />

          {/* Current Guard */}
          <div className="bg-arena-primary/20 border-2 border-arena-primary p-3 rounded-lg text-center w-full sm:w-auto min-w-[140px] text-white">
            <div className="text-arena-accent text-[10px] uppercase font-bold">Current Guard (Gen {guard.generation})</div>
            <div className="font-extrabold">{guard.guard_id}</div>
          </div>

          <ArrowRight className="w-4 h-4 text-arena-muted rotate-90 sm:rotate-0 shrink-0" />

          {/* Children */}
          {lineage.descendants && lineage.descendants.length > 0 ? (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {lineage.descendants.map((childId) => (
                <Link
                  key={childId}
                  to={`/guard/${childId}`}
                  className="bg-arena-surface hover:bg-arena-border border border-arena-border p-3 rounded-lg text-center min-w-[140px] text-emerald-400 hover:underline"
                >
                  <div className="text-arena-muted text-[10px] uppercase">Child Guard</div>
                  <div className="font-bold">{childId}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-arena-surface/40 border border-dashed border-arena-border p-3 rounded-lg text-center w-full sm:w-auto min-w-[140px] text-arena-muted">
              <div className="text-[10px] uppercase">Child Guards</div>
              <div>{isBreached ? 'Eligible for Child registration' : 'None yet'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Reverify Progress Callout */}
      {reverifyProgress.stage !== 'idle' && (
        <ConsensusProgress
          progress={reverifyProgress}
          onDismiss={() => setReverifyProgress({ stage: 'idle' })}
        />
      )}

      {/* Attempt History Table */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-arena-accent" />
            <span>Adversarial Attempt History</span>
          </h2>
          <span className="text-xs text-arena-muted font-mono">
            {guard.attempts.length} / 40 attempts recorded
          </span>
        </div>

        {guard.attempts.length === 0 ? (
          <div className="text-center py-10 text-arena-muted text-sm bg-arena-surface/50 rounded-lg border border-dashed border-arena-border">
            No adversarial attacks attempted on this guard yet.
          </div>
        ) : (
          <div className="space-y-4">
            {guard.attempts.map((att) => {
              const isUnconfirmed = att.state === 'BREACHED_UNCONFIRMED';
              const isConfirmed = att.state === 'CONFIRMED';
              const isFlaky = att.state === 'FLAKY';

              return (
                <div
                  key={att.n}
                  className={`p-4 rounded-xl border transition-all ${
                    isUnconfirmed
                      ? 'bg-amber-950/20 border-amber-500/50'
                      : isConfirmed
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isFlaky
                      ? 'bg-purple-950/20 border-purple-500/40'
                      : 'bg-arena-surface border-arena-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-arena-border/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">#{att.n}</span>
                      <span className="text-xs font-mono text-arena-muted">
                        by {att.attacker ? `${att.attacker.slice(0, 6)}...${att.attacker.slice(-4)}` : 'Attacker'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* State Chip */}
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          isUnconfirmed
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : isConfirmed
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : isFlaky
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {att.state}
                      </span>

                      <span className="text-xs font-mono text-arena-muted">
                        ({att.samples_breached}/3 samples breached)
                      </span>
                    </div>
                  </div>

                  {/* Attack Prompt */}
                  <div className="py-2 text-xs">
                    <span className="text-arena-muted uppercase font-medium text-[10px] block mb-0.5">
                      Attack Prompt:
                    </span>
                    <p className="text-slate-200 font-mono bg-black/30 p-2.5 rounded border border-arena-border/40 whitespace-pre-wrap">
                      {att.attack_text_excerpt}
                    </p>
                  </div>

                  {/* Excerpt if breached */}
                  {att.excerpt && (
                    <div className="pb-2 text-xs">
                      <span className="text-rose-400 uppercase font-medium text-[10px] block mb-0.5">
                        Predicate Match Excerpt:
                      </span>
                      <p className="text-rose-200 font-mono bg-rose-950/40 p-2 rounded border border-rose-900/60">
                        "{att.excerpt}"
                      </p>
                    </div>
                  )}

                  {/* Reverify Action Button (Big Callout for BREACHED_UNCONFIRMED) */}
                  {isUnconfirmed && (
                    <div className="mt-3 pt-3 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-amber-200">
                        This breach is unconfirmed. A second consensus verification round is required to confirm the breach or mark it FLAKY.
                      </div>
                      <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                        <button
                          onClick={() => handleReverify(att.n)}
                          disabled={reverifyingAttemptN === att.n}
                          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20 shrink-0"
                        >
                          {reverifyingAttemptN === att.n ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Re-verifying in Consensus...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Re-verify This Breach</span>
                            </>
                          )}
                        </button>
                        <span className="text-[10px] text-arena-muted text-center sm:text-right block">
                          Studionet-only throwaway key. Preview network, no real value.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Re-verify Tx link if already reverified */}
                  {att.reverify_tx && (
                    <div className="pt-2 text-[11px] font-mono text-arena-muted flex items-center gap-1">
                      <span>Re-verification Tx:</span>
                      <a
                        href={getExplorerTxUrl(att.reverify_tx)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-arena-accent hover:underline inline-flex items-center gap-1"
                      >
                        {att.reverify_tx.slice(0, 10)}...{att.reverify_tx.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
