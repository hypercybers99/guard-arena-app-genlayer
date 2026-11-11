import React from 'react';
import {
  GUARD_ARENA_ADDRESS,
  GUARD_GATE_ADDRESS,
  CHAIN_ID,
  CONTRACT_REPO_URL,
  APP_REPO_URL,
  getExplorerAddressUrl,
} from '../config/contracts';
import { useUI } from '../context/UIContext';
import { ExternalLink, ShieldCheck, Code, Github, Compass, Coins } from 'lucide-react';

export const Footer: React.FC = () => {
  const { openTour, openFundsGuide } = useUI();

  return (
    <footer className="bg-arena-surface border-t border-arena-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          {/* Column 1: Network & Architecture */}
          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-arena-accent" />
              <span>Consensus Architecture</span>
            </div>
            <p className="text-arena-muted text-xs leading-relaxed">
              BreakTheGuard deploys deterministic consensus predicates with majority-of-samples verification. Deployed on <span className="text-white font-medium">GenLayer Studionet (Preview)</span> (Chain ID: {CHAIN_ID}).
            </p>
          </div>

          {/* Column 2: Contracts on Studionet */}
          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-2">
              <Code className="w-4 h-4 text-arena-accent" />
              <span>Active Contracts</span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <div>
                <span className="text-arena-muted">GuardArena: </span>
                <a
                  href={getExplorerAddressUrl(GUARD_ARENA_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-arena-accent hover:underline inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-arena-accent rounded focus:outline-none"
                >
                  {GUARD_ARENA_ADDRESS.slice(0, 8)}...{GUARD_ARENA_ADDRESS.slice(-6)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <span className="text-arena-muted">GuardGate: </span>
                <a
                  href={getExplorerAddressUrl(GUARD_GATE_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-arena-accent hover:underline inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-arena-accent rounded focus:outline-none"
                >
                  {GUARD_GATE_ADDRESS.slice(0, 8)}...{GUARD_GATE_ADDRESS.slice(-6)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Platform Help & Onboarding */}
          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-2">
              <Compass className="w-4 h-4 text-arena-accent" />
              <span>Platform Guides</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <button
                  type="button"
                  onClick={openTour}
                  className="text-arena-muted hover:text-white inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-arena-accent rounded focus:outline-none"
                >
                  <Compass className="w-3.5 h-3.5 text-arena-accent" />
                  <span>Take the Guided Tour</span>
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={openFundsGuide}
                  className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-arena-accent rounded focus:outline-none"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Zero-Balance Gas Guide (0 GEN)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 4: Repositories */}
          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-2">
              <Github className="w-4 h-4 text-arena-accent" />
              <span>Open Source Reference</span>
            </div>
            <div className="space-y-1 text-xs">
              <div>
                <a
                  href={CONTRACT_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-arena-muted hover:text-white inline-flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-arena-accent rounded focus:outline-none"
                >
                  Contract Repo (guard-arena-genlayer)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <a
                  href={APP_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-arena-muted hover:text-white inline-flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-arena-accent rounded focus:outline-none"
                >
                  dApp Repo (guard-arena-app-genlayer)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-arena-border/50 flex flex-col sm:flex-row items-center justify-between text-xs text-arena-muted gap-2">
          <span>GenLayer Studionet (Preview) - Chain ID 61999</span>
          <span className="text-center sm:text-right">
            Deterministic Python Predicate Oracle - No LLM-as-a-Judge
          </span>
        </div>
      </div>
    </footer>
  );
};
