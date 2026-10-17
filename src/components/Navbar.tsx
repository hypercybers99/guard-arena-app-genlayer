import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { useWallet } from '../context/WalletContext';
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
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { address } = useWallet();

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
    <nav className="sticky top-0 z-50 bg-arena-bg/95 backdrop-blur border-b border-arena-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
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

          {/* Right Action: Wallet Pill */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/wallet"
              className="flex items-center gap-2 bg-arena-surface border border-arena-border hover:border-arena-primary/60 px-3 py-1.5 rounded-lg text-xs font-mono text-arena-text transition-all shadow-sm"
              title="Manage Throwaway Key"
            >
              <Wallet className="w-3.5 h-3.5 text-arena-accent" />
              <span>{shortAddress}</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/wallet"
              className="flex items-center gap-1 bg-arena-surface border border-arena-border px-2.5 py-1 rounded-md text-xs font-mono text-arena-text"
            >
              <Wallet className="w-3.5 h-3.5 text-arena-accent" />
              <span>{address ? `${address.slice(0, 4)}..` : 'Key'}</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-arena-muted hover:text-white hover:bg-arena-surface focus:outline-none"
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
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
        </div>
      )}
    </nav>
  );
};
