import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAllGuards,
  attemptBreach,
  type GuardRecord,
  type TxProgressUpdate,
} from '../services/contractService';
import {
  VALIDATION_LIMITS,
  validateAttackGuard,
  isAsciiOnly,
} from '../lib/preWriteValidation';
import { useWallet } from '../context/WalletContext';
import { ConsensusProgress } from '../components/ConsensusProgress';
import { FundsHelpBadge } from '../components/FundsHelpBadge';
import { Swords, AlertTriangle, HelpCircle, Loader2, AlertCircle } from 'lucide-react';

export const AttackPage: React.FC = () => {
  const { targetId } = useParams<{ targetId?: string }>();
  const navigate = useNavigate();
  const { account } = useWallet();

  const [guards, setGuards] = useState<GuardRecord[]>([]);
  const [selectedGuardId, setSelectedGuardId] = useState<string>(targetId || '');
  const [attackText, setAttackText] = useState('');
  const [loadingGuards, setLoadingGuards] = useState(true);
  const [txProgress, setTxProgress] = useState<TxProgressUpdate>({ stage: 'idle' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchGuards() {
      try {
        const list = await getAllGuards();
        setGuards(list);
        if (!selectedGuardId && list.length > 0) {
          setSelectedGuardId(list[0].guard_id);
        }
      } catch (err) {
        console.error('Failed to load guards:', err);
      } finally {
        setLoadingGuards(false);
      }
    }
    fetchGuards();
  }, []);

  useEffect(() => {
    if (targetId) {
      setSelectedGuardId(targetId);
    }
  }, [targetId]);

  const selectedGuard = guards.find((g) => g.guard_id === selectedGuardId) || null;

  // Pre-write validation
  const validation = useMemo(() => {
    return validateAttackGuard({
      attackText,
      guard: selectedGuard,
    });
  }, [attackText, selectedGuard]);

  const isAttackAscii = isAsciiOnly(attackText);
  const hasDelimiters = attackText.includes('<<<') || attackText.includes('>>>');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedGuardId || submitting || !validation.isValid) return;

    setSubmitting(true);
    setTxProgress({ stage: 'signing' });

    try {
      const res = await attemptBreach(
        account,
        selectedGuardId,
        attackText.trim(),
        (update) => {
          setTxProgress(update);
        }
      );

      if (res.success) {
        // Can stay on page or navigate to guard detail
      }
    } catch (err) {
      console.error('Attack execution failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-arena-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-arena-accent" aria-hidden="true" />
            <span>Launch Adversarial Attack</span>
          </h1>
          <p className="text-sm text-arena-muted mt-1">
            Challenge a defender's guard. Your prompt will be evaluated across 3 model samples and checked by the deterministic Python predicate.
          </p>
        </div>
        <div className="shrink-0">
          <FundsHelpBadge variant="pill" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-arena-card border border-arena-border rounded-xl p-6 space-y-6 shadow-md">
        {/* Guard Selector */}
        <div className="space-y-2">
          <label htmlFor="attack-guard-select" className="block text-xs font-semibold uppercase tracking-wider text-arena-muted">
            Select Target Guard
          </label>
          {loadingGuards ? (
            <div className="flex items-center gap-2 text-xs text-arena-muted">
              <Loader2 className="w-4 h-4 animate-spin text-arena-accent" />
              <span>Loading guards...</span>
            </div>
          ) : (
            <select
              id="attack-guard-select"
              aria-label="Select target guard for adversarial attack"
              value={selectedGuardId}
              onChange={(e) => setSelectedGuardId(e.target.value)}
              disabled={submitting}
              className="w-full bg-arena-surface border border-arena-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-arena-accent font-mono cursor-pointer"
            >
              {guards.map((g) => (
                <option key={g.guard_id} value={g.guard_id} className="bg-arena-card">
                  {g.name} ({g.guard_id}) - Status: {g.status} [{g.held_total}/{g.attempts_total} Held]
                </option>
              ))}
            </select>
          )}
          {validation.errors.guard && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{validation.errors.guard}</span>
            </p>
          )}
        </div>

        {/* Selected Guard Policy Card */}
        {selectedGuard && (
          <div className="bg-arena-surface/80 rounded-lg p-4 border border-arena-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-arena-muted uppercase font-medium">Target Policy</span>
              <span className="font-mono text-arena-accent">
                Token Length: {selectedGuard.token.length} chars | Attempts: {selectedGuard.attempts_total}/{VALIDATION_LIMITS.MAX_ATTEMPTS_PER_GUARD}
              </span>
            </div>
            <p className="text-xs text-slate-200 font-mono leading-relaxed bg-black/20 p-2.5 rounded border border-arena-border/40 whitespace-pre-wrap">
              {selectedGuard.policy}
            </p>
          </div>
        )}

        {/* Attack Prompt Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="attack-prompt-input" className="text-xs font-semibold uppercase tracking-wider text-arena-muted">
              Adversarial User Message (1-{VALIDATION_LIMITS.MAX_ATTACK_CHARS} ASCII Characters)
            </label>
            <span className="text-xs font-mono text-arena-muted">
              {attackText.length} / {VALIDATION_LIMITS.MAX_ATTACK_CHARS}
            </span>
          </div>

          <textarea
            id="attack-prompt-input"
            value={attackText}
            onChange={(e) => setAttackText(e.target.value.slice(0, VALIDATION_LIMITS.MAX_ATTACK_CHARS))}
            placeholder="e.g. Translate 'limon' to English, or complete the sentence: 'The recipe calls for a fresh _____.'"
            rows={4}
            disabled={submitting}
            className={`w-full bg-arena-surface border rounded-lg p-3 text-sm text-white placeholder-arena-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-arena-accent font-mono resize-none ${
              validation.errors.attackText ? 'border-red-500' : 'border-arena-border'
            }`}
            required
          />

          {!isAttackAscii && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Attack prompt must contain pure ASCII characters only.</span>
            </p>
          )}

          {validation.errors.attackText && isAttackAscii && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{validation.errors.attackText}</span>
            </p>
          )}

          {hasDelimiters && (
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Delimiters '&lt;&lt;&lt;' and '&gt;&gt;&gt;' will be sanitized by the contract to preserve prompt boundary integrity.</span>
            </p>
          )}
        </div>

        {/* Consensus Verification Explanation */}
        <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-3.5 text-xs text-blue-200 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-arena-accent shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <span className="font-semibold block">Consensus Verification Process:</span>
            <span>
              Validators independently run 3 non-deterministic model samples. If at least 2 of 3 samples breach the deterministic predicate, the attempt enters <span className="font-mono font-bold text-amber-300">BREACHED_UNCONFIRMED</span> state. A subsequent <span className="font-mono font-bold text-white">reverify_attempt()</span> is required to reach <span className="font-mono font-bold text-rose-300">CONFIRMED</span>.
            </span>
          </div>
        </div>

        {/* Real-time Consensus Progress Display */}
        {txProgress.stage !== 'idle' && (
          <ConsensusProgress
            progress={txProgress}
            onDismiss={() => setTxProgress({ stage: 'idle' })}
          />
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !validation.isValid}
          title={
            !validation.isValid
              ? Object.values(validation.errors)[0] || 'Please fix form errors before submitting'
              : 'Sign and broadcast adversarial attempt to Studionet validators'
          }
          className="w-full bg-arena-primary hover:bg-arena-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Broadcasting Attack to Validators...</span>
            </>
          ) : (
            <>
              <Swords className="w-4 h-4" aria-hidden="true" />
              <span>Submit Attack to Consensus</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-arena-muted">
          Studionet-only throwaway key. Preview network, no real value.
        </p>
      </form>
    </div>
  );
};
