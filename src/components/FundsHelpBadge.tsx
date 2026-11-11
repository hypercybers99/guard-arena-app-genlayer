import React from 'react';
import { useUI } from '../context/UIContext';
import { HelpCircle, Coins } from 'lucide-react';

interface FundsHelpBadgeProps {
  label?: string;
  variant?: 'pill' | 'icon' | 'compact';
}

export const FundsHelpBadge: React.FC<FundsHelpBadgeProps> = ({
  label = '0 GEN Gas Guide',
  variant = 'compact',
}) => {
  const { openFundsGuide } = useUI();

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openFundsGuide}
        title="Zero-balance execution guide on GenLayer Studionet (Preview)"
        aria-label="Open zero-balance execution guide"
        className="inline-flex items-center text-arena-muted hover:text-arena-accent transition-colors p-1 rounded-md focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={openFundsGuide}
        title="Zero-balance execution guide on GenLayer Studionet (Preview)"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
      >
        <Coins className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openFundsGuide}
      title="Zero-balance execution guide on GenLayer Studionet (Preview)"
      className="inline-flex items-center gap-1 text-[11px] font-mono text-arena-muted hover:text-arena-accent transition-colors py-0.5 px-1.5 rounded hover:bg-arena-card focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
    >
      <HelpCircle className="w-3.5 h-3.5 text-arena-accent shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};
