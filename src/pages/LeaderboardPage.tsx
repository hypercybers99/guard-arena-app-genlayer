import React, { useState, useEffect } from 'react';
import {
  getLeaderboard,
  getAllGuards,
  type LeaderboardEntry,
  type GuardRecord,
} from '../services/contractService';
import { Link } from 'react-router-dom';
import { Trophy, Shield, Swords, Award, Loader2, GitFork, ChevronRight } from 'lucide-react';

interface AttackerStats {
  address: string;
  confirmedBreaches: number;
  totalAttempts: number;
}

export const LeaderboardPage: React.FC = () => {
  const [topGuards, setTopGuards] = useState<LeaderboardEntry[]>([]);
  const [topAttackers, setTopAttackers] = useState<AttackerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [lb, allGuards] = await Promise.all([
          getLeaderboard(20),
          getAllGuards(),
        ]);
        setTopGuards(lb);

        // Aggregate attacker stats across all guards
        const attackerMap = new Map<string, { confirmed: number; total: number }>();
        for (const g of allGuards) {
          for (const att of g.attempts) {
            const addr = att.attacker ? att.attacker.toLowerCase() : 'unknown';
            const current = attackerMap.get(addr) || { confirmed: 0, total: 0 };
            current.total += 1;
            if (att.state === 'CONFIRMED') {
              current.confirmed += 1;
            }
            attackerMap.set(addr, current);
          }
        }

        const sortedAttackers: AttackerStats[] = Array.from(attackerMap.entries())
          .map(([address, stats]) => ({
            address,
            confirmedBreaches: stats.confirmed,
            totalAttempts: stats.total,
          }))
          .sort((a, b) => b.confirmedBreaches - a.confirmedBreaches || b.totalAttempts - a.totalAttempts);

        setTopAttackers(sortedAttackers);
      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="border-b border-arena-border pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" />
          <span>Arena Leaderboard</span>
        </h1>
        <p className="text-sm text-arena-muted mt-1">
          Top defense guards ranked by deterministic robustness score and top red-team attackers by confirmed breaches.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-arena-accent animate-spin mx-auto" />
          <p className="text-sm text-arena-muted font-mono">Aggregating on-chain leaderboard statistics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Guards Section */}
          <div className="bg-arena-card border border-arena-border rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-arena-border pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-arena-accent" />
                <span>Robust Defense Guards</span>
              </h2>
              <span className="text-xs text-arena-muted font-mono">Ranked by score</span>
            </div>

            {topGuards.length === 0 ? (
              <div className="text-center py-8 text-arena-muted text-sm font-mono">
                No eligible guards yet. (Requires at least 2 attempts to qualify).
              </div>
            ) : (
              <div className="space-y-3">
                {topGuards.map((g, idx) => (
                  <Link
                    key={g.guard_id}
                    to={`/guard/${g.guard_id}`}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-arena-surface hover:bg-arena-cardHover border border-arena-border transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : idx === 1
                            ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                            : idx === 2
                            ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                            : 'bg-arena-card text-arena-muted'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-arena-accent transition-colors flex items-center gap-2">
                          <span>{g.name}</span>
                          {g.generation > 0 && (
                            <span className="text-[10px] font-mono text-arena-muted flex items-center gap-0.5">
                              <GitFork className="w-3 h-3 text-arena-accent" />
                              Gen {g.generation}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-arena-muted">
                          ID: {g.guard_id} | Token: {g.token}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-emerald-400 font-mono">
                        {g.robustness_score}%
                      </div>
                      <div className="text-[11px] font-mono text-arena-muted">
                        {g.held_total}/{g.attempts_total} Held
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Attackers Section */}
          <div className="bg-arena-card border border-arena-border rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-arena-border pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-rose-400" />
                <span>Top Red-Team Attackers</span>
              </h2>
              <span className="text-xs text-arena-muted font-mono">Ranked by confirmed breaches</span>
            </div>

            {topAttackers.length === 0 ? (
              <div className="text-center py-8 text-arena-muted text-sm font-mono">
                No attacker attempts recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topAttackers.map((atk, idx) => (
                  <div
                    key={atk.address}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-arena-surface border border-arena-border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-arena-card text-arena-muted'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-mono text-sm text-white font-semibold">
                          {atk.address.slice(0, 10)}...{atk.address.slice(-6)}
                        </div>
                        <div className="text-xs text-arena-muted">
                          {atk.totalAttempts} total attempts executed
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-rose-400 font-mono">
                        {atk.confirmedBreaches} Confirmed
                      </div>
                      <div className="text-[11px] font-mono text-arena-muted">
                        Breaches
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
