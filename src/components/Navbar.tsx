import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { useWallet } from '../context/WalletContext';
import { useUI } from '../context/UIContext';
import {
  Shield,
  Swords,
  PlusCircle,
  Trophy,
  Cpu,
  FileCheck2,
  Wallet,
  Menu,
  X,
  Compass,
  Coins,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { address } = useWallet();
  const { openTour, openFundsGuide } = useUI();

  const navLinks = [
    { to: '/arena', label: 'Arena', icon: Shield },
    { to: '/register', label: 'Register Guard', icon: PlusCircle },
    { to: '/attack', label: 'Attack', icon: Swords },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/gate', label: 'GuardGate Demo', icon: Cpu },
    { to: '/evidence', label: 'Evidence', icon: FileCheck2 },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'No Wallet';

  return (
    <nav className="sticky top-0 z-20 bg-arena-bg border-b border-arena-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-arena-accent rounded-lg p-1 focus:outline-none"
          >
            <Logo size={34} />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-arena-accent transition-colors">
                BreakTheGuard
              </span>
              <span className="text-[10px] tracking-wider uppercase text-arena-muted font-mono font-medium -mt-1">
                Adversarial Robustness Arena
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none ${
                    active
                      ? 'bg-arena-primary/20 text-arena-accent border border-arena-primary/40'
                      : 'text-arena-muted hover:text-white hover:bg-arena-card'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action: Tour, Funds Guide, & Wallet */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              type="button"
              onClick={openTour}
              className="flex items-center gap-1.5 text-xs font-medium text-arena-muted hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-arena-card transition-colors focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
              title="Interactive Platform Tour"
            >
              <Compass className="w-4 h-4 text-arena-accent" />
              <span>Tour</span>
            </button>

            <button
              type="button"
              onClick={openFundsGuide}
              className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg text-xs font-mono text-emerald-400 transition-all focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
              title="Zero-Balance Execution Guide"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>0 GEN Ready</span>
            </button>

            <Link
              to="/wallet"
              className="flex items-center gap-2 bg-arena-surface border border-arena-border hover:border-arena-primary/60 px-3 py-1.5 rounded-lg text-xs font-mono text-arena-text transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
              title="Manage Throwaway Key"
            >
              <Wallet className="w-3.5 h-3.5 text-arena-accent" />
              <span>{shortAddress}</span>
            </Link>
          </div>

          {/* Mobile Actions & Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={openTour}
              aria-label="Open Interactive Tour"
              className="p-1.5 rounded-md text-arena-muted hover:text-white hover:bg-arena-surface focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
            >
              <Compass className="w-4 h-4 text-arena-accent" />
            </button>
            <Link
              to="/wallet"
              className="flex items-center gap-1 bg-arena-surface border border-arena-border px-2.5 py-1 rounded-md text-xs font-mono text-arena-text focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
            >
              <Wallet className="w-3.5 h-3.5 text-arena-accent" />
              <span>{address ? `${address.slice(0, 4)}..` : 'Key'}</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-arena-muted hover:text-white hover:bg-arena-surface focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-arena-border bg-arena-surface px-4 pt-2 pb-4 space-y-1 animate-fade-in">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none ${
                  active
                    ? 'bg-arena-primary/20 text-arena-accent font-semibold'
                    : 'text-arena-muted hover:text-white hover:bg-arena-card'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-arena-border/50 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openTour();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-arena-muted hover:text-white"
            >
              <Compass className="w-5 h-5 text-arena-accent shrink-0" />
              <span>Take the Platform Tour</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openFundsGuide();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-emerald-400 hover:text-emerald-300"
            >
              <Coins className="w-5 h-5 shrink-0" />
              <span>Zero-Balance Gas Guide (0 GEN)</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
