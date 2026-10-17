import React, { useState, useEffect } from 'react';
import { getAllGuards, type GuardRecord } from '../services/contractService';
import { GuardCard } from '../components/GuardCard';
import { Link } from 'react-router-dom';
import { Shield, Search, Filter, PlusCircle, Loader2, RefreshCw } from 'lucide-react';

export const ArenaPage: React.FC = () => {
  const [guards, setGuards] = useState<GuardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BREACHED'>('ALL');
  const [sortBy, setSortBy] = useState<'robustness' | 'attempts' | 'newest'>('robustness');

  const loadData = async () => {
    setLoading(true);
    try {
      const records = await getAllGuards();
      setGuards(records);
    } catch (err) {
      console.error('Failed to load arena guards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter & Sort
  const filteredGuards = guards
    .filter((g) => {
      if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.guard_id.toLowerCase().includes(q) ||
          g.policy.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'robustness') {
        const robA = a.attempts_total > 0 ? a.held_total / a.attempts_total : 1;
        const robB = b.attempts_total > 0 ? b.held_total / b.attempts_total : 1;
        return robB - robA;
      }
      if (sortBy === 'attempts') {
        return b.attempts_total - a.attempts_total;
      }
      return b.created_ts - a.created_ts;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-arena-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-arena-accent" />
            <span>Robustness Arena</span>
          </h1>
          <p className="text-sm text-arena-muted mt-1">
            Active and tested defense guards on GenLayer Studionet (Preview).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg bg-arena-card border border-arena-border hover:bg-arena-border text-arena-muted hover:text-white transition-colors"
            title="Refresh Guard List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/register"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-arena-primary hover:bg-arena-primaryHover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Deploy Guard</span>
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-arena-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, ID, or policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-arena-card border border-arena-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-arena-muted focus:outline-none focus:border-arena-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-arena-card border border-arena-border rounded-lg px-3 py-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-arena-muted" />
          <span className="text-arena-muted">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-arena-card">All Statuses</option>
            <option value="ACTIVE" className="bg-arena-card">Active Only</option>
            <option value="BREACHED" className="bg-arena-card">Breached Only</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 bg-arena-card border border-arena-border rounded-lg px-3 py-1.5 text-xs">
          <span className="text-arena-muted">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="robustness" className="bg-arena-card">Highest Robustness</option>
            <option value="attempts" className="bg-arena-card">Most Attempts</option>
            <option value="newest" className="bg-arena-card">Newest First</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-arena-accent animate-spin mx-auto" />
          <p className="text-sm text-arena-muted font-mono">Loading guards from GuardArena contract...</p>
        </div>
      ) : filteredGuards.length === 0 ? (
        <div className="text-center py-16 bg-arena-card/40 border border-arena-border rounded-xl space-y-3">
          <Shield className="w-12 h-12 text-arena-muted mx-auto opacity-40" />
          <h3 className="text-lg font-bold text-white">No Guards Match Filter</h3>
          <p className="text-sm text-arena-muted max-w-sm mx-auto">
            Try adjusting your search query or status filter, or register a new guard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuards.map((g) => (
            <GuardCard key={g.guard_id} guard={g} />
          ))}
        </div>
      )}
    </div>
  );
};
