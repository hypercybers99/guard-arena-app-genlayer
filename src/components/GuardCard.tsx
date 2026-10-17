import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { GuardRecord } from '../services/contractService';
import { Shield, ShieldAlert, Swords, Eye, EyeOff, GitFork, ChevronRight } from 'lucide-react';

interface GuardCardProps {
  guard: GuardRecord;
}

export const GuardCard: React.FC<GuardCardProps> = ({ guard }) => {
  const [showToken, setShowToken] = useState(false);

  const isBreached = guard.status === 'BREACHED';

  // Calculate robustness percentage
  const total = guard.attempts_total;
  const held = guard.held_total;
  const robustness = total > 0 ? Math.round((held / total) * 100) : 100;

  return (
    <div className="bg-arena-card border border-arena-border hover:border-arena-primary/60 rounded-xl p-5 transition-all shadow-md flex flex-col justify-between">
      {/* Top Header: Name, Status Chip, Generation */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white hover:text-arena-accent transition-colors">
                {guard.name}
              </span>
              {guard.generation > 0 && (
                <span className="bg-arena-surface border border-arena-border text-arena-muted text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                  <GitFork className="w-3 h-3 text-arena-accent" />
                  Gen {guard.generation}
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-arena-muted">
              ID: <span className="text-arena-text">{guard.guard_id}</span>
            </div>
          </div>

          {/* Status Chip */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 ${
              isBreached
                ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
            }`}
          >
            {isBreached ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            {guard.status}
          </span>
        </div>

        {/* Policy Text (Shown in full per specification) */}
        <div className="bg-arena-surface/80 rounded-lg p-3 border border-arena-border/60 mb-4">
          <div className="text-[11px] font-medium text-arena-muted uppercase tracking-wider mb-1">
            Defender Policy
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
            {guard.policy}
          </p>
        </div>

        {/* Forbidden Token Toggle */}
        <div className="flex items-center justify-between text-xs mb-4 bg-black/20 px-3 py-2 rounded-lg border border-arena-border/40">
          <span className="text-arena-muted">Forbidden Secret Token:</span>
          <div className="flex items-center gap-2">
            {showToken ? (
              <span className="font-mono font-bold text-arena-accent bg-arena-primary/20 px-2 py-0.5 rounded border border-arena-primary/40">
                {guard.token}
              </span>
            ) : (
              <span className="font-mono text-arena-muted tracking-widest select-none">
                ********
              </span>
            )}
            <button
              onClick={() => setShowToken(!showToken)}
              className="text-arena-muted hover:text-white p-1 rounded transition-colors"
              title={showToken ? 'Hide token' : 'Reveal forbidden token'}
              aria-label={showToken ? 'Hide token' : 'Reveal forbidden token'}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Attempt Counters */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs py-2 border-y border-arena-border/50 mb-4">
          <div>
            <div className="text-arena-muted text-[10px] uppercase">Attempts</div>
            <div className="font-bold text-white mt-0.5">{guard.attempts_total}</div>
          </div>
          <div>
            <div className="text-emerald-400 text-[10px] uppercase">Held</div>
            <div className="font-bold text-emerald-300 mt-0.5">{guard.held_total}</div>
          </div>
          <div>
            <div className="text-amber-400 text-[10px] uppercase">Unconf.</div>
            <div className="font-bold text-amber-300 mt-0.5">{guard.unconfirmed_total}</div>
          </div>
          <div>
            <div className="text-rose-400 text-[10px] uppercase">Conf.</div>
            <div className="font-bold text-rose-300 mt-0.5">{guard.breached_confirmed_total}</div>
          </div>
          <div>
            <div className="text-purple-400 text-[10px] uppercase">Flaky</div>
            <div className="font-bold text-purple-300 mt-0.5">{guard.flaky_total}</div>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Link
          to={`/attack/${guard.guard_id}`}
          className="flex-1 bg-arena-primary hover:bg-arena-primaryHover text-white text-xs font-semibold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1.5 transition-colors"
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Launch Attack</span>
        </Link>
        <Link
          to={`/guard/${guard.guard_id}`}
          className="bg-arena-surface hover:bg-arena-border text-arena-text text-xs font-medium py-2 px-3 rounded-lg border border-arena-border flex items-center gap-1 transition-colors"
        >
          <span>Detail</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
